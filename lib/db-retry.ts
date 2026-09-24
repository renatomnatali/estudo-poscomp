import { Prisma } from "@prisma/client";

/**
 * Retry de operações Prisma contra falha TRANSITÓRIA de conexão.
 *
 * Espelho do sem-cilada (src/lib/db-retry.ts), trazendo apenas
 * `withDbRetry` + `isTransientConnectionError` — o que login usa.
 * `withSerializableRetry`/`isSerializationFailure` de lá servem a transações
 * `Serializable` com retry, que não existem neste produto.
 *
 * Em serverless sobre Neon/PgBouncer, conexões TCP do pool ficam *stale* entre
 * invocações: a primeira query numa conexão morta lança um erro de conexão.
 * Reexecutar pega uma conexão nova (o Prisma reabre transparentemente). A
 * maioria das rotas se recupera sozinha (re-render/repetição); as que fazem uma
 * única query sem retry — como /api/auth/login — viram 500 sem corpo, e o
 * cliente cai no fallback genérico "Erro na requisição".
 *
 * NUNCA repete erros de lógica/constraint (unique, validação) — só os de
 * conexão. Repetir um insert que violou unique, por exemplo, é incorreto.
 *
 * USO RECOMENDADO: leituras idempotentes. Para ESCRITAS, atenção — P1008
 * (timeout de operação) e erros "Unknown" não garantem que o comando não foi
 * aplicado no servidor; reexecutar pode duplicar efeito. Avalie idempotência
 * antes de envolver mutações.
 */

// Códigos Prisma de falha de CONEXÃO (TCP morta) — retry seguro mesmo em
// escrita, pois o comando não chegou a ser executado:
//   P1001 — não alcançou o servidor
//   P1002 — alcançou mas deu timeout no handshake
//   P1017 — o servidor fechou a conexão
const CONNECTION_ERROR_CODES = new Set(["P1001", "P1002", "P1017"]);

// P1008 (operação excedeu o tempo limite) é separado: a query PODE ter chegado
// ao DB. Seguro repetir em leitura idempotente; em escrita exige cautela.
const OPERATION_TIMEOUT_CODE = "P1008";

// Mensagens de erro inequivocamente de CONEXÃO. Exige a palavra "connection"
// adjacente ao verbo (ou padrões de socket/Neon específicos) para NÃO casar
// falsos positivos como "Transaction already closed" (erro de transação) ou
// "terminated due to conflict with recovery" (conflito WAL) — nenhum é stale.
const CONNECTION_MESSAGE_RE =
  /connection (closed|reset|terminated|refused|lost|error)|error in postgres connection|econnreset|econnrefused|server (has )?closed the connection|can'?t reach database|connection pool/i;

export function isTransientConnectionError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientInitializationError) {
    // Prisma v6 expõe `retryable?: boolean`. Quando explicitamente false
    // (ex.: DATABASE_URL malformada), repetir é inútil e adia o diagnóstico.
    const retryable = (err as { retryable?: boolean }).retryable;
    return retryable !== false;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return (
      CONNECTION_ERROR_CODES.has(err.code) || err.code === OPERATION_TIMEOUT_CODE
    );
  }
  // O driver às vezes embrulha "Error in Postgres connection ..." num
  // PrismaClientUnknownRequestError sem código estável — casa pela mensagem.
  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    return CONNECTION_MESSAGE_RE.test(err.message);
  }
  return false;
}

export async function withDbRetry<T>(
  op: () => Promise<T>,
  { retries = 1, delayMs = 50 }: { retries?: number; delayMs?: number } = {},
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await op();
    } catch (err) {
      lastErr = err;
      if (attempt === retries || !isTransientConnectionError(err)) throw err;
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastErr;
}
