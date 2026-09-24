import { NextRequest, NextResponse, after } from "next/server";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { securityLog } from "@/lib/security-logger";
import { sendEmail, EMAIL_FROM } from "@/lib/resend";
import { resetPasswordHtml } from "@/lib/email-templates";
import { getAppUrl } from "@/lib/app-url";
import { normalizeEmail } from "@/lib/email";
import { requireSameOrigin } from "@/lib/csrf";
import { verifyTurnstile } from "@/lib/turnstile";

/**
 * Espelho do sem-cilada (src/app/api/auth/forgot-password/route.ts) com as
 * adaptações declaradas na APR-3: SEM anexo de logo, SEM supressão de
 * campanha (`isSuppressedForTransactional` — o serviço de e-mail marketing
 * não existe neste produto) e SEM a variante "definir primeira senha"
 * (`passwordDefineEmailHtml` — não há conta nascida de compra guest aqui;
 * toda conta nasce com senha no register).
 */

// Rate limiting: 3 tentativas por minuto por IP.
// failClosed (MS4): proteção contra enumeração massiva de emails — se Redis
// cair, atacante não pode despejar lista contra a rota.
const forgotLimiter = createRateLimiter(3, 60 * 1000, {
  failClosed: true,
  name: "forgot-password",
});

// Resposta genérica anti-enumeration (sempre a mesma, quer o e-mail exista ou não)
const GENERIC_RESPONSE = {
  message: "Se o e-mail estiver cadastrado, enviaremos um link de redefinição.",
};

export async function POST(request: NextRequest) {
  // CSRF defense-in-depth: bloqueia POST cross-site. Anti-abuso adicional —
  // forms forjados externamente nao conseguem disparar envio de email mesmo
  // que respeitem a resposta generica anti-enumeration.
  const csrfBlock = requireSameOrigin(request);
  if (csrfBlock) return csrfBlock;

  const ip = getClientIp(request.headers);

  if (await forgotLimiter.isLimited(ip)) {
    securityLog({ event: "PASSWORD_RESET_RATE_LIMITED", ip });
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um momento." },
      { status: 429 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corpo da requisição inválido" },
      { status: 400 },
    );
  }

  const { email: rawEmail, turnstileToken } = body;
  if (!rawEmail || typeof rawEmail !== "string") {
    return NextResponse.json({ error: "E-mail é obrigatório" }, { status: 400 });
  }

  // Turnstile defense-in-depth: bloqueia abuso automatizado do envio de
  // email transacional (custo Resend + risco de o dominio cair em
  // reputation lists). Em dev/preview sem TURNSTILE_SECRET_KEY: bypass.
  // Não cortocircuitar com !turnstileToken — pode vir vazio em dev sem site key.
  if (!(await verifyTurnstile(turnstileToken ?? "", ip))) {
    securityLog({ event: "TURNSTILE_FAILED", ip, detail: "forgot-password" });
    return NextResponse.json(
      { error: "Verificação de segurança falhou. Recarregue a página." },
      { status: 403 },
    );
  }

  const email = normalizeEmail(rawEmail);

  // Timing-attack protection: responde imediatamente com o mesmo payload em
  // todos os branches (user existe / não existe). O trabalho real
  // (DB + email) roda em `after()` — tempo de resposta é constante.
  after(async () => {
    try {
      const user = await db.user.findUnique({ where: { email } });

      if (!user) {
        securityLog({
          event: "PASSWORD_RESET_REQUESTED",
          ip,
          email,
          detail: "user not found",
        });
        return;
      }

      await db.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await db.passwordResetToken.create({
        data: { userId: user.id, token, expiresAt },
      });

      securityLog({
        event: "PASSWORD_RESET_REQUESTED",
        ip,
        email,
        userId: user.id,
        detail: "token created",
      });

      try {
        const resetUrl = `${getAppUrl()}/redefinir-senha?token=${token}`;
        await sendEmail({
          from: EMAIL_FROM,
          to: email,
          subject: "Redefinir sua senha — Aprovado",
          html: resetPasswordHtml({ resetUrl }),
        });
      } catch (err) {
        console.error("[FORGOT-PASSWORD] Falha ao enviar e-mail:", err);
      }
    } catch (err) {
      console.error("[FORGOT-PASSWORD] Background task error:", err);
    }
  });

  return NextResponse.json(GENERIC_RESPONSE);
}
