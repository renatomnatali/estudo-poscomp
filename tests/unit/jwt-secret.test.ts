import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

import { silenceConsole } from '@/tests/test-utils/silence-console';

// getSecret() cacheia o secret em variável de módulo (_secret). Cada teste
// precisa de módulo fresco para reativar a validação lazy com o env do caso.
const ORIG_ENV = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  process.env = { ...ORIG_ENV };
  // VERCEL_ENV no shell do dev não pode vazar para o teste: a detecção de
  // produção precisa ser decidida só pelo NODE_ENV stubado em cada caso.
  delete process.env.VERCEL_ENV;
});

afterEach(() => {
  vi.unstubAllEnvs();
  process.env = { ...ORIG_ENV };
});

describe('__internals.isStrongSecret', () => {
  it('aceita 64 chars puramente hex (formato `openssl rand -hex 32`)', async () => {
    const { __internals } = await import('@/lib/jwt-secret');
    expect(__internals.isStrongSecret('0123456789abcdef'.repeat(4))).toBe(true);
  });

  it('aceita 32+ chars com entropia >= 4 bits/char', async () => {
    const { __internals } = await import('@/lib/jwt-secret');
    expect(__internals.isStrongSecret('Xk7pQm2vR8nT4yL3wB6sF9aH5jD1cZ0e')).toBe(true);
  });

  it('rejeita string curta (< 32 chars)', async () => {
    const { __internals } = await import('@/lib/jwt-secret');
    expect(__internals.isStrongSecret('short')).toBe(false);
  });

  it('rejeita 32+ chars com baixa entropia (repetição)', async () => {
    const { __internals } = await import('@/lib/jwt-secret');
    expect(__internals.isStrongSecret('a'.repeat(16) + 'b'.repeat(16))).toBe(false);
  });

  it('rejeita placeholder de 32 chars (entropia abaixo do piso)', async () => {
    const { __internals } = await import('@/lib/jwt-secret');
    expect(__internals.isStrongSecret('your-jwt-secret-here-placeholder')).toBe(false);
  });
});

describe('getSecret — produção (fail-fast, sem fallback)', () => {
  it('falha na inicialização quando JWT_SECRET ausente', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    delete process.env.JWT_SECRET;
    const { getSecret } = await import('@/lib/jwt-secret');
    expect(() => getSecret()).toThrow(/JWT_SECRET deve estar definido/);
  });

  it('falha quando JWT_SECRET tem menos de 32 caracteres', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.JWT_SECRET = 'curto-demais';
    const { getSecret } = await import('@/lib/jwt-secret');
    expect(() => getSecret()).toThrow(/pelo menos 32 caracteres/);
  });

  it('falha quando JWT_SECRET tem 32+ chars mas entropia baixa (placeholder)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.JWT_SECRET = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const { getSecret } = await import('@/lib/jwt-secret');
    expect(() => getSecret()).toThrow(/baixa entropia/);
  });

  it('aceita JWT_SECRET de 64 chars hex (formato canônico do openssl)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.JWT_SECRET =
      '9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a';
    const { getSecret } = await import('@/lib/jwt-secret');
    expect(() => getSecret()).not.toThrow();
    expect(getSecret()).toBeInstanceOf(Uint8Array);
  });

  it('aceita JWT_SECRET com 32+ chars e entropia suficiente', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.JWT_SECRET = 'Xk7pQm2vR8nT4yL3wB6sF9aH5jD1cZ0e';
    const { getSecret } = await import('@/lib/jwt-secret');
    expect(() => getSecret()).not.toThrow();
  });
});

describe('getSecret — desenvolvimento', () => {
  it('gera secret efêmero de 32 bytes quando JWT_SECRET ausente, avisando no console', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    delete process.env.JWT_SECRET;
    const silence = silenceConsole('warn');
    try {
      const { getSecret } = await import('@/lib/jwt-secret');
      const secret = getSecret();
      expect(secret).toBeInstanceOf(Uint8Array);
      expect(secret.length).toBe(32);
      const avisou = silence.calls.some((call) =>
        String(call[0] ?? '').includes('JWT_SECRET não definido')
      );
      expect(avisou).toBe(true);
    } finally {
      silence.restore();
    }
  });

  it('aceita JWT_SECRET fraco em dev (validação de entropia é só para produção)', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    process.env.JWT_SECRET = 'dev-secret-fraco-mas-aceito-em-dev';
    const { getSecret } = await import('@/lib/jwt-secret');
    expect(() => getSecret()).not.toThrow();
  });

  it('cacheia o secret entre chamadas (mesma instância no mesmo boot)', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    process.env.JWT_SECRET = 'test-secret-with-at-least-32-chars-xxx';
    const { getSecret } = await import('@/lib/jwt-secret');
    expect(getSecret()).toBe(getSecret());
  });
});
