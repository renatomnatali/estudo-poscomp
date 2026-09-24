import { NextRequest, NextResponse, after } from "next/server";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { securityLog } from "@/lib/security-logger";
import { sendEmail, EMAIL_FROM } from "@/lib/resend";
import { verifyEmailHtml } from "@/lib/email-templates";
import { getAppUrl } from "@/lib/app-url";
import { normalizeEmail } from "@/lib/email";
import { requireSameOrigin } from "@/lib/csrf";

// Espelho do sem-cilada (src/app/api/auth/resend-verification/route.ts) com as
// adaptações declaradas na APR-3: SEM anexo de logo; remetente/assunto do Aprovado.

// Rate limiting: 2 tentativas por minuto por IP.
// failClosed (MS4): evita disparo massivo de emails se Redis cair.
const resendLimiter = createRateLimiter(2, 60 * 1000, {
  failClosed: true,
  name: "resend-verification",
});

// Resposta genérica anti-enumeration
const GENERIC_RESPONSE = {
  message:
    "Se o e-mail estiver cadastrado e ainda não verificado, enviaremos um novo link de verificação.",
};

export async function POST(request: NextRequest) {
  // CSRF defense-in-depth: bloqueia POST cross-site disparado por <form>
  // externo (impede uso do envio de email como vetor de abuso).
  const csrfBlock = requireSameOrigin(request);
  if (csrfBlock) return csrfBlock;

  const ip = getClientIp(request.headers);

  if (await resendLimiter.isLimited(ip)) {
    securityLog({ event: "RESEND_VERIFICATION_RATE_LIMITED", ip });
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

  const { email: rawEmail } = body;
  if (!rawEmail || typeof rawEmail !== "string") {
    return NextResponse.json(
      { error: "E-mail inválido" },
      { status: 400 },
    );
  }
  const email = normalizeEmail(rawEmail);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "E-mail inválido" },
      { status: 400 },
    );
  }

  // Timing-attack protection: resposta imediata, trabalho em `after()` —
  // tempo de response constante entre branches (user existe / não / verificado).
  after(async () => {
    try {
      const user = await db.user.findUnique({ where: { email } });

      if (!user || user.emailVerified) {
        securityLog({
          event: "RESEND_VERIFICATION_REQUESTED",
          ip,
          email,
          detail: user ? "already verified" : "user not found",
        });
        return;
      }

      await db.verificationToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await db.verificationToken.create({
        data: { userId: user.id, token, expiresAt },
      });

      securityLog({
        event: "RESEND_VERIFICATION_REQUESTED",
        ip,
        email,
        userId: user.id,
        detail: "token created",
      });

      try {
        const verifyUrl = `${getAppUrl()}/verificar-email?token=${token}`;
        await sendEmail({
          from: EMAIL_FROM,
          to: email,
          subject: "Verifique seu e-mail — Aprovado",
          html: verifyEmailHtml({ verifyUrl }),
        });
      } catch (err) {
        console.error("[RESEND-VERIFICATION] Falha ao enviar e-mail:", err);
      }
    } catch (err) {
      console.error("[RESEND-VERIFICATION] Background task error:", err);
    }
  });

  return NextResponse.json(GENERIC_RESPONSE);
}
