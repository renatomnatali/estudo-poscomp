import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Ajuste de env ANTES de qualquer import avaliar os módulos das rotas:
// sem KV_* o limiter nasce em memória (determinístico, sem Redis); sem
// TURNSTILE_SECRET_KEY em NODE_ENV=test o desafio faz bypass de dev.
vi.hoisted(() => {
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  delete process.env.TURNSTILE_SECRET_KEY;
  delete process.env.VERCEL_ENV;
});

// Fronteiras mockadas: singleton Prisma (@/lib/db) e o SDK do Resend.
// A rota inteira (bcrypt, limiter em memória, turnstile bypass, templates,
// app-url, normalização) roda REAL.
const { dbMock, sdkSendMock } = vi.hoisted(() => ({
  dbMock: {
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    verificationToken: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    passwordResetToken: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    $transaction: vi.fn(),
  },
  sdkSendMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ db: dbMock }));
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sdkSendMock };
  },
}));

process.env.JWT_SECRET = 'test-secret-with-at-least-32-chars-xxx';

import { POST } from '@/app/api/auth/register/route';

import { silenceConsole } from '@/tests/test-utils/silence-console';

type Mock = ReturnType<typeof vi.fn>;

function post(body: unknown, opts: { ip: string; secFetchSite?: string } ) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-real-ip': opts.ip,
  };
  if (opts.secFetchSite) headers['sec-fetch-site'] = opts.secFetchSite;
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  dbMock.user.findUnique.mockReset().mockResolvedValue(null);
  dbMock.user.create.mockReset().mockResolvedValue({ id: 'u-novo', email: 'novo@teste.com' });
  dbMock.verificationToken.create.mockReset().mockResolvedValue({});
  sdkSendMock.mockReset().mockResolvedValue({ data: { id: 'envio-1' }, error: null });
  vi.stubEnv('RESEND_API_KEY', 're_chave_de_teste');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/auth/register', () => {
  it('bloqueia POST cross-site com 403 antes de qualquer lógica', async () => {
    const silence = silenceConsole('log');
    try {
      const response = await POST(
        post({ email: 'alvo@teste.com', password: 'SenhaForte123' }, { ip: '203.0.113.10', secFetchSite: 'cross-site' })
      );

      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({ error: expect.stringMatching(/origem/i) });
      // Antes de qualquer lógica: nem lookup nem criação aconteceram.
      expect(dbMock.user.findUnique).not.toHaveBeenCalled();
      expect(dbMock.user.create).not.toHaveBeenCalled();
    } finally {
      silence.restore();
    }
  });

  it('informa explicitamente quando o e-mail já está cadastrado com senha', async () => {
    dbMock.user.findUnique.mockResolvedValue({ id: 'u-existente', email: 'ja@cadastrado.com' });
    const silence = silenceConsole('log');
    try {
      const response = await POST(
        post({ email: 'ja@cadastrado.com', password: 'SenhaForte123' }, { ip: '203.0.113.11' })
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ outcome: 'already_registered' });
      expect(dbMock.user.create).not.toHaveBeenCalled();
    } finally {
      silence.restore();
    }
  });

  it('cadastra com sucesso, gera token de 24h, envia e-mail e NÃO emite sessão', async () => {
    const antes = Date.now();
    const silence = silenceConsole('log');
    try {
      const response = await POST(
        post({ email: 'novo@teste.com', password: 'SenhaForte123' }, { ip: '203.0.113.12' })
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ outcome: 'verify_email' });

      // Sem login automático: nenhum cookie de sessão na resposta.
      expect(response.headers.get('set-cookie')).toBeNull();

      // Conta criada com passwordChangedAt = agora (invalidação uniforme).
      const createArgs = (dbMock.user.create as Mock).mock.calls[0][0];
      expect(createArgs.data.email).toBe('novo@teste.com');
      expect(createArgs.data.passwordChangedAt).toBeInstanceOf(Date);
      expect(createArgs.data.passwordHash).toMatch(/^\$2[aby]\$/);

      // Token de verificação de 24h (janela com tolerância de execução).
      const tokenArgs = (dbMock.verificationToken.create as Mock).mock.calls[0][0];
      expect(tokenArgs.data.userId).toBe('u-novo');
      expect(tokenArgs.data.token).toMatch(/^[0-9a-f]{64}$/);
      const validadeHoras = (tokenArgs.data.expiresAt.getTime() - antes) / 3_600_000;
      expect(validadeHoras).toBeGreaterThan(23.9);
      expect(validadeHoras).toBeLessThan(24.1);

      // E-mail de verificação enviado ao endereço da conta.
      expect(sdkSendMock).toHaveBeenCalledTimes(1);
      expect(sdkSendMock.mock.calls[0][0]).toMatchObject({ to: 'novo@teste.com' });
    } finally {
      silence.restore();
    }
  });

  it('normaliza o e-mail antes do lookup e da gravação', async () => {
    const silence = silenceConsole('log');
    try {
      const response = await POST(
        post({ email: '  Fulano@Exemplo.COM  ', password: 'SenhaForte123' }, { ip: '203.0.113.13' })
      );

      expect(response.status).toBe(200);
      expect((dbMock.user.findUnique as Mock).mock.calls[0][0]).toEqual({
        where: { email: 'fulano@exemplo.com' },
      });
      expect((dbMock.user.create as Mock).mock.calls[0][0].data.email).toBe('fulano@exemplo.com');
    } finally {
      silence.restore();
    }
  });

  it('mantém o cadastro concluído quando o envio do e-mail de verificação falha', async () => {
    // Fronteira de e-mail caída não bloqueia o registro: a conta existe, o
    // token existe e o usuário pode pedir reenvio depois.
    sdkSendMock.mockRejectedValue(new Error('resend down'));

    const silence = silenceConsole('log', 'error');
    try {
      const response = await POST(
        post({ email: 'sem-email@teste.com', password: 'SenhaForte123' }, { ip: '203.0.113.15' })
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ outcome: 'verify_email' });
      expect(dbMock.user.create).toHaveBeenCalledTimes(1);
      expect(dbMock.verificationToken.create).toHaveBeenCalledTimes(1);
    } finally {
      silence.restore();
    }
  });

  it('responde 429 na 6ª tentativa do mesmo IP no minuto (5/min)', async () => {
    const silence = silenceConsole('log');
    try {
      const ip = '203.0.113.14';
      for (let i = 0; i < 5; i++) {
        const response = await POST(post({ email: `novo${i}@teste.com`, password: 'SenhaForte123' }, { ip }));
        expect(response.status).toBe(200);
      }

      const sexta = await POST(post({ email: 'estoura@teste.com', password: 'SenhaForte123' }, { ip }));

      expect(sexta.status).toBe(429);
      // As 5 primeiras criaram conta; a 6ª não chegou ao banco.
      expect(dbMock.user.create).toHaveBeenCalledTimes(5);
    } finally {
      silence.restore();
    }
  });
});
