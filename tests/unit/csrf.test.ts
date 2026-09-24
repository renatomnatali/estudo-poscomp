import { describe, expect, it, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Borda mockada: o logger de segurança. O que está sob teste é a DECISÃO de
// bloqueio/permissão do requireSameOrigin (real) e o EVENTO que ele emite —
// o nome do evento é o contrato que a regra de alerta consome.
const { securityLogMock } = vi.hoisted(() => ({ securityLogMock: vi.fn() }));

vi.mock('@/lib/security-logger', () => ({
  securityLog: securityLogMock,
}));

// getClientIp (de rate-limit) roda REAL — a extração de IP que alimenta o
// log é parte do comportamento.
import { requireSameOrigin } from '@/lib/csrf';

function requisicao(
  secFetchSite: string | null,
  opts: { method?: string; url?: string; headers?: Record<string, string> } = {}
): NextRequest {
  const headers = new Headers(opts.headers ?? {});
  if (secFetchSite !== null) headers.set('sec-fetch-site', secFetchSite);
  return new NextRequest(opts.url ?? 'http://localhost/api/auth/logout', {
    method: opts.method ?? 'POST',
    headers,
  });
}

beforeEach(() => {
  securityLogMock.mockReset();
});

describe('requireSameOrigin', () => {
  it('permite POST same-origin sem logar', () => {
    expect(requireSameOrigin(requisicao('same-origin'))).toBeNull();
    expect(securityLogMock).not.toHaveBeenCalled();
  });

  it('permite POST same-site (subdomínio do mesmo eTLD+1) sem logar', () => {
    expect(requireSameOrigin(requisicao('same-site'))).toBeNull();
    expect(securityLogMock).not.toHaveBeenCalled();
  });

  it('permite POST none (digitação direta na barra) sem logar', () => {
    expect(requireSameOrigin(requisicao('none'))).toBeNull();
    expect(securityLogMock).not.toHaveBeenCalled();
  });

  it('bloqueia POST cross-site com 403', async () => {
    const resposta = requireSameOrigin(requisicao('cross-site'));

    expect(resposta).not.toBeNull();
    expect(resposta?.status).toBe(403);
    // O corpo é o contrato da API para o cliente que foi bloqueado.
    const corpo = await resposta?.json();
    expect(corpo?.error).toMatch(/origem/i);
    expect(securityLogMock).not.toHaveBeenCalled();
  });

  it('bloqueia valor desconhecido de Sec-Fetch-Site com 403 (fail-closed)', () => {
    // A spec define só same-origin/same-site/none/cross-site; qualquer outro
    // valor é tratado como hostil.
    const resposta = requireSameOrigin(requisicao('valor-malicioso'));
    expect(resposta?.status).toBe(403);
  });

  it('permite POST sem o header (client legado/curl) e emite CSRF_HEADER_ABSENT com ip/método/path', () => {
    const req = requisicao(null, {
      method: 'POST',
      url: 'http://localhost/api/auth/logout',
      headers: { 'user-agent': 'curl/8.4.0', 'x-real-ip': '189.45.67.89' },
    });

    expect(requireSameOrigin(req)).toBeNull();

    expect(securityLogMock).toHaveBeenCalledTimes(1);
    const payload = securityLogMock.mock.calls[0][0];
    expect(payload.event).toBe('CSRF_HEADER_ABSENT');
    expect(payload.ip).toBe('189.45.67.89');
    expect(payload.detail).toContain('method=POST');
    expect(payload.detail).toContain('path=/api/auth/logout');
    expect(payload.detail).toContain('ua=curl/8.4.0');
  });
});
