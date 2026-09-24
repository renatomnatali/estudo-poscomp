/**
 * Cloudflare Turnstile server-side verification.
 * Docs: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 *
 * Espelho do sem-cilada (src/lib/turnstile.ts).
 */

import { isProduction, isVercelPreview, readEnv } from "./env";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secret = readEnv("TURNSTILE_SECRET_KEY");

  if (!secret) {
    // Produção (Vercel ou self-host com NODE_ENV=production) fail-closed.
    // Preview faz bypass com warn (evita derrubar auth quando operador
    // esquece de setar a env em PR previews). Dev faz bypass silencioso.
    //
    // `readEnv` trata valor só-whitespace como AUSENTE. Consequência aceita
    // conscientemente: em preview/dev, um secret que seja só espaços passa a
    // cair neste bypass em vez de bater na Cloudflare e falhar o desafio.
    // Produção não muda — o fail-closed acima vem antes e independe do valor.
    if (isProduction()) {
      console.error("[Turnstile] TURNSTILE_SECRET_KEY não configurada em produção");
      return false;
    }
    if (isVercelPreview()) {
      console.warn("[Turnstile] TURNSTILE_SECRET_KEY ausente em preview — bypass ativo");
    }
    return true;
  }

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token,
        ...(ip && { remoteip: ip }),
      }),
      signal: AbortSignal.timeout(5000),
    });

    const data = await res.json();
    return data.success === true;
  } catch {
    console.error("[Turnstile] Verification failed");
    return false;
  }
}

/**
 * Se o Turnstile está efetivamente configurável no server (há secret). Sem
 * secret, `verifyTurnstile` faz bypass (dev/preview) — não há o que exigir, e
 * exigir o desafio só prenderia o usuário num widget sem verificação.
 */
export function isTurnstileConfigured(): boolean {
  return Boolean(readEnv("TURNSTILE_SECRET_KEY"));
}
