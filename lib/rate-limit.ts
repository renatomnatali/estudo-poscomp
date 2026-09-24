/**
 * Rate limiter com Upstash Redis (produção) e fallback em memória (dev local).
 *
 * Espelho do sem-cilada (src/lib/rate-limit.ts).
 *
 * Usa a mesma instância Redis para todos os ambientes (dev/preview/prod)
 * com prefixo de namespace para evitar colisão.
 */
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { isProduction, readEnv } from "@/lib/env";
import { securityLog } from "@/lib/security-logger";
import { isTrustedProxy } from "@/lib/trusted-proxy";

const ENV_PREFIX =
  process.env.VERCEL_ENV || process.env.NODE_ENV || "development";

// Inicializa Redis se as env vars existirem
function getRedis(): Redis | null {
  const url = readEnv("KV_REST_API_URL");
  const token = readEnv("KV_REST_API_TOKEN");
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = getRedis();

// `npm run build` roda com NODE_ENV=production e sem VERCEL_ENV, então
// `isProduction()` é true e o build local (sem KV_REST_API_* no ambiente)
// emitiria um evento SECURITY que não é degradação de runtime nenhuma, só
// ruído no log de build. NEXT_PHASE distingue build de execução.
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

if (!redis && isProduction() && !isBuildPhase) {
  // securityLog (não console.warn): em serverless o limiter em memória é por
  // instância, ou seja, o teto efetivo vira N× o configurado — degradação na
  // direção PERMISSIVA. Precisa ser evento estruturado para o alerta pegar,
  // não uma linha solta no log. Dispara uma vez por cold start.
  // try/catch obrigatório porque isto roda no ESCOPO DO MÓDULO: múltiplas rotas
  // importam este arquivo, e um throw aqui derrubaria TODAS elas, não só o
  // rate limiting. O catch existe para que uma falha no log nunca derrube o
  // app. NÃO remover.
  try {
    securityLog({
      event: "SYSTEM_RATE_LIMIT_DEGRADED",
      ip: "system",
      detail:
        "KV_REST_API_URL/TOKEN ausentes ou vazias — rate limiting em memória, por instância (ineficaz em serverless)",
    });
  } catch {
    console.warn(
      "[Security] rate limiting degradado para memória (falha ao emitir evento estruturado)",
    );
  }
}

// ─── Fallback em memória (dev local sem Redis) ──────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const MAX_ENTRIES = 10_000;

function createInMemoryLimiter(maxRequests: number, windowMs: number) {
  const store = new Map<string, RateLimitEntry>();

  function cleanup() {
    if (store.size <= MAX_ENTRIES) return;
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }

  return {
    async isLimited(key: string): Promise<boolean> {
      cleanup();
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || now > entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return false;
      }

      entry.count++;
      return entry.count > maxRequests;
    },
  };
}

// ─── Rate limiter principal ─────────────────────────────────────────

export interface RateLimiterOptions {
  /**
   * Comportamento quando o backend (Redis) lança exceção ou está
   * indisponível. `true` = bloqueia o request ("fail-closed"), apropriado
   * para endpoints sensíveis a abuso (login, register). `false`
   * (default) = libera o request ("fail-open"), apropriado para endpoints
   * onde indisponibilidade do rate-limit não pode quebrar UX (consulta,
   * conteúdo). Em ambos os casos, o erro é registrado via securityLog.
   *
   * NOTA: este flag só tem efeito quando o backend Upstash está em uso.
   * Em dev local (sem KV_REST_API_URL/TOKEN), o fallback in-memory roda
   * de forma síncrona e não pode falhar — não há código de erro para
   * `failClosed` interceptar.
   */
  failClosed?: boolean;
  /**
   * Quando o backend (Upstash) lança, em vez de aplicar `failClosed`, degrada
   * para o rate-limiter EM MEMÓRIA (por instância serverless). Pensado para
   * endpoints core de alto volume: durante um outage do Upstash NÃO bloqueia
   * o usuário (≠ `failClosed`, que acopla a disponibilidade do core ao
   * Upstash) E mantém proteção parcial por instância (≠ fail-open puro, que
   * deixa sem proteção nenhuma).
   * Tem PRECEDÊNCIA sobre `failClosed`. Só relevante com Upstash em uso (em
   * dev sem KV o limiter já é in-memory).
   */
  fallbackInMemory?: boolean;
  /**
   * Identificador único do limiter (ex.: "login", "register").
   * Namespeia o bucket no Redis e identifica o limiter no log. OBRIGATÓRIO:
   * sem ele, limiters distintos compartilhariam o mesmo sliding window por
   * IP — endpoints diferentes consumiriam o cap uns dos outros e um fluxo
   * tomaria 429 na primeira tentativa.
   */
  name: string;
}

