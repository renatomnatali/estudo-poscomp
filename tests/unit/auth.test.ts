import { describe, expect, it, beforeEach, vi } from 'vitest';
import { SignJWT } from 'jose';

// Borda mockada: cookies do Next (framework) e o singleton do Prisma
// (@/lib/db). NUNCA banco real — o que está sob teste é a LÓGICA de
// validação de sessão em auth.ts, com jose rodando de verdade.
const { cookiesMock, userFindUniqueMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  userFindUniqueMock: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
}));

vi.mock('@/lib/db', () => ({
  db: {
    user: { findUnique: userFindUniqueMock },
  },
}));

// Secret estável para a suíte inteira (getSecret é lazy — lê env na 1ª chamada).
process.env.JWT_SECRET = 'test-secret-with-at-least-32-chars-xxx';

import {
  getSecret,
  getSession,
  requireAuth,
  signToken,
  verifySessionWithDb,
  verifyToken,
} from '@/lib/auth';

function usuarioDoBanco(overrides: Partial<{
  passwordChangedAt: Date | null;
  deletedAt: Date | null;
  role: 'USER' | 'ADMIN';
}> = {}) {
  return {
    passwordChangedAt: null,
    deletedAt: null,
    role: 'USER' as const,
    ...overrides,
  };
}

/** Decodifica header/payload de um JWT sem verificar (para inspecionar o contrato do token). */
function decodificarSegmento(segmento: string) {
  return JSON.parse(Buffer.from(segmento, 'base64url').toString('utf8'));
}

