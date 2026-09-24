import { describe, expect, it, afterEach } from 'vitest';

import { silenceConsole } from '@/tests/test-utils/silence-console';

// trusted-proxy.ts cacheia a lista de CIDRs por módulo. Testes que setam o
// override TRUSTED_PROXY_CIDRS invalidam o cache para não vazar estado.
import { __resetTrustedProxyCache, isTrustedProxy } from '@/lib/trusted-proxy';

const ORIG_TRUSTED_PROXY_CIDRS = process.env.TRUSTED_PROXY_CIDRS;

afterEach(() => {
  if (ORIG_TRUSTED_PROXY_CIDRS === undefined) {
    delete process.env.TRUSTED_PROXY_CIDRS;
  } else {
    process.env.TRUSTED_PROXY_CIDRS = ORIG_TRUSTED_PROXY_CIDRS;
  }
  __resetTrustedProxyCache();
});

describe('isTrustedProxy — ranges Cloudflare (lista base)', () => {
  it('marca IP de egress Cloudflare v4 como confiável', () => {
    expect(isTrustedProxy('172.68.0.1')).toBe(true);
  });

  it('marca IP Cloudflare v4 do bloco 104.16.0.0/13 como confiável', () => {
    expect(isTrustedProxy('104.16.5.5')).toBe(true);
  });

  it('marca IPv6 da Cloudflare como confiável', () => {
    expect(isTrustedProxy('2606:4700::1')).toBe(true);
  });

  it('não marca IP público qualquer como confiável', () => {
    expect(isTrustedProxy('200.150.10.20')).toBe(false);
    expect(isTrustedProxy('8.8.8.8')).toBe(false);
  });

  it('não marca IP logo após a borda de um range CF (borda exata do /22)', () => {
    // 131.0.72.0/22 cobre até 131.0.75.255; .76.1 está fora.
    expect(isTrustedProxy('131.0.76.1')).toBe(false);
  });

  it('degrada para false com entrada malformada ou placeholder', () => {
    expect(isTrustedProxy('')).toBe(false);
    expect(isTrustedProxy('unknown')).toBe(false);
    expect(isTrustedProxy('999.1.1.1')).toBe(false);
  });
});

describe('isTrustedProxy — override operacional TRUSTED_PROXY_CIDRS', () => {
  it('SUBSTITUI a lista base: CIDR custom passa a ser confiável e IP CF deixa de ser', () => {
    process.env.TRUSTED_PROXY_CIDRS = '10.0.0.0/8';
    __resetTrustedProxyCache();

    expect(isTrustedProxy('10.1.2.3')).toBe(true);
    expect(isTrustedProxy('172.68.0.1')).toBe(false);
  });

  it('recusa CIDR /0 do override (marcaria TODO IP como proxy e reabriria o spoof)', () => {
    const silence = silenceConsole('error');
    try {
      process.env.TRUSTED_PROXY_CIDRS = '0.0.0.0/0,10.0.0.0/8';
      __resetTrustedProxyCache();

      // Só o /0 é descartado; o CIDR válido da lista segue valendo.
      expect(isTrustedProxy('10.1.2.3')).toBe(true);
      expect(isTrustedProxy('8.8.8.8')).toBe(false);
    } finally {
      silence.restore();
    }
  });
});
