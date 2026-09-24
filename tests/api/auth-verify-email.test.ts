import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// O mock de `after` do next/server mora neste helper — precisa ser o
// PRIMEIRO import para valer antes da rota carregar.
import { setupAfterMock } from '@/tests/test-utils/after-mock';

const { flushAfter } = setupAfterMock();

vi.hoisted(() => {
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  delete process.env.TURNSTILE_SECRET_KEY;
  delete process.env.VERCEL_ENV;
});

// Fronteiras mockadas: singleton Prisma e SDK do Resend. Limitadores em
// memória, tokens crypto e templates rodam REAIS.
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

import { POST as postVerifyEmail } from '@/app/api/auth/verify-email/route';
import { POST as postResendVerification } from '@/app/api/auth/resend-verification/route';

import { silenceConsole } from '@/tests/test-utils/silence-console';

type Mock = ReturnType<typeof vi.fn>;

const TOKEN = 'a'.repeat(64);

function requisicao(url: string, body: unknown, opts: { ip: string }) {
  return new NextRequest(`http://localhost${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-real-ip': opts.ip,
      'sec-fetch-site': 'same-origin',
    },
    body: JSON.stringify(body),
  });
}

function tokenVerificacao(overrides: Partial<{ usedAt: Date | null; expiresAt: Date }> = {}) {
  return {
    userId: 'u-verify-1',
    token: TOKEN,
    usedAt: null as Date | null,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    ...overrides,
  };
}

beforeEach(() => {
  dbMock.verificationToken.findUnique.mockReset();
  dbMock.verificationToken.update.mockReset();
  dbMock.verificationToken.updateMany.mockReset().mockResolvedValue({});
  dbMock.verificationToken.create.mockReset().mockResolvedValue({});
  dbMock.user.findUnique.mockReset();
  dbMock.user.update.mockReset();
  dbMock.$transaction.mockReset().mockImplementation(async (arg: unknown) => {
    // Batch mode (verify-email): executa as operações do array em ordem.
    if (Array.isArray(arg)) {
      for (const op of arg) await op;
      return;
    }
    return (arg as (tx: unknown) => Promise<unknown>)(dbMock);
  });
  sdkSendMock.mockReset().mockResolvedValue({ data: { id: 'envio-1' }, error: null });
  vi.stubEnv('RESEND_API_KEY', 're_chave_de_teste');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/auth/verify-email', () => {
  it('marca emailVerified e consome o token na MESMA transação', async () => {
    dbMock.verificationToken.findUnique.mockResolvedValueOnce(tokenVerificacao());
    const silence = silenceConsole('log');
    try {
      const response = await postVerifyEmail(
        requisicao('/api/auth/verify-email', { token: TOKEN }, { ip: '192.0.2.10' })
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ verified: true });

      // Uma única transação carregando AMBOS os writes.
      expect(dbMock.$transaction).toHaveBeenCalledTimes(1);
      const operacoes = (dbMock.$transaction as Mock).mock.calls[0][0];
      expect(Array.isArray(operacoes)).toBe(true);
      expect(operacoes).toHaveLength(2);

      expect(dbMock.user.update).toHaveBeenCalledTimes(1);
      expect((dbMock.user.update as Mock).mock.calls[0][0]).toEqual({
        where: { id: 'u-verify-1' },
        data: { emailVerified: expect.any(Date) },
      });
      expect(dbMock.verificationToken.update).toHaveBeenCalledTimes(1);
      expect((dbMock.verificationToken.update as Mock).mock.calls[0][0]).toEqual({
        where: { token: TOKEN },
        data: { usedAt: expect.any(Date) },
      });
    } finally {
      silence.restore();
    }
  });

  it('rejeita com 400 o reuso de token já consumido, sem nenhum write', async () => {
    dbMock.verificationToken.findUnique.mockResolvedValueOnce(tokenVerificacao({ usedAt: new Date() }));
    const silence = silenceConsole('log');
    try {
      const response = await postVerifyEmail(
        requisicao('/api/auth/verify-email', { token: TOKEN }, { ip: '192.0.2.11' })
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ error: expect.stringMatching(/inválido|utilizado/i) });
      expect(dbMock.$transaction).not.toHaveBeenCalled();
      expect(dbMock.user.update).not.toHaveBeenCalled();
    } finally {
      silence.restore();
    }
  });

  it('rejeita com 400 token expirado, sem nenhum write', async () => {
    dbMock.verificationToken.findUnique.mockResolvedValueOnce(
      tokenVerificacao({ expiresAt: new Date(Date.now() - 60_000) })
    );
    const silence = silenceConsole('log');
    try {
      const response = await postVerifyEmail(
        requisicao('/api/auth/verify-email', { token: TOKEN }, { ip: '192.0.2.12' })
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ error: expect.stringMatching(/expirado/i) });
      expect(dbMock.$transaction).not.toHaveBeenCalled();
      expect(dbMock.user.update).not.toHaveBeenCalled();
    } finally {
      silence.restore();
    }
  });

  it('responde 429 na 6ª tentativa do mesmo IP no minuto (5/min)', async () => {
    dbMock.verificationToken.findUnique.mockResolvedValue(null);
    const silence = silenceConsole('log');
    try {
      const ip = '192.0.2.13';
      for (let i = 0; i < 5; i++) {
        const response = await postVerifyEmail(
          requisicao('/api/auth/verify-email', { token: TOKEN }, { ip })
        );
        // Token inválido (400), mas o contador do limiter já rodou — a rota
        // conta a tentativa antes de validar o token.
        expect(response.status).toBe(400);
      }

      const sexta = await postVerifyEmail(
        requisicao('/api/auth/verify-email', { token: TOKEN }, { ip })
      );

      expect(sexta.status).toBe(429);
    } finally {
      silence.restore();
    }
  });
});

describe('POST /api/auth/resend-verification', () => {
  it('responde de forma IDÊNTICA para e-mail existente e inexistente (anti-oráculo)', async () => {
    dbMock.user.findUnique
      .mockResolvedValueOnce({ id: 'u-verify-1', email: 'pendente@teste.com', emailVerified: null })
      .mockResolvedValueOnce(null);
    const silence = silenceConsole('log');
    try {
      const existente = await postResendVerification(
        requisicao('/api/auth/resend-verification', { email: 'pendente@teste.com' }, { ip: '192.0.2.20' })
      );
      const inexistente = await postResendVerification(
        requisicao('/api/auth/resend-verification', { email: 'ghost@teste.com' }, { ip: '192.0.2.20' })
      );

      expect(existente.status).toBe(200);
      expect(await existente.json()).toEqual(await inexistente.json());
    } finally {
      silence.restore();
    }
  });

  it('reenvia para conta não verificada: invalida tokens abertos, cria novo e envia ao dono', async () => {
    dbMock.user.findUnique.mockResolvedValueOnce({ id: 'u-verify-1', email: 'pendente@teste.com', emailVerified: null });
    const silence = silenceConsole('log');
    try {
      const response = await postResendVerification(
        requisicao('/api/auth/resend-verification', { email: 'Pendente@Teste.COM' }, { ip: '192.0.2.21' })
      );

      expect(response.status).toBe(200);
      await flushAfter();

      expect(dbMock.verificationToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u-verify-1', usedAt: null },
        data: { usedAt: expect.any(Date) },
      });
      const novoToken = (dbMock.verificationToken.create as Mock).mock.calls[0][0].data;
      expect(novoToken.userId).toBe('u-verify-1');
      expect(novoToken.token).toMatch(/^[0-9a-f]{64}$/);
      expect(sdkSendMock).toHaveBeenCalledTimes(1);
      expect(sdkSendMock.mock.calls[0][0]).toMatchObject({ to: 'pendente@teste.com' });
    } finally {
      silence.restore();
    }
  });

  it('não reenvia para conta já verificada', async () => {
    dbMock.user.findUnique.mockResolvedValueOnce({
      id: 'u-verify-1',
      email: 'verificado@teste.com',
      emailVerified: new Date(),
    });
    const silence = silenceConsole('log');
    try {
      const response = await postResendVerification(
        requisicao('/api/auth/resend-verification', { email: 'verificado@teste.com' }, { ip: '192.0.2.22' })
      );

      expect(response.status).toBe(200);
      await flushAfter();

      expect(dbMock.verificationToken.create).not.toHaveBeenCalled();
      expect(sdkSendMock).not.toHaveBeenCalled();
    } finally {
      silence.restore();
    }
  });

  it('responde 429 na 3ª tentativa do mesmo IP no minuto (2/min)', async () => {
    dbMock.user.findUnique.mockResolvedValue(null);
    const silence = silenceConsole('log');
    try {
      const ip = '192.0.2.23';
      const primeira = await postResendVerification(
        requisicao('/api/auth/resend-verification', { email: 'a@teste.com' }, { ip })
      );
      const segunda = await postResendVerification(
        requisicao('/api/auth/resend-verification', { email: 'b@teste.com' }, { ip })
      );
      const terceira = await postResendVerification(
        requisicao('/api/auth/resend-verification', { email: 'c@teste.com' }, { ip })
      );

      expect(primeira.status).toBe(200);
      expect(segunda.status).toBe(200);
      expect(terceira.status).toBe(429);
    } finally {
      silence.restore();
    }
  });
});