/** Token assinado com o secret da suíte, com iat fixo (para pinar o instante T dos testes de troca de senha). */
async function tokenComIat(iatSegundos: number, role?: 'USER' | 'ADMIN') {
  return new SignJWT({
    sub: 'usuario-1',
    email: 'usuario@teste.com',
    emailVerified: true,
    ...(role && { role }),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(iatSegundos)
    .setExpirationTime(iatSegundos + 3600)
    .sign(getSecret());
}

beforeEach(() => {
  cookiesMock.mockReset();
  // Default: usuário existente, ativo, sem troca de senha — os testes de
  // invalidação sobrescrevem o que precisam.
  userFindUniqueMock.mockReset().mockResolvedValue(usuarioDoBanco());
});

describe('signToken + verifyToken (contrato do token)', () => {
  it('assina HS256 com expiração de 1h e preserva o payload na verificação', async () => {
    const token = await signToken({
      sub: 'user-123',
      email: 'u@teste.com',
      emailVerified: true,
      role: 'USER',
    });

    expect(token.split('.')).toHaveLength(3);
    const header = decodificarSegmento(token.split('.')[0]);
    const payload = decodificarSegmento(token.split('.')[1]);
    expect(header.alg).toBe('HS256');
    expect(payload.exp - payload.iat).toBe(3600);

    const verificado = await verifyToken(token);
    expect(verificado).not.toBeNull();
    expect(verificado?.sub).toBe('user-123');
    expect(verificado?.email).toBe('u@teste.com');
    expect(verificado?.emailVerified).toBe(true);
    expect(verificado?.role).toBe('USER');
  });

  it('rejeita token malformado (null, sem exceção)', async () => {
    expect(await verifyToken('not-a-jwt')).toBeNull();
    expect(await verifyToken('a.b.c')).toBeNull();
    expect(await verifyToken('')).toBeNull();
  });

  it('rejeita token assinado com outro secret', async () => {
    const estranho = await new SignJWT({ sub: 'x', email: 'x@t.com', emailVerified: true })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode('chave-totalmente-diferente-xxxxxx'));

    expect(await verifyToken(estranho)).toBeNull();
  });

  it('rejeita token expirado', async () => {
    const agora = Math.floor(Date.now() / 1000);
    const expirado = await new SignJWT({ sub: 'x', email: 'x@t.com', emailVerified: true })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(agora - 7200)
      .setExpirationTime(agora - 3600)
      .sign(getSecret());

    expect(await verifyToken(expirado)).toBeNull();
  });
});

describe('verifySessionWithDb — sessão íntegra', () => {
  it('aceita sessão de conta existente e devolve o papel lido do banco', async () => {
    const token = await signToken({
      sub: 'usuario-1',
      email: 'usuario@teste.com',
      emailVerified: true,
      role: 'USER',
    });
    userFindUniqueMock.mockResolvedValue(usuarioDoBanco({ role: 'USER' }));

    const resultado = await verifySessionWithDb(token);

    expect(resultado.valid).toBe(true);
    if (resultado.valid) {
      expect(resultado.dbRole).toBe('USER');
      expect(resultado.payload.sub).toBe('usuario-1');
    }
  });
});

describe('verifySessionWithDb — conta inexistente ou excluída', () => {
  it('rejeita com user_not_found quando a conta não existe no banco', async () => {
    const token = await signToken({
      sub: 'fantasma',
      email: 'fantasma@teste.com',
      emailVerified: true,
      role: 'USER',
    });
    userFindUniqueMock.mockResolvedValue(null);

    const resultado = await verifySessionWithDb(token);

    expect(resultado.valid).toBe(false);
    if (!resultado.valid) {
      expect(resultado.reason).toBe('user_not_found');
      expect(resultado.userId).toBe('fantasma');
    }
  });

  it('rejeita com deleted quando a conta foi excluída (soft-delete)', async () => {
    const token = await signToken({
      sub: 'excluido-1',
      email: 'excluido@teste.com',
      emailVerified: true,
      role: 'USER',
    });
    userFindUniqueMock.mockResolvedValue(
      usuarioDoBanco({ deletedAt: new Date('2026-01-01T00:00:00.000Z') })
    );

    const resultado = await verifySessionWithDb(token);

    expect(resultado.valid).toBe(false);
    if (!resultado.valid) expect(resultado.reason).toBe('deleted');
  });
});

describe('verifySessionWithDb — troca de senha vence o token', () => {
  // iat fixo (60s no passado): todos os timestamps derivam de T, sem
  // dependência do relógio no momento do assert.
  const T = Math.floor(Date.now() / 1000) - 60;

  it('rejeita quando a senha foi trocada no MESMO segundo do iat (floor(passwordChangedAt/1000) >= iat)', async () => {
    const token = await tokenComIat(T);
    userFindUniqueMock.mockResolvedValue(
      usuarioDoBanco({ passwordChangedAt: new Date(T * 1000) })
    );

    const resultado = await verifySessionWithDb(token);

    expect(resultado.valid).toBe(false);
    if (!resultado.valid) expect(resultado.reason).toBe('password_changed');
  });

  it('rejeita quando a senha foi trocada DEPOIS do iat', async () => {
    const token = await tokenComIat(T);
    userFindUniqueMock.mockResolvedValue(
      usuarioDoBanco({ passwordChangedAt: new Date((T + 60) * 1000) })
    );

    const resultado = await verifySessionWithDb(token);

    expect(resultado.valid).toBe(false);
    if (!resultado.valid) expect(resultado.reason).toBe('password_changed');
  });

  it('aceita token emitido 1 segundo DEPOIS da troca de senha', async () => {
    const token = await tokenComIat(T);
    userFindUniqueMock.mockResolvedValue(
      usuarioDoBanco({ passwordChangedAt: new Date((T - 1) * 1000) })
    );

    const resultado = await verifySessionWithDb(token);

    expect(resultado.valid).toBe(true);
  });
});

describe('verifySessionWithDb — papel divergente do banco', () => {
  it('rejeita com role_changed quando o banco rebaixou ADMIN para USER', async () => {
    const token = await signToken({
      sub: 'usuario-1',
      email: 'usuario@teste.com',
      emailVerified: true,
      role: 'ADMIN',
    });
    userFindUniqueMock.mockResolvedValue(usuarioDoBanco({ role: 'USER' }));

    const resultado = await verifySessionWithDb(token);

    expect(resultado.valid).toBe(false);
    if (!resultado.valid) {
      expect(resultado.reason).toBe('role_changed');
      expect(resultado.userId).toBe('usuario-1');
    }
  });

  it('rejeita com role_changed quando o banco promoveu USER para ADMIN', async () => {
    const token = await signToken({
      sub: 'usuario-1',
      email: 'usuario@teste.com',
      emailVerified: true,
      role: 'USER',
    });
    userFindUniqueMock.mockResolvedValue(usuarioDoBanco({ role: 'ADMIN' }));

    const resultado = await verifySessionWithDb(token);

    expect(resultado.valid).toBe(false);
    if (!resultado.valid) expect(resultado.reason).toBe('role_changed');
  });

  it('aceita sessão ADMIN estável e devolve dbRole=ADMIN (papel autoritativo do banco)', async () => {
    const token = await signToken({
      sub: 'admin-1',
      email: 'admin@teste.com',
      emailVerified: true,
      role: 'ADMIN',
    });
    userFindUniqueMock.mockResolvedValue(usuarioDoBanco({ role: 'ADMIN' }));

    const resultado = await verifySessionWithDb(token);

    expect(resultado.valid).toBe(true);
    if (resultado.valid) expect(resultado.dbRole).toBe('ADMIN');
  });

  it('trata token legado sem role como USER (divergência real continua rejeitando)', async () => {
    const token = await tokenComIat(Math.floor(Date.now() / 1000) - 60);

    userFindUniqueMock.mockResolvedValue(usuarioDoBanco({ role: 'USER' }));
    const comUser = await verifySessionWithDb(token);
    expect(comUser.valid).toBe(true);

    userFindUniqueMock.mockResolvedValue(usuarioDoBanco({ role: 'ADMIN' }));
    const comAdmin = await verifySessionWithDb(token);
    expect(comAdmin.valid).toBe(false);
    if (!comAdmin.valid) expect(comAdmin.reason).toBe('role_changed');
  });
});

describe('getSession e requireAuth', () => {
  it('retorna null quando o cookie de sessão não existe', async () => {
    cookiesMock.mockResolvedValue({ get: () => undefined });
    expect(await getSession()).toBeNull();
  });

  it('retorna null quando o cookie carrega token inválido', async () => {
    cookiesMock.mockResolvedValue({ get: () => ({ value: 'lixo' }) });
    expect(await getSession()).toBeNull();
  });

  it('retorna o payload quando o cookie carrega sessão válida', async () => {
    const token = await signToken({
      sub: 'usuario-1',
      email: 'usuario@teste.com',
      emailVerified: true,
      role: 'USER',
    });
    cookiesMock.mockResolvedValue({ get: () => ({ value: token }) });

    const sessao = await getSession();
    expect(sessao?.sub).toBe('usuario-1');
    expect(sessao?.email).toBe('usuario@teste.com');
  });

  it('retorna o role do banco (nunca undefined) quando o token é legacy sem role', async () => {
    // Token emitido antes do role existir: payload.role ausente. A sessão
    // exposta ao caller carrega o dbRole validado no lugar do cru. (Legacy +
    // DB ADMIN não chega aqui: verifySessionWithDb rejeita com role_changed
    // antes do overwrite — guard coberto na suíte de papel divergente.)
    const token = await tokenComIat(Math.floor(Date.now() / 1000) - 60);
    cookiesMock.mockResolvedValue({ get: () => ({ value: token }) });
    userFindUniqueMock.mockResolvedValue(usuarioDoBanco({ role: 'USER' }));

    const sessao = await getSession();

    expect(sessao?.role).toBe('USER');
  });

  it('expõe o role ADMIN validado no banco na sessão de um admin', async () => {
    const token = await signToken({
      sub: 'admin-1',
      email: 'admin@teste.com',
      emailVerified: true,
      role: 'ADMIN',
    });
    cookiesMock.mockResolvedValue({ get: () => ({ value: token }) });
    userFindUniqueMock.mockResolvedValue(usuarioDoBanco({ role: 'ADMIN' }));

    const sessao = await getSession();

    expect(sessao?.role).toBe('ADMIN');
  });

  it('requireAuth lança quando não há sessão', async () => {
    cookiesMock.mockResolvedValue({ get: () => undefined });
    await expect(requireAuth()).rejects.toThrow(/não autorizado/i);
  });
});
