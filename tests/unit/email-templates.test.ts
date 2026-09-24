import { describe, expect, it } from 'vitest';

import { resetPasswordHtml, verifyEmailHtml } from '@/lib/email-templates';

// Espelho adaptado do sem-cilada (src/lib/email-templates.test.ts): este
// produto tem apenas os dois templates transacionais de auth (sem campanha,
// CRLV-e nem anexo de logo — adaptações declaradas na lib). Os asserts são de
// DADO (URL renderizada/escapada) e de contrato de renderização (lang/charset),
// não de microcopy — o texto do e-mail é volátil (AP10).

describe('verifyEmailHtml', () => {
  it('renderiza o link de verificação quando a URL é http(s)', () => {
    const html = verifyEmailHtml({ verifyUrl: 'https://aprovado.xyz/verificar-email?token=abc&x=1' });

    // URL escapada (& → &amp;) dentro do href do CTA.
    expect(html).toContain('href="https://aprovado.xyz/verificar-email?token=abc&amp;x=1"');
  });

  it('descarta URL com esquema não-http (anti-phishing): href fica vazio', () => {
    const html = verifyEmailHtml({ verifyUrl: 'javascript:alert(document.cookie)' });

    expect(html).not.toContain('javascript:');
    expect(html).toContain('href=""');
  });

  it('escapa aspas na URL, impedindo quebra do atributo href', () => {
    const html = verifyEmailHtml({ verifyUrl: 'https://aprovado.xyz/v?a="onmouseover="alert(1)' });

    // Aspa vira &quot;, o atributo não é quebrado.
    expect(html).not.toContain('?a="onmouseover');
    expect(html).toContain('&quot;onmouseover=&quot;alert(1)');
  });
});

describe('resetPasswordHtml', () => {
  it('renderiza o link de redefinição quando a URL é http(s)', () => {
    const html = resetPasswordHtml({ resetUrl: 'https://aprovado.xyz/redefinir-senha?token=xyz' });

    expect(html).toContain('href="https://aprovado.xyz/redefinir-senha?token=xyz"');
  });

  it('descarta URL com esquema não-http: href fica vazio', () => {
    const html = resetPasswordHtml({ resetUrl: 'data:text/html,<script>alert(1)</script>' });

    expect(html).not.toContain('data:text/html');
    expect(html).toContain('href=""');
  });
});

describe('layout compartilhado (renderização em clientes de e-mail)', () => {
  it('declara lang pt-BR e charset UTF-8', () => {
    const html = verifyEmailHtml({ verifyUrl: 'https://aprovado.xyz/verificar-email?token=abc' });

    expect(html).toContain('<html lang="pt-BR">');
    expect(html).toMatch(/<meta charset="UTF-8"/);
  });
});
