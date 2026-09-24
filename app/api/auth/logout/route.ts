import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/rate-limit";
import { securityLog } from "@/lib/security-logger";
import { requireSameOrigin } from "@/lib/csrf";

// Espelho do sem-cilada (src/app/api/auth/logout/route.ts), sem adaptações.
// (Não há invalidação de cache de auth aqui: getSession() deste projeto não
// usa cache — ver lib/auth.ts.)

export async function POST(request: NextRequest) {
  // CSRF: impede que outro site force logout do usuário via <form>.
  // Annoyance attack, mas mitigação trivial via Sec-Fetch-Site.
  const csrfBlock = requireSameOrigin(request);
  if (csrfBlock) return csrfBlock;

  const ip = getClientIp(request.headers);

  securityLog({ event: "LOGOUT", ip });

  const response = NextResponse.json({ ok: true });

  response.cookies.set("session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV !== "development",
    path: "/",
    maxAge: 0,
  });

  return response;
}
