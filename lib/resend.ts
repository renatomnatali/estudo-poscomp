import { Resend } from "resend";

// Espelho do sem-cilada (src/lib/resend.ts); default do remetente adaptado
// ao domínio deste produto (aprovado.xyz).
export const EMAIL_FROM = process.env.RESEND_FROM || "Aprovado <noreply@aprovado.xyz>";

/**
 * Normaliza a chave da API lida do ambiente: remove espaços em branco e a
 * sequência literal `\n` que o valor às vezes carrega quando é colado ou
 * exportado com quebra de linha. Gotcha real de produção (sem-cilada): a env
 * `RESEND_API_KEY` chegou a ter um `\n` no fim, fazendo o Resend rejeitar a
 * chave com `400 "API key is invalid"`. Chaves Resend são alfanuméricas
 * (`re_…`) e nunca terminam em whitespace ou `\`, então a limpeza é segura.
 */
export function sanitizeApiKey(raw: string | undefined): string {
  return (raw ?? "").trim().replace(/\\n$/, "").trim();
}

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    const apiKey = sanitizeApiKey(process.env.RESEND_API_KEY);
    if (!apiKey) throw new Error("RESEND_API_KEY não configurada");
    _resend = new Resend(apiKey);
  }
  return _resend;
}

type SendPayload = Parameters<Resend["emails"]["send"]>[0];
type SendOptions = Parameters<Resend["emails"]["send"]>[1];

/**
 * Envia um e-mail transacional e **lança** quando o Resend recusa.
 *
 * MOTIVO (incidente 2026-08-12 no sem-cilada, produção): o SDK do Resend NÃO
 * lança em erro de API — `fetchRequest` devolve `{ data: null, error }` quando
 * a resposta não é ok. Todo chamador que fazia
 * `await getResend().emails.send(...)` sem olhar o retorno tratava recusa como
 * sucesso: o `catch` nunca disparava e não havia rastro nenhum do fracasso.
 *
 * Envio transacional DEVE passar por aqui.
 */
export async function sendEmail(payload: SendPayload, options?: SendOptions) {
  const { data, error } = await getResend().emails.send(payload, options);

  if (error) {
    const detail = [error.name, error.message].filter(Boolean).join(": ");
    throw new Error(`Resend recusou o envio: ${detail || "erro desconhecido"}`);
  }

  return data;
}
