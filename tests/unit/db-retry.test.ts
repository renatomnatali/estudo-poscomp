import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { Prisma } from '@prisma/client';

import { isTransientConnectionError, withDbRetry } from '@/lib/db-retry';

// Helpers para construir erros Prisma REAIS (não mocks) — a classificação de
// db-retry usa `instanceof`, então o teste precisa de instâncias autênticas.
// Assinaturas verificadas em @prisma/client/runtime/library.d.ts (Prisma v6):
//   PrismaClientInitializationError(message, clientVersion, errorCode?)
//     — `retryable?: boolean` é propriedade pública da classe, NÃO parâmetro
//       do construtor; setamos na instância após criar.
//   PrismaClientKnownRequestError(message, { code, clientVersion })
//   PrismaClientUnknownRequestError(message, { clientVersion })
function knownError(code: string, message = 'boom'): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError(message, {
    code,
    clientVersion: '6.0.0',
  });
}
function initError(
  message = "can't reach database server",
  retryable?: boolean
): Prisma.PrismaClientInitializationError {
  const err = new Prisma.PrismaClientInitializationError(message, '6.0.0');
  if (retryable !== undefined) {
    err.retryable = retryable;
  }
  return err;
}
function unknownError(message: string): Prisma.PrismaClientUnknownRequestError {
  return new Prisma.PrismaClientUnknownRequestError(message, {
    clientVersion: '6.0.0',
  });
}

describe('isTransientConnectionError', () => {
  describe('PrismaClientInitializationError — campo retryable', () => {
    it('retryable ausente (undefined) é transitório', () => {
      expect(isTransientConnectionError(initError())).toBe(true);
    });

    it('retryable === true é transitório', () => {
      expect(isTransientConnectionError(initError('falha ao iniciar', true))).toBe(true);
    });

    it('retryable === false NÃO é transitório (ex.: DATABASE_URL malformada)', () => {
      expect(isTransientConnectionError(initError('invalid connection string', false))).toBe(false);
    });
  });

  describe('PrismaClientKnownRequestError — códigos', () => {
    it.each(['P1001', 'P1002', 'P1008', 'P1017'])('código de conexão %s é transitório', (code) => {
      expect(isTransientConnectionError(knownError(code))).toBe(true);
    });

    it('NÃO classifica P2002 (unique constraint) como transitório', () => {
      expect(isTransientConnectionError(knownError('P2002'))).toBe(false);
    });

    it('NÃO classifica P2025 (record not found) como transitório', () => {
      expect(isTransientConnectionError(knownError('P2025'))).toBe(false);
    });
  });

  describe('PrismaClientUnknownRequestError — mensagem (regex estrita)', () => {
    it.each([
      'Error in Postgres connection: timeout expired',
      'Connection reset by peer',
      'server has closed the connection',
      'server closed the connection unexpectedly',
      "Can't reach database server at db.neon.tech:5432",
      'connection pool timeout: all connections in use',
    ])("mensagem de conexão '%s' é transitória", (message) => {
      expect(isTransientConnectionError(unknownError(message))).toBe(true);
    });

    it('casa a mensagem de forma case-insensitive', () => {
      expect(isTransientConnectionError(unknownError('CONNECTION RESET BY PEER'))).toBe(true);
    });

    // Falsos positivos que a regex estrita REJEITA — não são conexão stale.
    it("NÃO classifica 'Transaction already closed' (erro de transação) como transitório", () => {
      expect(isTransientConnectionError(unknownError('Transaction already closed: timeout'))).toBe(false);
    });

    it("NÃO classifica 'terminated due to conflict with recovery' (conflito WAL) como transitório", () => {
      expect(isTransientConnectionError(unknownError('terminated due to conflict with recovery'))).toBe(false);
    });

    it('NÃO classifica mensagem sem palavra-chave de conexão como transitório', () => {
      expect(isTransientConnectionError(unknownError('invalid query shape'))).toBe(false);
    });
  });

  describe('não-Prisma e valores inesperados', () => {
    it('NÃO classifica Error genérico como transitório (mesmo com mensagem de conexão)', () => {
      expect(isTransientConnectionError(new Error('connection reset by peer'))).toBe(false);
    });

    it('NÃO classifica valores não-Error (null/string) como transitório', () => {
      expect(isTransientConnectionError(null)).toBe(false);
      expect(isTransientConnectionError('connection reset by peer')).toBe(false);
    });
  });
});

