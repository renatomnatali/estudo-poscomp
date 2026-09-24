/**
 * Normaliza um e-mail para uso como chave estável (lookup/storage).
 *
 * Espelho do sem-cilada (src/lib/email.ts).
 *
 * Postgres `String @unique` é case-sensitive — sem normalização, atacante
 * pode criar `victim@gmail.com` e `Victim@gmail.com` como contas distintas.
 *
 * Decisão: lowercase apenas, sem manipular local-part nem strip de `+tag`.
 * RFC 5321 diz que local-part é case-sensitive em tese, mas na prática 100%
 * dos provedores (Gmail, Outlook, Yahoo, Apple, ProtonMail) tratam como
 * case-insensitive. Risco de colisão real é zero; benefício de segurança é alto.
 *
 * Aceita string vazia/whitespace — quem chama deve validar formato antes
 * (este helper só normaliza, não valida).
 */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}
