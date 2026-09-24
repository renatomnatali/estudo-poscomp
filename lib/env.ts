/**
 * Helpers de detecção de ambiente.
 *
 * Espelho do sem-cilada (src/lib/env.ts), trazendo apenas o trio usado
 * pelas libs de auth (jwt-secret, rate-limit, turnstile, security-logger).
 *
 * Detecção de "produção" precisa cobrir dois cenários:
 * - Deploy Vercel: VERCEL_ENV define o ambiente ("production" | "preview" | "development")
 * - Self-host / build local: VERCEL_ENV ausente; NODE_ENV=production indica build/start em modo prod
 *
 * Sem cobrir os dois, módulos de segurança que fazem fail-closed em prod
 * podem silenciosamente fazer bypass quando rodando fora da Vercel (smoke
 * test pré-deploy, Docker, futura migração de PaaS).
 */

export function isProduction(): boolean {
  if (process.env.VERCEL_ENV === "production") return true;
  if (!process.env.VERCEL_ENV && process.env.NODE_ENV === "production") return true;
  return false;
}

export function isVercelPreview(): boolean {
  return process.env.VERCEL_ENV === "preview";
}

/**
 * Lê uma env var **saneando whitespace nas pontas** (`.trim()`).
 *
 * MOTIVO (incidente 2026-06-01 no sem-cilada): valores colados no dashboard
 * da Vercel ou setados via `echo` (que anexa `\n`) frequentemente carregam um
 * `\n`/espaço espúrio. Quando o valor entra em comparação exata (`===`),
 * HMAC, header `Authorization: Bearer`, ou URL, esse lixo quebra a lógica de
 * forma silenciosa.
 *
 * Whitespace nas pontas de um secret/token/ID/URL é SEMPRE acidental — nenhum
 * provider emite credenciais que dependam dele. Logo, trimar na leitura é
 * seguro e elimina a classe inteira de bug na fronteira de entrada.
 *
 * Retorna `undefined` quando a env está ausente OU vira string vazia após o
 * trim (só-whitespace = "não setada"), para o caller aplicar o default/throw.
 */
export function readEnv(name: string): string | undefined {
  const trimmed = process.env[name]?.trim();
  return trimmed ? trimmed : undefined;
}
