/**
 * Templates de e-mail transacional (APR-3, PR B).
 *
 * Estrutura espelhada do sem-cilada (src/lib/email-templates.ts — card de
 * 600px, estilos inline, header/corpo/rodapé) com marca própria deste produto:
 * wordmark tipográfico (sem anexo de logo — adaptação declarada: o outro
 * produto embute PNG via CID) e o verde-esmeralda do design system (#10b981).
 *
 * `escapeHtml` é local porque este é hoje o único consumidor do repo; quando um
 * segundo template surgir, promover a `lib/html.ts` como no sem-cilada.
 */

/** Escapa os caracteres com significado em HTML (`& < > "`).
 * Espelho do helper homônimo do sem-cilada (src/lib/html.ts). */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Wrapper reutilizável para e-mails com branding Aprovado.
 *
 * `color-scheme: light` trava a renderização em clientes dark-mode: sem isso,
 * o cliente auto-inverte as cores e o texto cinza-escuro sobre fundo branco
 * vira ilegível (contraste quebrado nos dois sentidos).
 */
function emailLayout(subtitle: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /><meta name="color-scheme" content="light" /></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <!-- Header -->
      <div style="background: #f9fafb; padding: 28px 24px; text-align: center; border-bottom: 1px solid #e5e7eb;">
        <p style="color: #059669; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">Aprovado</p>
        <p style="color: #374151; margin: 12px 0 0; font-size: 14px;">${subtitle}</p>
      </div>
      <!-- Body -->
      <div style="padding: 28px 24px;">
        ${bodyHtml}
      </div>
      <!-- Footer -->
      <div style="background: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          aprovado.xyz · independente · não afiliado à SBC
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/** Botão CTA centralizado */
function ctaButton(href: string, label: string): string {
  return `<div style="text-align: center; margin: 24px 0;">
  <a href="${href}"
     style="display: inline-block; background: #10b981; color: white;
            padding: 14px 28px; border-radius: 8px; text-decoration: none;
            font-weight: 700; font-size: 15px;">
    ${label}
  </a>
</div>`;
}

/* ── E-mail de verificação de conta ── */
export function verifyEmailHtml(params: {
  verifyUrl: string;
}): string {
  const url = /^https?:\/\//.test(params.verifyUrl) ? escapeHtml(params.verifyUrl) : "";

  return emailLayout("Verificação de e-mail", `
    <p style="color: #1f2937; font-size: 15px; margin: 0 0 16px;">Olá!</p>
    <p style="color: #1f2937; font-size: 15px; margin: 0 0 16px;">
      Obrigado por se cadastrar no Aprovado. Clique no botão abaixo para verificar seu e-mail:
    </p>
    ${ctaButton(url, "Verificar meu e-mail")}
    <p style="color: #9ca3af; font-size: 13px; margin: 24px 0 0;">
      Este link expira em 24 horas. Se você não criou esta conta, ignore este e-mail.
    </p>
  `);
}

/* ── E-mail de redefinição de senha ── */
export function resetPasswordHtml(params: {
  resetUrl: string;
}): string {
  const url = /^https?:\/\//.test(params.resetUrl) ? escapeHtml(params.resetUrl) : "";

  return emailLayout("Redefinição de senha", `
    <p style="color: #1f2937; font-size: 15px; margin: 0 0 16px;">Olá!</p>
    <p style="color: #1f2937; font-size: 15px; margin: 0 0 16px;">
      Recebemos uma solicitação para redefinir a senha da sua conta no Aprovado.
      Clique no botão abaixo para criar uma nova senha:
    </p>
    ${ctaButton(url, "Redefinir minha senha")}
    <p style="color: #9ca3af; font-size: 13px; margin: 24px 0 0;">
      Este link expira em 1 hora. Se você não solicitou a redefinição, ignore este e-mail. Sua senha permanece inalterada.
    </p>
  `);
}