describe('withDbRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('retorna o resultado na 1ª tentativa sem repetir a operação', async () => {
    const op = vi.fn(async () => 'ok');

    const result = await withDbRetry(op);

    expect(result).toBe('ok');
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('repete após erro transitório e tem sucesso na 2ª tentativa', async () => {
    const op = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(knownError('P1001'))
      .mockResolvedValueOnce('recuperado');

    const promise = withDbRetry(op, { retries: 1, delayMs: 50 });
    // Avança o setTimeout(delayMs) sem esperar tempo real.
    await vi.advanceTimersByTimeAsync(50);

    await expect(promise).resolves.toBe('recuperado');
    expect(op).toHaveBeenCalledTimes(2);
  });

  it('esgota os retries e propaga o ÚLTIMO erro transitório', async () => {
    const primeiro = knownError('P1001', 'primeiro');
    const ultimo = knownError('P1002', 'último');
    const op = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(primeiro)
      .mockRejectedValueOnce(ultimo);

    const promise = withDbRetry(op, { retries: 1, delayMs: 50 });
    // Captura a rejeição ANTES de avançar timers para não vazar unhandled rejection.
    const assertion = expect(promise).rejects.toBe(ultimo);
    await vi.advanceTimersByTimeAsync(50);
    await assertion;

    expect(op).toHaveBeenCalledTimes(2);
  });

  it('erro NÃO-transitório (P2002 unique) propaga imediatamente sem retry', async () => {
    const unique = knownError('P2002', 'duplicate key');
    const op = vi.fn<() => Promise<string>>().mockRejectedValue(unique);

    await expect(withDbRetry(op, { retries: 3, delayMs: 50 })).rejects.toBe(unique);
    // Sem retry: a operação rodou exatamente uma vez.
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('respeita retries=2: tenta 3 vezes no total antes de propagar', async () => {
    const op = vi.fn<() => Promise<string>>().mockRejectedValue(initError());

    const promise = withDbRetry(op, { retries: 2, delayMs: 50 });
    const assertion = expect(promise).rejects.toBeInstanceOf(Prisma.PrismaClientInitializationError);
    await vi.advanceTimersByTimeAsync(50); // após 1ª falha
    await vi.advanceTimersByTimeAsync(50); // após 2ª falha
    await assertion;

    expect(op).toHaveBeenCalledTimes(3);
  });

  it('não dorme quando delayMs=0 (recupera sem avançar timers)', async () => {
    const op = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(initError())
      .mockResolvedValueOnce('ok');

    // Sem delay não há setTimeout pendente — resolve direto.
    await expect(withDbRetry(op, { retries: 1, delayMs: 0 })).resolves.toBe('ok');
    expect(op).toHaveBeenCalledTimes(2);
  });

  it('NÃO repete conflito de serialização (P2034 não é falha de conexão neste produto)', async () => {
    // A separação é intencional: repetir conflito de serialização reexecuta a
    // transação inteira, não a query — aqui ele simplesmente não é transitório
    // e propaga na hora. Se alguém enfiar P2034 na lista de conexão, fica vermelho.
    const conflito = knownError('P2034', 'write conflict or a deadlock');
    const op = vi.fn<() => Promise<string>>().mockRejectedValue(conflito);

    await expect(withDbRetry(op, { retries: 3, delayMs: 0 })).rejects.toBe(conflito);
    expect(op).toHaveBeenCalledTimes(1);
  });
});
