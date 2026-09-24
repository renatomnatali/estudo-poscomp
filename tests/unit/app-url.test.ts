import { describe, expect, it, beforeEach, afterEach } from 'vitest';

// getAppUrl lê env na chamada — manipular process.env por suíte com
// save/restore (o helper de lib/env não é usado aqui; app-url lê direto).
import { getAppUrl } from '@/lib/app-url';

const ORIG_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIG_ENV };
  delete process.env.APP_URL;
  delete process.env.VERCEL_URL;
});

afterEach(() => {
  process.env = { ...ORIG_ENV };
});

describe('getAppUrl', () => {
  it('respeita APP_URL explícita quando definida', () => {
    process.env.APP_URL = 'https://poscomp.aprovado.xyz';
    expect(getAppUrl()).toBe('https://poscomp.aprovado.xyz');
  });

  it('deriva de VERCEL_URL com protocolo https quando APP_URL não existe', () => {
    process.env.VERCEL_URL = 'estudo-poscomp.vercel.app';
    expect(getAppUrl()).toBe('https://estudo-poscomp.vercel.app');
  });

  it('prefere APP_URL quando ambas APP_URL e VERCEL_URL existem', () => {
    process.env.APP_URL = 'https://poscomp.aprovado.xyz';
    process.env.VERCEL_URL = 'estudo-poscomp.vercel.app';
    expect(getAppUrl()).toBe('https://poscomp.aprovado.xyz');
  });

  it('cai para localhost quando nenhuma env está definida (dev local)', () => {
    expect(getAppUrl()).toBe('http://localhost:3000');
  });

  it('recusa APP_URL sem protocolo http/https', () => {
    process.env.APP_URL = 'poscomp.aprovado.xyz';
    expect(() => getAppUrl()).toThrow(/APP_URL inválida/);
  });
});
