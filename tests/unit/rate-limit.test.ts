import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

import { silenceConsole } from '@/tests/test-utils/silence-console';

// `redis` nasce no escopo do módulo lendo KV_REST_API_URL/TOKEN. Para o
// fallback em memória, garantimos que essas envs estejam ausentes antes do
// import; para o caminho Upstash, setamos as envs e mockamos o SDK
// (fronteira externa) — o createRateLimiter roda real.
const ORIG_ENV = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  process.env = { ...ORIG_ENV };
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
});

afterEach(() => {
  vi.unstubAllEnvs();
  process.env = { ...ORIG_ENV };
  vi.useRealTimers();
});

describe('createRateLimiter — fallback em memória (sem Upstash)', () => {
  it('limita por janela: libera até N chamadas e bloqueia a N+1 do mesmo cliente', async () => {
    const { createRateLimiter } = await import('@/lib/rate-limit');
    const limiter = createRateLimiter(3, 60_000, { name: 'test-janela' });

    expect(await limiter.isLimited('ip-1')).toBe(false);
    expect(await limiter.isLimited('ip-1')).toBe(false);
    expect(await limiter.isLimited('ip-1')).toBe(false);
    // 4ª chamada dentro da janela estoura o limite.
    expect(await limiter.isLimited('ip-1')).toBe(true);
    // E continua bloqueada até a janela virar.
    expect(await limiter.isLimited('ip-1')).toBe(true);
  });

  it('isola contadores por chave: esgotar um cliente não bloqueia outro', async () => {
    const { createRateLimiter } = await import('@/lib/rate-limit');
    const limiter = createRateLimiter(2, 60_000, { name: 'test-isolamento' });

    expect(await limiter.isLimited('ip-1')).toBe(false);
    expect(await limiter.isLimited('ip-1')).toBe(false);
    expect(await limiter.isLimited('ip-1')).toBe(true);

    expect(await limiter.isLimited('ip-2')).toBe(false);
  });

  it('reseta o contador quando a janela expira', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    const { createRateLimiter } = await import('@/lib/rate-limit');
    const limiter = createRateLimiter(2, 1_000, { name: 'test-reset' });

    expect(await limiter.isLimited('ip-1')).toBe(false);
    expect(await limiter.isLimited('ip-1')).toBe(false);
    expect(await limiter.isLimited('ip-1')).toBe(true);

    vi.advanceTimersByTime(1_500);

    // Nova janela: o cliente volta a ter crédito.
    expect(await limiter.isLimited('ip-1')).toBe(false);
    expect(await limiter.isLimited('ip-1')).toBe(false);
    expect(await limiter.isLimited('ip-1')).toBe(true);
  });

  it('limiters distintos (names diferentes) não compartilham contagem para o mesmo IP', async () => {
    // Regressão do bucket compartilhado: sem o name no prefixo, fluxos
    // distintos consumiriam o cap uns dos outros.
    const { createRateLimiter } = await import('@/lib/rate-limit');
    const login = createRateLimiter(2, 60_000, { name: 'test-login' });
    const register = createRateLimiter(2, 60_000, { name: 'test-register' });

    expect(await login.isLimited('ip-1')).toBe(false);
    expect(await login.isLimited('ip-1')).toBe(false);
    expect(await login.isLimited('ip-1')).toBe(true);

    expect(await register.isLimited('ip-1')).toBe(false);
  });
});

