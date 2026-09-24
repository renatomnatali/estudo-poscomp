/**
 * Resolve a URL base da aplicação com fallback chain:
 *
 * 1. APP_URL (env var explícita — usar em produção)
 * 2. VERCEL_URL (auto-set pelo Vercel em cada deploy, sem protocolo)
 * 3. localhost para desenvolvimento local
 *
 * Em Preview no Vercel, omita APP_URL — o código usa VERCEL_URL
 * automaticamente, que aponta para a URL correta do deploy.
 *
 * Espelho do sem-cilada (src/lib/app-url.ts), trazendo apenas `getAppUrl` —
 * o helper de hostname canônico de lá serve à atribuição de origem do GA4
 * (fora do escopo deste PR).
 */
export function getAppUrl(): string {
  const url =
    process.env.APP_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  // Validação defensiva: garante que só sai URL http/https
  if (!/^https?:\/\//.test(url)) {
    throw new Error(`APP_URL inválida: ${url}`);
  }

  return url;
}
