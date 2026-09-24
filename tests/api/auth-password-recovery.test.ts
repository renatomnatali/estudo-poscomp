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

// Fronteiras mockadas: singleton Prisma e SDK do Resend. bcrypt (hash),
// limitadores em memória e templates rodam REAIS.
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

import { POST as postForgot } from '@/app/api/auth/forgot-password/route';
import { POST as postReset } from '@/app/api/auth/reset-password/route';
import { POST as postSet } from '@/app/api/auth/set-password/route';

import { silenceConsole } from '@/tests/test-utils/silence-console';

type Mock = ReturnType<typeof vi.fn>;

const TOKEN = 'b'.repeat(64);
const NOVA_SENHA = 'NovaSenhaForte1';

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

function tokenReset(overrides: Partial<{ usedAt: Date | null; expiresAt: Date }> = {}) {
  return {
    userId: 'u-reset-1',
    token: TOKEN,
    usedAt: null as Date | null,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    ...overrides,
  };
}

beforeEach(() => {
  dbMock.user.findUnique.mockReset();
  dbMock.user.update.mockReset();
  dbMock.passwordResetToken.findUnique.mockReset();
  dbMock.passwordResetToken.update.mockReset();
  // Claim atômico do token single-use (dbd4694): caminho feliz acerta
  // exatamente 1 linha. Casos concorrentes sobrescrevem para { count: 0 }.
  dbMock.passwordResetToken.updateMany.mockReset().mockResolvedValue({ count: 1 });
  dbMock.passwordResetToken.create.mockReset().mockResolvedValue({});
  dbMock.$transaction.mockReset().mockImplementation(async (arg: unknown) => {
    // Callback mode (reset/set-password): repassa o próprio db como `tx`.
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

describe('POST /api/auth/forgot-password', () => {
  it('resposta IDÊNTICA para e-mail existente e inexistente (anti-oráculo de enumeração)', async () => {
    dbMock.user.findUnique
      .mockResolvedValueOnce({ id: 'u-reset-1', email: 'dono@teste.com', passwordHash: 'hash-antigo' })
      .mockResolvedValueOnce(null);
    const silence = silenceConsole('log');
    try {
      const existente = await postForgot(
        requisicao('/api/auth/forgot-password', { email: 'dono@teste.com' }, { ip: '198.51.100.30' })
      );
      const inexistente = await postForgot(
        requisicao('/api/auth/forgot-password', { email: 'ghost@teste.com' }, { ip: '198.51.100.30' })
      );

      expect(existente.status).toBe(200);
      expect(await existente.json()).toEqual(await inexistente.json());
    } finally {
      silence.restore();
    }
  });

  it('cria link de redefinição para e-mail existente: invalida anteriores, token de 1h, e-mail ao dono', async () => {
    const antes = Date.now();
    dbMock.user.findUnique.mockResolvedValueOnce({
      id: 'u-reset-1',
      email: 'dono@teste.com',
      passwordHash: 'hash-antigo',
    });
    const silence = silenceConsole('log');
    try {
      const response = await postForgot(
        requisicao('/api/auth/forgot-password', { email: '  Dono@Teste.COM  ' }, { ip: '198.51.100.31' })
      );

      expect(response.status).toBe(200);
      await flushAfter();

      expect(dbMock.passwordResetToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u-reset-1', usedAt: null },
        data: { usedAt: expect.any(Date) },
      });

      const criado = (dbMock.passwordResetToken.create as Mock).mock.calls[0][0].data;
      expect(criado.userId).toBe('u-reset-1');
      expect(criado.token).toMatch(/^[0-9a-f]{64}$/);
      const validadeHoras = (criado.expiresAt.getTime() - antes) / 3_600_000;
      expect(validadeHoras).toBeGreaterThan(0.9);
      expect(validadeHoras).toBeLessThan(1.1);

      const envio = sdkSendMock.mock.calls[0][0];
      expect(envio.to).toBe('dono@teste.com');
      expect(envio.html).toContain('/redefinir-senha?token=');
    } finally {
      silence.restore();
    }
  });

  it('não cria token nem envia e-mail quando o e-mail não existe', async () => {
    dbMock.user.findUnique.mockResolvedValueOnce(null);
    const silence = silenceConsole('log');
    try {
      const response = await postForgot(
        requisicao('/api/auth/forgot-password', { email: 'ghost@teste.com' }, { ip: '198.51.100.32' })
      );

      expect(response.status).toBe(200);
      await flushAfter();

      expect(dbMock.passwordResetToken.create).not.toHaveBeenCalled();
      expect(sdkSendMock).not.toHaveBeenCalled();
    } finally {
      silence.restore();
    }
  });

  it('responde 429 na 4ª tentativa do mesmo IP no minuto (3/min)', async () => {
    dbMock.user.findUnique.mockResolvedValue(null);
    const silence = silenceConsole('log');
    try {
      const ip = '198.51.100.33';
      for (let i = 0; i < 3; i++) {
        const response = await postForgot(
          requisicao('/api/auth/forgot-password', { email: `alvo${i}@teste.com` }, { ip })
        );
        expect(response.status).toBe(200);
      }

      const quarta = await postForgot(
        requisicao('/api/auth/forgot-password', { email: 'estoura@teste.com' }, { ip })
      );

      expect(quarta.status).toBe(429);
    } finally {
      silence.restore();
    }
  });
});

describe('POST /api/auth/reset-password', () => {
  it('troca a senha em transação: hash novo, passwordChangedAt, token consumido e emailVerified promovido', async () => {
    const antes = Date.now();
    dbMock.passwordResetToken.findUnique.mockResolvedValueOnce(tokenReset());
    // Estado ANTES do update: emailVerified null = nunca verificou.
    dbMock.user.findUnique.mockResolvedValueOnce({ emailVerified: null });

    const silence = silenceConsole('log');
    try {
      const response = await postReset(
        requisicao('/api/auth/reset-password', { token: TOKEN, password: NOVA_SENHA }, { ip: '198.51.100.40' })
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ ok: true });

      // Tudo na MESMA transação (callback).
      expect(dbMock.$transaction).toHaveBeenCalledTimes(1);

      const update = (dbMock.user.update as Mock).mock.calls[0][0];
      expect(update.where).toEqual({ id: 'u-reset-1' });
      expect(update.data.passwordHash).toMatch(/^\$2[aby]\$/);
      expect(update.data.passwordChangedAt).toBeInstanceOf(Date);
      expect(update.data.passwordChangedAt.getTime()).toBeGreaterThanOrEqual(antes);
      // Posse do link prova o e-mail: promovido quando ainda era nulo.
      expect(update.data.emailVerified).toBeInstanceOf(Date);

      // Token consumido pelo claim atômico dentro da transação.
      expect(dbMock.passwordResetToken.updateMany).toHaveBeenCalledWith({
        where: { token: TOKEN, usedAt: null },
        data: { usedAt: expect.any(Date) },
      });
    } finally {
      silence.restore();
    }
  });

  it('perde a corrida do claim (count=0) e responde 400 SEM trocar a senha', async () => {
    // Dois requests concorrentes com o mesmo token: exatamente um vence. O
    // perdedor vê o claim alcançar 0 linhas e a transação reverter — o hash
    // novo e o passwordChangedAt nunca são gravados.
    dbMock.passwordResetToken.findUnique.mockResolvedValueOnce(tokenReset());
    dbMock.passwordResetToken.updateMany.mockResolvedValueOnce({ count: 0 });

    const silence = silenceConsole('log');
    try {
      const response = await postReset(
        requisicao('/api/auth/reset-password', { token: TOKEN, password: NOVA_SENHA }, { ip: '198.51.100.46' })
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: expect.stringMatching(/token inválido ou já utilizado/i),
      });
      expect(dbMock.user.update).not.toHaveBeenCalled();
    } finally {
      silence.restore();
    }
  });

  it('não rebaixa emailVerified já existente (data original preservada)', async () => {
    dbMock.passwordResetToken.findUnique.mockResolvedValueOnce(tokenReset());
    const verificacaoOriginal = new Date('2026-08-15T00:00:00.000Z');
    dbMock.user.findUnique.mockResolvedValueOnce({ emailVerified: verificacaoOriginal });

    const silence = silenceConsole('log');
    try {
      const response = await postReset(
        requisicao('/api/auth/reset-password', { token: TOKEN, password: NOVA_SENHA }, { ip: '198.51.100.41' })
      );

      expect(response.status).toBe(200);

      const data = (dbMock.user.update as Mock).mock.calls[0][0].data;
      expect('emailVerified' in data).toBe(false);
      expect(data.passwordChangedAt).toBeInstanceOf(Date);
    } finally {
      silence.restore();
    }
  });

  it('rejeita token já usado com 400, sem nenhum write', async () => {
    dbMock.passwordResetToken.findUnique.mockResolvedValueOnce(tokenReset({ usedAt: new Date() }));
    const silence = silenceConsole('log');
    try {
      const response = await postReset(
        requisicao('/api/auth/reset-password', { token: TOKEN, password: NOVA_SENHA }, { ip: '198.51.100.42' })
      );

      expect(response.status).toBe(400);
      expect(dbMock.$transaction).not.toHaveBeenCalled();
      expect(dbMock.user.update).not.toHaveBeenCalled();
    } finally {
      silence.restore();
    }
  });

  it('rejeita token expirado com 400, sem nenhum write', async () => {
    dbMock.passwordResetToken.findUnique.mockResolvedValueOnce(
      tokenReset({ expiresAt: new Date(Date.now() - 60_000) })
    );
    const silence = silenceConsole('log');
    try {
      const response = await postReset(
        requisicao('/api/auth/reset-password', { token: TOKEN, password: NOVA_SENHA }, { ip: '198.51.100.43' })
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ error: expect.stringMatching(/expirado/i) });
      expect(dbMock.$transaction).not.toHaveBeenCalled();
      expect(dbMock.user.update).not.toHaveBeenCalled();
    } finally {
      silence.restore();
    }
  });

  it('rejeita senha fora da política com 400 ANTES de qualquer lógica de token', async () => {
    const silence = silenceConsole('log');
    try {
      const response = await postReset(
        requisicao('/api/auth/reset-password', { token: TOKEN, password: 'curta' }, { ip: '198.51.100.44' })
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: expect.stringMatching(/entre 8 e 128 caracteres/i),
      });
      // Parou antes do lookup do token (e, portanto, antes de qualquer hash/write).
      expect(dbMock.passwordResetToken.findUnique).not.toHaveBeenCalled();
      expect(dbMock.$transaction).not.toHaveBeenCalled();
    } finally {
      silence.restore();
    }
  });

  it('responde 429 na 6ª tentativa do mesmo IP no minuto (5/min)', async () => {
    dbMock.passwordResetToken.findUnique.mockResolvedValue(null);
    const silence = silenceConsole('log');
    try {
      const ip = '198.51.100.45';
      for (let i = 0; i < 5; i++) {
        const response = await postReset(
          requisicao('/api/auth/reset-password', { token: TOKEN, password: NOVA_SENHA }, { ip })
        );
        // Token inválido (400), mas o contador do limiter já rodou.
        expect(response.status).toBe(400);
      }

      const sexta = await postReset(
        requisicao('/api/auth/reset-password', { token: TOKEN, password: NOVA_SENHA }, { ip })
      );

      expect(sexta.status).toBe(429);
    } finally {
      silence.restore();
    }
  });
});