describe('createRateLimiter — backend Upstash em uso (SDK mockado na fronteira)', () => {
  function mockarSdkUpstash(comportamentoDoLimit: ReturnType<typeof vi.fn>) {
    vi.doMock('@upstash/ratelimit', () => ({
      Ratelimit: class {
        static slidingWindow() {
          return {};
        }
        limit = comportamentoDoLimit;
      },
    }));
    vi.doMock('@upstash/redis', () => ({
      Redis: class {},
    }));
  }

  function ativarUpstash() {
    process.env.KV_REST_API_URL = 'https://fake.upstash.io';
    process.env.KV_REST_API_TOKEN = 'fake-token';
  }

  it('propaga a decisão do backend quando o Redis responde', async () => {
    ativarUpstash();
    const limitMock = vi.fn().mockResolvedValue({ success: true });
    mockarSdkUpstash(limitMock);

    const { createRateLimiter } = await import('@/lib/rate-limit');
    const limiter = createRateLimiter(5, 60_000, { name: 'test-backend-ok' });

    expect(await limiter.isLimited('ip-x')).toBe(false);
    expect(limitMock).toHaveBeenCalledWith('ip-x');
  });

  it('failClosed NEGA a chamada quando o Redis está fora (erro do backend)', async () => {
    ativarUpstash();
    mockarSdkUpstash(vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));

    const silence = silenceConsole('log');
    try {
      const { createRateLimiter } = await import('@/lib/rate-limit');
      const limiter = createRateLimiter(5, 60_000, {
        failClosed: true,
        name: 'test-fail-closed',
      });

      // Fail-closed: indisponibilidade do Redis não vira porta aberta.
      expect(await limiter.isLimited('ip-x')).toBe(true);

      const logouErroBackend = silence.calls.some((call) =>
        String(call[0] ?? '').includes('RATE_LIMIT_BACKEND_ERROR')
      );
      expect(logouErroBackend).toBe(true);
    } finally {
      silence.restore();
    }
  });

  it('sem failClosed (default fail-open) a chamada é liberada quando o Redis falha', async () => {
    ativarUpstash();
    mockarSdkUpstash(vi.fn().mockRejectedValue(new Error('timeout')));

    const silence = silenceConsole('log');
    try {
      const { createRateLimiter } = await import('@/lib/rate-limit');
      const limiter = createRateLimiter(5, 60_000, { name: 'test-fail-open' });

      expect(await limiter.isLimited('ip-x')).toBe(false);
    } finally {
      silence.restore();
    }
  });

  it('fallbackInMemory degrada para contagem local: mantém proteção parcial sem bloquear todo mundo', async () => {
    ativarUpstash();
    mockarSdkUpstash(vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));

    const silence = silenceConsole('log');
    try {
      const { createRateLimiter } = await import('@/lib/rate-limit');
      const limiter = createRateLimiter(2, 60_000, {
        fallbackInMemory: true,
        failClosed: true,
        name: 'test-fallback-memory',
      });

      // Diferente de failClosed puro (que negaria a 1ª): a degradação
      // in-memory libera dentro do cap e bloqueia quem estourar.
      expect(await limiter.isLimited('ip-core')).toBe(false);
      expect(await limiter.isLimited('ip-core')).toBe(false);
      expect(await limiter.isLimited('ip-core')).toBe(true);
    } finally {
      silence.restore();
    }
  });
});

describe('getClientIp — extração de IP para chaveamento', () => {
  it('prefere x-real-ip (preenchido pela plataforma, não spoofável)', async () => {
    const { getClientIp } = await import('@/lib/rate-limit');
    const headers = new Headers({
      'x-real-ip': '1.2.3.4',
      'x-forwarded-for': 'evil.spoof, 5.6.7.8',
    });
    expect(getClientIp(headers)).toBe('1.2.3.4');
  });

  it('usa o primeiro IP de x-forwarded-for quando x-real-ip ausente, com trim', async () => {
    const { getClientIp } = await import('@/lib/rate-limit');
    const headers = new Headers({ 'x-forwarded-for': '   10.0.0.5  , 1.1.1.1' });
    expect(getClientIp(headers)).toBe('10.0.0.5');
  });

  it('retorna "unknown" quando nenhum header de IP está presente', async () => {
    const { getClientIp } = await import('@/lib/rate-limit');
    expect(getClientIp(new Headers())).toBe('unknown');
  });
});

describe('getClientIp — atrás da Cloudflare (trusted-proxy real, sem mock)', () => {
  // A interação getClientIp + isTrustedProxy É a defesa sob teste: só confiar
  // em cf-connecting-ip quando o peer pertence à Cloudflare. Mockar
  // isTrustedProxy provaria o mock, não a defesa (AP5).

  it('peer na Cloudflare: usa cf-connecting-ip (cliente real, não o egress variável da CF)', async () => {
    const { getClientIp } = await import('@/lib/rate-limit');
    const headers = new Headers({
      'x-real-ip': '172.68.1.1',
      'cf-connecting-ip': '200.1.2.3',
    });
    expect(getClientIp(headers)).toBe('200.1.2.3');
  });

  it('egress CF diferente com o mesmo cliente real: continua acumulando no MESMO contador', async () => {
    const { getClientIp } = await import('@/lib/rate-limit');
    const headers = new Headers({
      'x-real-ip': '104.16.9.9',
      'cf-connecting-ip': '200.1.2.3',
    });
    expect(getClientIp(headers)).toBe('200.1.2.3');
  });

  it('acesso direto com cf-connecting-ip FORJADO: ignora o header e usa x-real-ip', async () => {
    const { getClientIp } = await import('@/lib/rate-limit');
    const headers = new Headers({
      'x-real-ip': '203.0.113.50',
      'cf-connecting-ip': '1.1.1.1',
    });
    expect(getClientIp(headers)).toBe('203.0.113.50');
  });
});
