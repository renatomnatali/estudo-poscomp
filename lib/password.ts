// Política de senha compartilhada entre register, set-password e reset-password.
//
// Espelho do sem-cilada (src/lib/password.ts).
//
// S2 (Code-Reviewer v2 — bcrypt DoS mitigation):
//
// O regex original `.{8,}$` aceitava strings de tamanho ilimitado. Atacante
// podia mandar 1MB no campo `password` → cada req segurava ~100ms × tamanho
// do hash no Node worker. Rate-limit de 5/min por IP é contornável via
// rotação de IP (botnets, exit nodes de Tor). bcrypt internamente trunca em
// 72 bytes, então senhas reais não ganham nada acima disso — cap em 128
// caracteres é generoso pra UX (frases longas) e suficiente pra preencher
// significativamente os 72 efetivos do bcrypt.
//
// Defense-in-depth: validação de comprimento ANTES do regex, porque rodar
// regex em string de 1MB também é custoso (mesmo um regex linear-time).

/** Máximo de caracteres permitidos no campo password.
 *
 * Justificativa:
 * - bcrypt trunca em 72 bytes (impl detail) — qualquer char acima dos 72
 *   não acrescenta entropia. 128 dá folga pra senhas em UTF-8 com chars
 *   multi-byte (acentos, emoji), mantendo o bcrypt seguro.
 * - 128 é menor que MAX_HEADER_SIZE / MAX_BODY_FIELD típicos — não
 *   sobrescreve outros limites de plataforma.
 * - Suficiente pra UX: frase-senha de 16 palavras × 8 chars = 128.
 */
export const PASSWORD_MAX_LENGTH = 128;

/** Mínimo de caracteres exigidos. Política original do projeto. */
export const PASSWORD_MIN_LENGTH = 8;

/** Regex de complexidade: min 8 + max 128 + 1 maiúscula + 1 minúscula +
 * 1 número. O `{8,128}` no fim já implementa a faixa, mas o guard explícito
 * de comprimento em `isValidPassword` evita pagar o custo do regex pra
 * strings absurdamente longas. */
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/;

/** Mensagem unificada — exibida em UI quando regex falha OU comprimento
 * estoura. Texto em PT-BR com acentuação (regra do projeto). */
export const PASSWORD_REQUIREMENTS_MESSAGE =
  "Senha deve ter entre 8 e 128 caracteres, com 1 maiúscula, 1 minúscula e 1 número";

/** Validação composta: tipo + comprimento + regex. Retorna `true` se OK.
 *
 * Ordem importa:
 * 1. Type check — rejeita não-string antes de qualquer string op.
 * 2. Length check — rejeita 1MB ANTES do regex (defense in depth).
 * 3. Regex — só roda quando o input é tratável.
 *
 * Mantém o contrato (input string com 8-N chars + complexidade) com o cap
 * superior. Callers na forma: `if (!isValidPassword(password)) return 400`. */
export function isValidPassword(password: unknown): password is string {
  if (typeof password !== "string") return false;
  if (password.length < PASSWORD_MIN_LENGTH) return false;
  if (password.length > PASSWORD_MAX_LENGTH) return false;
  return PASSWORD_REGEX.test(password);
}
