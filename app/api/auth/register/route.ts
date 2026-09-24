import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { securityLog } from "@/lib/security-logger";
import { sendEmail, EMAIL_FROM } from "@/lib/resend";
import { verifyEmailHtml } from "@/lib/email-templates";
import { getAppUrl } from "@/lib/app-url";
import { normalizeEmail } from "@/lib/email";
import { requireSameOrigin } from "@/lib/csrf";
import { verifyTurnstile } from "@/lib/turnstile";
import { isValidPassword, PASSWORD_REQUIREMENTS_MESSAGE } from "@/lib/password";

/**
 * Espelho do sem-cilada (src/app/api/auth/register/route.ts) com as adaptações
 * declaradas na APR-3: SEM GA4/analytics/consent (trackSignUp), SEM anexo de
 * logo e SEM o ramo guest/PURCHASE — neste produto toda conta nasce por aqui,
 * com senha, então "existe" ⇒ "já cadastrado".
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Rate limiting: 5 tentativas de registro por minuto por IP.
// failClosed (MS4): se Redis cair, bloqueamos novos registros — evita
// criação massiva de contas durante incidente de infraestrutura.
const registerLimiter = createRateLimiter(5, 60 * 1000, {
  failClosed: true,
  name: "register",
});

/** Envia e-mail de verificação via Resend (aguarda conclusão antes de responder) */
async function sendVerificationEmail(email: string, token: string): Promise<void> {
  try {
    const verifyUrl = `${getAppUrl()}/verificar-email?token=${token}`;
    await sendEmail({
      from: EMAIL_FROM,
      to: email,
      subject: "Verifique seu e-mail — Aprovado",
      html: verifyEmailHtml({ verifyUrl }),
    });
  } catch (err) {
    // Log mas não bloqueia o registro — o usuário pode reenviar depois
    console.error("[REGISTER] Falha ao enviar e-mail de verificação:", err);
  }
}

export async function POST(request: NextRequest) {
  // CSRF defense-in-depth: bloqueia POST cross-site. Anti-spam adicional —
  // forms forjados externamente não conseguem inflar o rate-limit antes
  // mesmo de chegar no isLimited.
  const csrfBlock = requireSameOrigin(request);
  if (csrfBlock) return csrfBlock;

  const ip = getClientIp(request.headers);

  if (await registerLimiter.isLimited(ip)) {
    securityLog({ event: "REGISTER_RATE_LIMITED", ip });
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
  const { email: rawEmail, password, turnstileToken } = body;

  if (!rawEmail || !password || typeof rawEmail !== "string") {
    return NextResponse.json(
      { error: "E-mail e senha são obrigatórios" },
      { status: 400 },
    );
  }

  // Turnstile defense-in-depth: bloqueia cadastros automatizados (spam de
  // contas) antes do bcrypt.hash (~100ms/req) e do envio de email
  // transacional. Em dev/preview sem TURNSTILE_SECRET_KEY: bypass.
  // Não cortocircuitar com !turnstileToken — pode vir vazio em dev sem site key.
  if (!(await verifyTurnstile(turnstileToken ?? "", ip))) {
    securityLog({ event: "TURNSTILE_FAILED", ip, detail: "register" });
    return NextResponse.json(
      { error: "Verificação de segurança falhou. Recarregue a página." },
      { status: 403 },
    );
  }

  // Normaliza ANTES de qualquer lookup/insert — Postgres @unique é
  // case-sensitive, então sem isso "Foo@bar.com" e "foo@bar.com" criam
  // duas contas distintas.
  // Normaliza antes da validação para que whitespace nas pontas e maiúsculas
  // não rejeitem o e-mail (UX) — o regex valida o formato real.
  const email = normalizeEmail(rawEmail);

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { error: "E-mail inválido" },
      { status: 400 },
    );
  }

  // S2 (v2): isValidPassword aplica type + length cap + regex em ordem
  // pra evitar custo de regex em strings de 1MB (bcrypt DoS mitigation).
  if (!isValidPassword(password)) {
    return NextResponse.json(
      { error: PASSWORD_REQUIREMENTS_MESSAGE },
      { status: 400 },
    );
  }

  const exists = await db.user.findUnique({ where: { email } });
  if (exists) {
    // Conta já existe com senha. Por decisão de produto, uma tentativa
    // legítima é informada explicitamente para oferecer caminho de
    // recuperação — a contenção de enumeração em massa fica no rate-limit por
    // IP (failClosed) + Turnstile, que rodam ANTES desta ramificação. Sem o
    // canal de timing a fechar, o hash bcrypt dummy foi removido.
    securityLog({
      event: "REGISTER_DUPLICATE",
      ip,
      email,
      detail: "email already registered",
    });
    return NextResponse.json({ outcome: "already_registered" });
  }

  const passwordHash = await hash(password, 10);
  // passwordChangedAt = createdAt em novos usuários — uniformiza a regra
  // de invalidação de sessão entre register, set-password e reset.
  const user = await db.user.create({
    data: { email, passwordHash, passwordChangedAt: new Date() },
  });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.verificationToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  securityLog({ event: "REGISTER_SUCCESS", ip, email, userId: user.id });

  // Enviar e-mail de verificação (aguarda conclusão antes de responder)
  await sendVerificationEmail(email, token);

  return NextResponse.json({ outcome: "verify_email" });
}
