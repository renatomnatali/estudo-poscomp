import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { securityLog } from "@/lib/security-logger";
import { requireSameOrigin } from "@/lib/csrf";

// Espelho do sem-cilada (src/app/api/auth/verify-email/route.ts), sem adaptações.

// Rate limiting: 5 tentativas por minuto por IP.
// failClosed (MS4): tokens de verificação têm entropia alta mas finita —
// se Redis cair, bloqueamos para evitar brute-force.
const verifyLimiter = createRateLimiter(5, 60 * 1000, {
  failClosed: true,
  name: "verify-email",
});

export async function POST(request: NextRequest) {
  // CSRF defense-in-depth: consumo de token cross-site permitiria que um
  // site externo "queimasse" verificações arbitrárias se obtivesse o token.
  const csrfBlock = requireSameOrigin(request);
  if (csrfBlock) return csrfBlock;

  const ip = getClientIp(request.headers);

  if (await verifyLimiter.isLimited(ip)) {
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
  const { token } = body;

  if (!token) {
    return NextResponse.json({ error: "Token obrigatório" }, { status: 400 });
  }

  const verification = await db.verificationToken.findUnique({
    where: { token },
  });

  if (!verification || verification.usedAt) {
    securityLog({ event: "VERIFY_EMAIL_FAILED", ip, detail: "invalid token" });
    return NextResponse.json({ error: "Token inválido" }, { status: 400 });
  }

  if (verification.expiresAt < new Date()) {
    securityLog({ event: "VERIFY_EMAIL_FAILED", ip, detail: "expired token" });
    return NextResponse.json({ error: "Token expirado" }, { status: 400 });
  }

  await db.$transaction([
    db.user.update({
      where: { id: verification.userId },
      data: { emailVerified: new Date() },
    }),
    db.verificationToken.update({
      where: { token },
      data: { usedAt: new Date() },
    }),
  ]);

  securityLog({
    event: "VERIFY_EMAIL_SUCCESS",
    ip,
    userId: verification.userId,
  });

  return NextResponse.json({ verified: true });
}