// Dedup de logs RATE_LIMIT_BACKEND_ERROR por (limiter, mensagem de erro).
// Se Redis cair por minutos com tráfego alto, sem dedup o Vercel Logs
// recebe milhares de linhas idênticas — caro e ruidoso. Janela de 60s.
const BACKEND_ERROR_LOG_WINDOW_MS = 60_000;
const lastBackendErrorLog = new Map<string, number>();

function shouldLogBackendError(name: string, message: string): boolean {
  const key = `${name}::${message}`;
  const now = Date.now();
  const last = lastBackendErrorLog.get(key);
  if (last !== undefined && now - last < BACKEND_ERROR_LOG_WINDOW_MS) {
    return false;
  }
  lastBackendErrorLog.set(key, now);
  // Garbage-collect entradas antigas para evitar growth ilimitado em
  // cenário de muitas mensagens distintas (pouco provável, defensivo).
  if (lastBackendErrorLog.size > 100) {
    for (const [k, ts] of lastBackendErrorLog) {
      if (now - ts >= BACKEND_ERROR_LOG_WINDOW_MS) {
        lastBackendErrorLog.delete(k);
      }
    }
  }
  return true;
}

export function createRateLimiter(
  maxRequests: number,
  windowMs: number,
  options: RateLimiterOptions,
) {
  const failClosed = options.failClosed ?? false;
  const fallbackInMemory = options.fallbackInMemory ?? false;
  const name = options.name;

  if (!redis) {
    // Dev local sem Redis — fallback em memória (sem código de erro
    // a interceptar, `failClosed` é inerte aqui; ver RateLimiterOptions).
    return createInMemoryLimiter(maxRequests, windowMs);
  }

  // Limiter em memória reaproveitado quando o Upstash falha e o caller pediu
  // `fallbackInMemory`. Lazy: só nasce na 1ª falha e é reusado (mantém o
  // sliding window por instância entre requests). Ver isLimited abaixo.
  let memoryFallback: ReturnType<typeof createInMemoryLimiter> | null = null;

  const windowSec = Math.ceil(windowMs / 1000);
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(maxRequests, `${windowSec} s`),
    // Bucket POR LIMITER: sem o name no prefixo, todos os endpoints
    // compartilham um único contador por IP — o sliding window de chave
    // `{prefix}:{ip}` é o mesmo para qualquer limiter de mesma janela.
    // Trocar o prefixo zera contadores vigentes na virada (inofensivo).
    prefix: `${ENV_PREFIX}:ratelimit:${name}`,
    analytics: false,
  });

  return {
    async isLimited(key: string): Promise<boolean> {
      try {
        const { success } = await limiter.limit(key);
        return !success;
      } catch (err) {
        // Redis indisponível ou erro de SDK. Default `@upstash/ratelimit`
        // propaga exceção — sem este catch, o handler quebraria com 500.
        // Capturamos e decidimos pela política do limiter: rotas
        // sensíveis bloqueiam (failClosed), restantes liberam.
        const message = err instanceof Error ? err.message : String(err);
        const mode = fallbackInMemory ? "memory" : failClosed ? "closed" : "open";
        if (shouldLogBackendError(name, message)) {
          securityLog({
            event: "RATE_LIMIT_BACKEND_ERROR",
            detail: `limiter=${name} mode=${mode} error=${message}`,
          });
        }
        // Degradação graciosa: o endpoint continua protegido (por
        // instância) sem ficar refém da disponibilidade do Upstash.
        if (fallbackInMemory) {
          memoryFallback ??= createInMemoryLimiter(maxRequests, windowMs);
          return memoryFallback.isLimited(key);
        }
        return failClosed;
      }
    },
  };
}

// ─── IP helpers ─────────────────────────────────────────────────────

/**
 * Extrai o IP do cliente para chaveamento de rate-limit.
 *
 * `x-real-ip` é preenchido pela plataforma Vercel a partir do IP da conexão e
 * NÃO é spoofável. Mas quando o app está atrás da Cloudflare (apex/www/uat),
 * esse peer é o IP de EGRESS da CF (varia request a request) — o cliente real
 * vem em `cf-connecting-ip`. Só confiamos nesse header quando o peer pertence a
 * um range da Cloudflare; senão (acesso direto a `*.vercel.app`, onde
 * `cf-connecting-ip` seria forjável) usamos `x-real-ip`. Ver trusted-proxy.ts.
 *
 * Fallback final: x-forwarded-for[0] (clients legacy) e "unknown".
 */
export function getClientIp(headers: Headers): string {
  const peer = headers.get("x-real-ip")?.trim();
  if (peer && isTrustedProxy(peer)) {
    const clientReal = headers.get("cf-connecting-ip")?.trim();
    if (clientReal) return clientReal;
  }
  return (
    peer ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}
