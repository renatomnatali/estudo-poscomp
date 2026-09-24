import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { hash } from 'bcryptjs';

vi.hoisted(() => {
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  delete process.env.TURNSTILE_SECRET_KEY;
  delete process.env.VERCEL_ENV;
});

// Fronteiras mockadas: singleton Prisma. bcrypt (hash/compare), jose,
// limiter em memória e dummy-compare anti-timing rodam REAIS.
const { dbMock } = vi.hoisted(() => ({
  dbMock: {
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    verificationToken: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    passwordResetToken: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({ db: dbMock }));

process.env.JWT_SECRET = 'test-secret-with-at-least-32-chars-xxx';

import { POST } from '@/app/api/auth/login/route';

import { silenceConsole } from '@/tests/test-utils/silence-console';

type Mock = ReturnType<typeof vi.fn>;

const SENHA = 'SenhaForte123';

function post(body: unknown, opts: { ip: string; secFetchSite?: string }) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-real-ip': opts.ip,
  };
  if (opts.secFetchSite) headers['sec-fetch-site'] = opts.secFetchSite;
  return new NextRequest('http://localhost/api/auth/login', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

function usuario(overrides: Partial<{
  id: string;
  email: string;
  passwordHash: string | null;
  emailVerified: Date | null;
  role: 'USER' | 'ADMIN';
}> = {}) {
  return {
    id: 'u-login-1',
    email: 'usuario@teste.com',
    passwordHash: null as string | null,
    emailVerified: null as Date | null,
    role: 'USER' as const,
    ...overrides,
  };
}

beforeEach(async () => {
  dbMock.user.findUnique.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/auth/login', () => {
  it('bloqueia POST cross-site com 403 antes de qualquer lógica', async () => {
    const silence = silenceConsole('log');
    try {
      const response = await POST(
        post({ email: 'usuario@teste.com', password: SENHA }, { ip: '198.51.100.10', secFetchSite: 'evil-site' })
      );

      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({ error: expect.stringMatching(/origem/i) });
      expect(dbMock.user.findUnique).not.toHaveBeenCalled();
    } finally {
      silence.restore();
    }
  });

  it('devolve o MESMO 401 e o MESMO corpo para senha errada e para conta inexistente', async () => {
    const senhaCorreta = await hash(SENHA, 10);
    dbMock.user.findUnique.mockResolvedValueOnce(
      usuario({ passwordHash: senhaCorreta, emailVerified: new Date() })
    );

    const silence = silenceConsole('log');
    try {
      const senhaErrada = await POST(
        post({ email: 'usuario@teste.com', password: 'SenhaErrada1' }, { ip: '198.51.100.11' })
      );
      const contaInexistente = await POST(
        post({ email: 'ghost@teste.com', password: 'SenhaQualquer1' }, { ip: '198.51.100.12' })
      );

      expect(senhaErrada.status).toBe(401);
      expect(contaInexistente.status).toBe(401);
      // Anti-enumeração: corpo idêntico nos dois ramos.
      expect(await senhaErrada.json()).toEqual(await contaInexistente.json());
    } finally {
      silence.restore();
    }
  });

  it('responde 403 com código EMAIL_NOT_VERIFIED e instrução de reenvio quando o e-mail não foi verificado', async () => {
    dbMock.user.findUnique.mockResolvedValueOnce(
      usuario({ passwordHash: await hash(SENHA, 10), emailVerified: null })
    );

    const silence = silenceConsole('log');
    try {
      const response = await POST(
        post({ email: 'usuario@teste.com', password: SENHA }, { ip: '198.51.100.13' })
      );

      expect(response.status).toBe(403);
      const corpo = await response.json();
      expect(corpo.code).toBe('EMAIL_NOT_VERIFIED');
      expect(corpo.error).toMatch(/reenvie/i);
    } finally {
      silence.restore();
    }
  });

  it('autentica com sucesso emitindo cookie session httpOnly de 1h e os dados da conta', async () => {
    dbMock.user.findUnique.mockResolvedValueOnce(
      usuario({ passwordHash: await hash(SENHA, 10), emailVerified: new Date('2026-09-01T00:00:00.000Z') })
    );

    const silence = silenceConsole('log');
    try {
      const response = await POST(
        post({ email: '  Usuario@Teste.COM  ', password: SENHA }, { ip: '198.51.100.14' })
      );

      expect(response.status).toBe(200);
      const corpo = await response.json();
      expect(corpo.user).toMatchObject({
        id: 'u-login-1',
        email: 'usuario@teste.com',
        role: 'USER',
      });
      expect(corpo.user.emailVerified).toBeTruthy();

      const cookie = response.cookies.get('session');
      expect(cookie?.value.split('.')).toHaveLength(3);
      expect(cookie?.httpOnly).toBe(true);
      expect(cookie?.maxAge).toBe(3600);
      expect(cookie?.sameSite).toBe('lax');
    } finally {
      silence.restore();
    }
  });

  it('responde 429 na 11ª tentativa do mesmo IP no minuto (10/min)', async () => {
    dbMock.user.findUnique.mockResolvedValue(null);
    const silence = silenceConsole('log');
    try {
      const ip = '198.51.100.15';
      for (let i = 0; i < 10; i++) {
        const response = await POST(post({ email: `alvo${i}@teste.com`, password: 'SenhaErrada1' }, { ip }));
        expect(response.status).toBe(401);
      }

      const decimaPrimeira = await POST(post({ email: 'alvo@teste.com', password: 'SenhaErrada1' }, { ip }));

      expect(decimaPrimeira.status).toBe(429);
    } finally {
      silence.restore();
    }
  });
});
