import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { securityLog } from "@/lib/security-logger";
import { requireSameOrigin } from "@/lib/csrf";
import { isValidPassword, PASSWORD_REQUIREMENTS_MESSAGE } from "@/lib/password";

/**
 * Espelho do sem-cilada (src/app/api/auth/reset-password/route.ts) com as
 * adaptações da APR-3: sem `revalidateTag(userAuthTag(...))` (getSession()
 * deste projeto valida contra o DB a cada request — nada de cache a
 * invalidar; ver lib/auth.ts) e sem `firstPassword` no retorno (toda conta
 * daqui nasce com senha via register — o conceito de "primeira senha"
 * existia só para conta de compra guest do outro produto).
 */

// Rate limiting: 5 tentativas por minuto por IP.
// failClosed (MS4): troca de senha — se Redis cair, bloqueamos para evitar
// brute-force de tokens de reset.
const resetLimiter = createRateLimiter(5, 60 * 1000, {
  failClosed: true,
  name: "reset-password",
});

export async function POST(request: NextRequest) {
  // CSRF defense-in-depth: troca de senha é state-changing crítico.
  const csrfBlock = requireSameOrigin(request);
  if (csrfBlock) return csrfBlock;

  const ip = getClientIp(request.headers);

  if (await resetLimiter.isLimited(ip)) {
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

  const { token, password } = body;

  if (!token) {
    return NextResponse.json({ error: "Token obrigatório" }, { status: 400 });
  }

  // S2 (v2): isValidPassword inclui guard de length cap (bcrypt DoS).
  if (!isValidPassword(password)) {
    return NextResponse.json(
      { error: PASSWORD_REQUIREMENTS_MESSAGE },
      { status: 400 },
    );
  }

  const resetToken = await db.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken || resetToken.usedAt) {
    securityLog({ event: "PASSWORD_RESET_FAILED", ip, detail: "invalid or used token" });
    return NextResponse.json({ error: "Token inválido ou já utilizado" }, { status: 400 });
  }

  if (resetToken.expiresAt < new Date()) {
    securityLog({ event: "PASSWORD_RESET_FAILED", ip, detail: "expired token" });
    return NextResponse.json({ error: "Token expirado. Solicite um novo link." }, { status: 400 });
  }

  const passwordHash = await hash(password, 10);

  // Atualizar senha + invalidar sessões antigas + marcar token como usado.
  // Usa callback de transação (atomicidade real) em vez do batch mode.
  const now = new Date();
  await db.$transaction(async (tx) => {
    // Estado ANTES do update: emailVerified null = nunca verificou.
    const before = await tx.user.findUnique({
      where: { id: resetToken.userId },
      select: { emailVerified: true },
    });

    await tx.user.update({
      where: { id: resetToken.userId },
      // passwordChangedAt invalida todos os JWTs emitidos antes deste momento
      // (validado em getSession()).
      data: {
        passwordHash,
        passwordChangedAt: now,
        // Clicar o link recebido no inbox é prova de posse do e-mail — mesmo
        // precedente de set-password/route.ts. Só promove quando ainda era
        // null (nunca sobrescreve a data real de verificação anterior).
        ...(before?.emailVerified ? {} : { emailVerified: now }),
      },
    });
    await tx.passwordResetToken.update({
      where: { token },
      data: { usedAt: now },
    });
  });

  securityLog({
    event: "PASSWORD_RESET_SUCCESS",
    ip,
    userId: resetToken.userId,
  });

  return NextResponse.json({ ok: true });
}
