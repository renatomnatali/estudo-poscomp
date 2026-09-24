/**
 * Logger de eventos de segurança.
 * Usa console.log estruturado (JSON) para fácil integração com
 * Vercel Logs, Datadog, Sentry etc.
 *
 * Espelho do mecanismo do sem-cilada (src/lib/security-logger.ts), com a
 * união de eventos reduzida aos emitidos pelas libs deste PR A
 * (csrf, rate-limit). Eventos dos fluxos de login/register (PR B) são
 * adicionados lá. Pseudonimização de documento fiscal/placa do original
 * não vem — são PII do outro produto.
 *
 * LGPD: em produção, e-mails inteiros (local+domínio) são substituídos por
 * um hash HMAC com salt — nenhum pedaço do email fica em claro no log.
 *
 * O hash permite correlacionar eventos do MESMO e-mail (mesmo entrada → mesmo
 * hash) sem reter PII. É resistente a rainbow tables por usar HMAC com
 * LOG_HASH_SECRET.
 *
 * Em produção, LOG_HASH_SECRET é OBRIGATÓRIO — sem ele a pseudonimização cai
 * em SHA256 puro, que um adversário com lista fechada de emails reverte
 * trivialmente via rainbow table, quebrando a promessa LGPD. Por isso:
 *
 *   - Produção real (isProduction()) sem secret → THROW no primeiro uso
 *     (fail-closed). O primeiro request a uma rota com securityLog quebra,
 *     evidenciando misconfiguração imediatamente.
 *   - Dev / preview / test sem secret → console.warn ruidoso a cada uso +
 *     fallback SHA256 puro (degradado, mas explícito).
 *
 * Exemplo: "joao@gmail.com" → "<email:a3f2c7e1d9b4>"
 */
import { createHash, createHmac } from "crypto";
import { isProduction, readEnv } from "@/lib/env";

const MISSING_SECRET_MESSAGE =
  "LOG_HASH_SECRET é obrigatório em produção (LGPD pseudonimização). Defina a env var antes de iniciar o servidor.";

/**
 * Calcula hash hexadecimal de `input` usando HMAC-SHA256 com LOG_HASH_SECRET.
 *
 * Fail-closed em produção real (Vercel production OU NODE_ENV=production fora
 * da Vercel): se o secret estiver ausente, joga Error. Em dev/preview/test,
 * avisa no console e cai em SHA256 puro (não-reversível por leitura casual,
 * mas vulnerável a rainbow tables — explicitamente sinalizado).
 */
function hashWithSecret(input: string): string {
  const salt = readEnv("LOG_HASH_SECRET");
  if (salt) {
    return createHmac("sha256", salt).update(input).digest("hex");
  }
  if (isProduction()) {
    throw new Error(MISSING_SECRET_MESSAGE);
  }
  // Não-prod sem secret: warn ruidoso a cada uso. Sem guard global —
  // cold start de Vercel Functions paralelas perde o guard de qualquer
  // jeito, e em dev queremos visibilidade contínua.
  console.warn(
    "[SECURITY] LOG_HASH_SECRET ausente — pseudonimização degradada (SHA256 sem HMAC). Aceitável em dev/preview, MAS proibido em produção.",
  );
  return createHash("sha256").update(input).digest("hex");
}

function pseudonymizeEmail(email: string | undefined): string | undefined {
  if (!email) return email;
  if (!isProduction()) return email;
  return `<email:${hashWithSecret(email).slice(0, 12)}>`;
}

// Eventos de auth (APR-3, PR B): vocabulário espelhado do sem-cilada
// (src/lib/security-logger.ts) para as rotas /api/auth/*. PASSWORD_SET_*
// é novo daqui: o set-password de lá é fluxo de compra guest e loga
// REGISTER_SUCCESS; aqui é consumo de PasswordResetToken, com nome próprio.
type SecurityEvent =
  /** POST sem header Sec-Fetch-Site (client legacy/curl) — permitido, mas
   *  logado para medir o volume do fallback de compat do CSRF. */
  | "CSRF_HEADER_ABSENT"
  /** Redis do rate limiter ausente em produção: teto passa a valer por instância. */
  | "SYSTEM_RATE_LIMIT_DEGRADED"
  /** Redis do rate limiter respondeu com erro — política do limiter decidiu
   *  (fail-closed/fail-open/degradação para memória). */
  | "RATE_LIMIT_BACKEND_ERROR"
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGIN_RATE_LIMITED"
  /** Lookup de usuário no login falhou por erro transitório de conexão. */
  | "LOGIN_DB_ERROR"
  | "REGISTER_SUCCESS"
  | "REGISTER_DUPLICATE"
  | "REGISTER_RATE_LIMITED"
  /** Desafio anti-bot (Turnstile) reprovado — detail identifica a rota. */
  | "TURNSTILE_FAILED"
  | "VERIFY_EMAIL_SUCCESS"
  | "VERIFY_EMAIL_FAILED"
  | "RESEND_VERIFICATION_REQUESTED"
  | "RESEND_VERIFICATION_RATE_LIMITED"
  | "LOGOUT"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET_RATE_LIMITED"
  | "PASSWORD_RESET_FAILED"
  | "PASSWORD_RESET_SUCCESS"
  | "PASSWORD_SET_FAILED"
  | "PASSWORD_SET_SUCCESS";

interface SecurityLogPayload {
  event: SecurityEvent;
  /**
   * IP do request. Opcional porque alguns eventos vêm de contexto sem
   * request (cron, erro de backend interno como RATE_LIMIT_BACKEND_ERROR).
   */
  ip?: string;
  email?: string;
  userId?: string;
  detail?: string;
}

export function securityLog(payload: SecurityLogPayload): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level: "SECURITY",
    ...payload,
    email: pseudonymizeEmail(payload.email),
  };

  // Em produção: structured JSON para ingestão por plataformas de log
  // Em dev: formato legível (email em claro para debug)
  if (isProduction()) {
    console.log(JSON.stringify(entry));
  } else {
    console.log(
      `[SECURITY] ${entry.event} | ip=${entry.ip} | email=${entry.email ?? "-"} | ${entry.detail ?? ""}`,
    );
  }
}
