import { describe, expect, it, beforeEach, vi } from 'vitest';

vi.hoisted(() => {
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  delete process.env.TURNSTILE_SECRET_KEY;
  delete process.env.VERCEL_ENV;
});

// Fronteiras mockadas: singleton Prisma e cookies do Next (next/headers).
// A sessão inteira roda REAL: signToken/verifySessionWithDb (jose) validam
// de verdade o cookie contra o estado do banco mockado.
const { dbMock, cookiesMock } = vi.hoisted(() => ({
  dbMock: {
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    verificationToken: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    passwordResetToken: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    $transaction: vi.fn(),
  },
  cookiesMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ db: dbMock }));
vi.mock('next/headers', () => ({ cookies: cookiesMock }));

process.env.JWT_SECRET = 'test-secret-with-at-least-32-chars-xxx';

import { GET as getMe } from '@/app/api/auth/me/route';
import { POST as postLogout } from '@/app/api/auth/logout/route';
import { signToken } from '@/lib/auth';

import { NextRequest } from 'next/server';

import { silenceConsole } from '@/tests/test-utils/silence-console';

const usuarioAtivo = {
  id: 'user-9',
  email: 'sessao@teste.com',
  passwordHash: 'hash',
  passwordChangedAt: null,
  deletedAt: null,
  emailVerified: new Date('2026-09-01T00:00:00.000Z'),
  role: 'USER' as const,
};

beforeEach(() => {
  cookiesMock.mockReset().mockResolvedValue({ get: () => undefined });
  dbMock.user.findUnique.mockReset().mockResolvedValue(usuarioAtivo);
});

describe('GET /api/auth/me', () => {
  it('responde 204 sem corpo quando não há cookie de sessão', async () => {
    const response = await getMe();

    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
  });

  it('devolve os dados da conta quando o cookie carrega sessão válida', async () => {
    // Token assinado de verdade — getSession valida assinatura + estado do
    // banco (existe, ativo, role igual) antes de responder.
    const token = await signToken({
      sub: 'user-9',
      email: 'sessao@teste.com',
      emailVerified: true,
      role: 'USER',
    });
    cookiesMock.mockResolvedValue({ get: () => ({ value: token }) });

    const silence = silenceConsole('log');
    try {
      const response = await getMe();

      expect(response.status).toBe(200);
      const corpo = await response.json();
      expect(corpo).toMatchObject({
        id: 'user-9',
        email: 'sessao@teste.com',
        role: 'USER',
      });
      expect(corpo.emailVerified).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
    } finally {
      silence.restore();
    }
  });

  it('responde 404 quando a conta some entre a validação da sessão e o fetch dos dados', async () => {
    // Janela real que o 404 cobre: a conta estava ativa na validação da
    // sessão (1ª query) e foi deletada antes do fetch dos dados (2ª query).
    const token = await signToken({
      sub: 'user-9',
      email: 'sessao@teste.com',
      emailVerified: true,
      role: 'USER',
    });
    cookiesMock.mockResolvedValue({ get: () => ({ value: token }) });
    dbMock.user.findUnique.mockReset().mockResolvedValueOnce(usuarioAtivo).mockResolvedValueOnce(null);

    const response = await getMe();

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: expect.stringMatching(/não encontrado/i) });
  });

  it('responde 204 quando a sessão foi invalidada por troca de senha', async () => {
    // Cookie emitido, senha trocada depois: o banco mockado reflete o novo
    // passwordChangedAt e a sessão não vale mais — sem erro, tela decide.
    const token = await signToken({
      sub: 'user-9',
      email: 'sessao@teste.com',
      emailVerified: true,
      role: 'USER',
    });
    cookiesMock.mockResolvedValue({ get: () => ({ value: token }) });
    dbMock.user.findUnique.mockResolvedValue({
      ...usuarioAtivo,
      passwordChangedAt: new Date(Date.now() + 60_000),
    });

    const response = await getMe();

    expect(response.status).toBe(204);
  });
});

describe('POST /api/auth/logout', () => {
  it('limpa o cookie de sessão (valor vazio, maxAge 0)', async () => {
    const silence = silenceConsole('log');
    try {
      const response = await postLogout(
        new NextRequest('http://localhost/api/auth/logout', {
          method: 'POST',
          headers: { 'sec-fetch-site': 'same-origin' },
        })
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ ok: true });

      const cookie = response.cookies.get('session');
      expect(cookie?.value).toBe('');
      expect(cookie?.maxAge).toBe(0);
    } finally {
      silence.restore();
    }
  });
});
