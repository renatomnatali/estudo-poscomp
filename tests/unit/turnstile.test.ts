import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

import { silenceConsole } from '@/tests/test-utils/silence-console';

// Fronteira externa: o endpoint siteverify da Cloudflare (fetch global
// mockado). verifyTurnstile roda real — o contrato fail-closed é o alvo.
import { verifyTurnstile } from '@/lib/turnstile';

const ORIG_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIG_ENV };
  delete process.env.TURNSTILE_SECRET_KEY;
  delete process.env.VERCEL_ENV;
});

afterEach(() => {
  process.env = { ...ORIG_ENV };
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('verifyTurnstile — com secret configurada', () => {
  it('aceita quando a Cloudflare responde success=true', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'secret-teste';
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        json: async () => ({ success: true }),
      })) as unknown as typeof fetch
    );

    expect(await verifyTurnstile('token-valido', '1.2.3.4')).toBe(true);
  });

  it('recusa quando a Cloudflare responde success=false', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'secret-teste';
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] }),
      })) as unknown as typeof fetch
    );

    expect(await verifyTurnstile('token-invalido')).toBe(false);
  });

  it('recusa (fail-closed) quando a chamada à Cloudflare falha na rede', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'secret-teste';
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network timeout');
      }) as unknown as typeof fetch
    );

    const silence = silenceConsole('error');
    try {
      expect(await verifyTurnstile('qualquer-token')).toBe(false);
    } finally {
      silence.restore();
    }
  });

  it('envia secret, response e remoteip ao endpoint oficial da Cloudflare', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'minha-secret';
    const fetchMock = vi.fn(async () => ({
      json: async () => ({ success: true }),
    }));
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    await verifyTurnstile('token-do-usuario', '203.0.113.5');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    expect(init.method).toBe('POST');
    const body = init.body as URLSearchParams;
    expect(body.get('secret')).toBe('minha-secret');
    expect(body.get('response')).toBe('token-do-usuario');
    expect(body.get('remoteip')).toBe('203.0.113.5');
  });
});

describe('verifyTurnstile — sem TURNSTILE_SECRET_KEY (config ausente)', () => {
  it('em produção: retorna false (fail-closed por desenho)', async () => {
    process.env.VERCEL_ENV = 'production';
    const silence = silenceConsole('error');
    try {
      expect(await verifyTurnstile('qualquer-token')).toBe(false);
      const logou = silence.calls.some((call) =>
        String(call[0] ?? '').includes('não configurada em produção')
      );
      expect(logou).toBe(true);
    } finally {
      silence.restore();
    }
  });

  it('em preview da Vercel: faz bypass para não derrubar a auth do PR preview', async () => {
    process.env.VERCEL_ENV = 'preview';
    const silence = silenceConsole('warn');
    try {
      expect(await verifyTurnstile('qualquer-token')).toBe(true);
    } finally {
      silence.restore();
    }
  });

  it('em dev: bypass silencioso', async () => {
    expect(await verifyTurnstile('qualquer-token')).toBe(true);
  });
});
