import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/rate-limit";
import { securityLog } from "@/lib/security-logger";

/**
 * Validação CSRF via header Sec-Fetch-Site (Fetch Metadata spec).
 *
 * Espelho do sem-cilada (src/lib/csrf.ts), trazendo apenas
 * `requireSameOrigin` — o que a spec de PR A usa.
 *
 * Contexto: o cookie `session` usa `sameSite: "lax"`, que NÃO bloqueia POST
 * top-level cross-site iniciado por <form> em outro origin. A checagem
 * Fetch Metadata fecha exatamente esse buraco.
 *
 * Sec-Fetch-Site valores (RFC pendente, mas Chrome/Firefox/Safari ≥ 2022):
 *  - `same-origin`: chamada do próprio app — OK
 *  - `same-site`: subdomínio do mesmo eTLD+1 — OK
 *  - `none`: digitada na barra ou via bookmark — OK (não é cross-site)
 *  - `cross-site`: outro domínio top-level — REJEITAR
 *
 * Fallback de compat (clients antigos / curl):
 *  - Header ausente → permitir, mas logar `CSRF_HEADER_ABSENT`. Atacantes não
 *    podem omitir o header em requests forjadas via <form action> (browser
 *    sempre injeta). O log dá visibilidade do volume real do fallback para
 *    decidir, no futuro, se podemos endurecer (recusar quando ausente).
 *
 * Quem usa: endpoints autenticados state-changing — logout, set-password,
 * admin POST/PUT/DELETE.
 */
export function requireSameOrigin(req: NextRequest): NextResponse | null {
  const site = req.headers.get("sec-fetch-site");

  // Header ausente — clients legacy/curl. Permitir mas logar pra observar
  // o tráfego e detectar se o fallback pode ser removido no futuro.
  if (!site) {
    // UA é controlado pelo client sem limite prático (RFC 7231 não impõe).
    // Trunca defensivamente pra evitar inflar logs com payload malicioso.
    const ua = (req.headers.get("user-agent") ?? "unknown").slice(0, 200);
    const path = req.nextUrl.pathname;
    const method = req.method;
    securityLog({
      event: "CSRF_HEADER_ABSENT",
      ip: getClientIp(req.headers),
      detail: `method=${method} path=${path} ua=${ua}`,
    });
    return null;
  }

  if (site === "same-origin" || site === "same-site" || site === "none") {
    return null;
  }

  // cross-site: bloqueia. Atacante CSRF sempre cai aqui (request iniciado
  // de outro domínio top-level).
  return NextResponse.json(
    { error: "Origem da requisição não permitida" },
    { status: 403 },
  );
}
