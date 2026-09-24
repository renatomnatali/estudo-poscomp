import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

// Fronteira mockada: o PACOTE `resend` (SDK externo). lib/resend.ts roda
// real — é o contrato dele que está sob teste: recusa do provider vira
// exceção (o SDK NÃO lança sozinho; devolve { data: null, error }).
const { sdkSendMock } = vi.hoisted(() => ({ sdkSendMock: vi.fn() }));

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sdkSendMock };
  },
}));

import { sanitizeApiKey, sendEmail } from '@/lib/resend';

const PAYLOAD = {
  from: 'Aprovado <noreply@aprovado.xyz>',
  to: 'estudante@exemplo.test',
  subject: 'Confirme seu cadastro',
  html: '<p>Use o link para confirmar seu e-mail.</p>',
};

beforeEach(() => {
  sdkSendMock.mockReset();
  vi.stubEnv('RESEND_API_KEY', 're_chave_de_teste');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('sendEmail', () => {
  it('lança quando o Resend recusa o envio, carregando nome e mensagem do provider', async () => {
    // Arrange — corpo real de recusa do Resend: sem o throw, o chamador
    // trataria isso como sucesso (incidente do sem-cilada em produção).
    sdkSendMock.mockResolvedValue({
      data: null,
      error: {
        statusCode: 403,
        name: 'validation_error',
        message: 'The aprovado.xyz domain is not verified.',
      },
    });

    await expect(sendEmail(PAYLOAD)).rejects.toThrow(
      'Resend recusou o envio: validation_error: The aprovado.xyz domain is not verified.'
    );
  });

  it('lança mesmo quando o erro do provider vem sem nome nem mensagem', async () => {
    sdkSendMock.mockResolvedValue({ data: null, error: {} });

    await expect(sendEmail(PAYLOAD)).rejects.toThrow('Resend recusou o envio: erro desconhecido');
  });

  it('devolve o dado do provider quando o envio é aceito', async () => {
    sdkSendMock.mockResolvedValue({ data: { id: 'envio-3f1a' }, error: null });

    const resultado = await sendEmail(PAYLOAD);

    expect(resultado).toEqual({ id: 'envio-3f1a' });
    expect(sdkSendMock).toHaveBeenCalledTimes(1);
    expect(sdkSendMock.mock.calls[0][0]).toMatchObject({
      to: 'estudante@exemplo.test',
      subject: 'Confirme seu cadastro',
    });
  });

  it('propaga a exceção quando o SDK estoura (falha de rede antes da resposta)', async () => {
    sdkSendMock.mockRejectedValue(new TypeError('fetch failed'));

    await expect(sendEmail(PAYLOAD)).rejects.toThrow('fetch failed');
  });

  it('getResend lança quando RESEND_API_KEY não está configurada (config ausente)', async () => {
    vi.resetModules();
    delete process.env.RESEND_API_KEY;

    const { getResend } = await import('@/lib/resend');
    expect(() => getResend()).toThrow('RESEND_API_KEY não configurada');
  });
});

describe('sanitizeApiKey', () => {
  it('mantém inalterada uma chave já limpa', () => {
    expect(sanitizeApiKey('re_AbC123XyZ456')).toBe('re_AbC123XyZ456');
  });

  it('remove a sequência literal `\\n` do fim da chave (gotcha real de env colada)', () => {
    expect(sanitizeApiKey('re_AbC123XyZ456\\n')).toBe('re_AbC123XyZ456');
  });

  it('remove whitespace e newline real do fim da chave', () => {
    expect(sanitizeApiKey('re_AbC123XyZ456  \n')).toBe('re_AbC123XyZ456');
  });

  it('limpa a combinação de whitespace com `\\n` literal', () => {
    expect(sanitizeApiKey('re_AbC123XyZ456 \\n')).toBe('re_AbC123XyZ456');
  });

  it('retorna string vazia quando a chave é ausente ou vazia', () => {
    expect(sanitizeApiKey(undefined)).toBe('');
    expect(sanitizeApiKey('')).toBe('');
  });
});