describe('POST /api/auth/set-password', () => {
  it('segue o mesmo contrato do reset: transação com hash novo, passwordChangedAt e token consumido', async () => {
    dbMock.passwordResetToken.findUnique.mockResolvedValueOnce(tokenReset());
    dbMock.user.findUnique.mockResolvedValueOnce({ emailVerified: new Date('2026-08-15T00:00:00.000Z') });

    const silence = silenceConsole('log');
    try {
      const response = await postSet(
        requisicao('/api/auth/set-password', { token: TOKEN, password: NOVA_SENHA }, { ip: '198.51.100.50' })
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ ok: true });

      expect(dbMock.$transaction).toHaveBeenCalledTimes(1);
      const update = (dbMock.user.update as Mock).mock.calls[0][0];
      expect(update.data.passwordHash).toMatch(/^\$2[aby]\$/);
      expect(update.data.passwordChangedAt).toBeInstanceOf(Date);
      expect('emailVerified' in update.data).toBe(false);
      expect(dbMock.passwordResetToken.updateMany).toHaveBeenCalledWith({
        where: { token: TOKEN, usedAt: null },
        data: { usedAt: expect.any(Date) },
      });
    } finally {
      silence.restore();
    }
  });

  it('perde a corrida do claim (count=0) e responde 400 SEM definir a senha', async () => {
    dbMock.passwordResetToken.findUnique.mockResolvedValueOnce(tokenReset());
    dbMock.passwordResetToken.updateMany.mockResolvedValueOnce({ count: 0 });

    const silence = silenceConsole('log');
    try {
      const response = await postSet(
        requisicao('/api/auth/set-password', { token: TOKEN, password: NOVA_SENHA }, { ip: '198.51.100.52' })
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: expect.stringMatching(/token inválido ou já utilizado/i),
      });
      expect(dbMock.user.update).not.toHaveBeenCalled();
    } finally {
      silence.restore();
    }
  });

  it('responde 429 na 6ª tentativa do mesmo IP no minuto (5/min)', async () => {
    dbMock.passwordResetToken.findUnique.mockResolvedValue(null);
    const silence = silenceConsole('log');
    try {
      const ip = '198.51.100.51';
      for (let i = 0; i < 5; i++) {
        const response = await postSet(
          requisicao('/api/auth/set-password', { token: TOKEN, password: NOVA_SENHA }, { ip })
        );
        // Token inválido (400), mas o contador do limiter já rodou.
        expect(response.status).toBe(400);
      }

      const sexta = await postSet(
        requisicao('/api/auth/set-password', { token: TOKEN, password: NOVA_SENHA }, { ip })
      );

      expect(sexta.status).toBe(429);
    } finally {
      silence.restore();
    }
  });
});
