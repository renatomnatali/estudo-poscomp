/**
 * Resolução de IP confiável atrás de proxy reverso (Cloudflare).
 *
 * Contexto (verificado empiricamente 2026-06-24 no sem-cilada): quando o domínio
 * é fronteado pela Cloudflare, que encaminha à Vercel, o `x-real-ip` que a
 * Vercel preenche é o IP de EGRESS da Cloudflare — que VARIA request a request
 * (pool de saída da CF), não o do cliente. O IP real do cliente vem em
 * `cf-connecting-ip`.
 *
 * Mas `cf-connecting-ip` é FORJÁVEL por quem fala direto com a origem: o
 * deployment `*.vercel.app` responde sem passar pela CF. Logo, confiar
 * cegamente em `cf-connecting-ip` reabriria o spoof que estamos fechando.
 *
 * Solução: só confiar em `cf-connecting-ip` quando o PEER imediato
 * (`x-real-ip`) pertencer a um range oficial da Cloudflare. `x-real-ip` é
 * preenchido pela plataforma Vercel a partir do IP real da conexão e NÃO é
 * spoofável. Assim:
 *  - Via CF: peer ∈ CF → confia no `cf-connecting-ip` (cliente real).
 *  - Direto no `*.vercel.app` (com ou sem header forjado): peer = IP real do
 *    atacante ∉ CF → ignora o `cf-connecting-ip` forjado e usa `x-real-ip`.
 *
 * DIREÇÃO DE FALHA (proposital): se a Cloudflare passar a usar um range novo
 * ausente nesta lista, o peer não casa → caímos em `x-real-ip` = IP da CF = o
 * comportamento atual (contador espalhado), NUNCA em lockout de usuário
 * legítimo. Restaurar = atualizar a lista (deploy) ou setar TRUSTED_PROXY_CIDRS.
 *
 * Ranges base: https://www.cloudflare.com/ips-v4 e /ips-v6 (captura 2026-06-24).
 * Override operacional SEM deploy de código: env `TRUSTED_PROXY_CIDRS` com
 * CIDRs separados por vírgula — SUBSTITUI a lista base quando setada (útil se a
 * CF mudar ranges antes do próximo deploy, ou para outro provider de borda).
 */

// Fonte: https://www.cloudflare.com/ips-v4 (captura 2026-06-24)
const CLOUDFLARE_CIDRS_V4 = [
  "173.245.48.0/20",
  "103.21.244.0/22",
  "103.22.200.0/22",
  "103.31.4.0/22",
  "141.101.64.0/18",
  "108.162.192.0/18",
  "190.93.240.0/20",
  "188.114.96.0/20",
  "197.234.240.0/22",
  "198.41.128.0/17",
  "162.158.0.0/15",
  "104.16.0.0/13",
  "104.24.0.0/14",
  "172.64.0.0/13",
  "131.0.72.0/22",
];

// Fonte: https://www.cloudflare.com/ips-v6 (captura 2026-06-24)
const CLOUDFLARE_CIDRS_V6 = [
  "2400:cb00::/32",
  "2606:4700::/32",
  "2803:f800::/32",
  "2405:b500::/32",
  "2405:8100::/32",
  "2a06:98c0::/29",
  "2c0f:f248::/32",
];

interface ParsedIp {
  version: 4 | 6;
  value: bigint;
}

interface ParsedCidr {
  version: 4 | 6;
  base: bigint;
  bits: number;
}

/** Converte "1.2.3.4" em inteiro de 32 bits. Retorna null se malformado. */
function parseIpv4(ip: string): ParsedIp | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let value = BigInt(0);
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const n = Number(p);
    if (n > 255) return null;
    value = (value << BigInt(8)) | BigInt(n);
  }
  return { version: 4, value };
}

/**
 * Converte um endereço IPv6 (com ou sem "::") em inteiro de 128 bits.
 * Aceita zone-id (`%eth0`, descartado). Não suporta IPv4-embutido em IPv6
 * (forma "::a.b.c.d" sem ::ffff: — irrelevante para egress CF; cai em null →
 * degrada para x-real-ip, direção de falha correta).
 */
function parseIpv6(ip: string): ParsedIp | null {
  const pct = ip.indexOf("%");
  if (pct >= 0) ip = ip.slice(0, pct);

  const halves = ip.split("::");
  if (halves.length > 2) return null;

  const head = halves[0] ? halves[0].split(":") : [];
  const tail =
    halves.length === 2 ? (halves[1] ? halves[1].split(":") : []) : null;

  let groups: string[];
  if (tail === null) {
    // Sem "::" — precisa de exatamente 8 grupos.
    if (head.length !== 8) return null;
    groups = head;
  } else {
    const missing = 8 - head.length - tail.length;
    if (missing < 0) return null;
    groups = [...head, ...Array<string>(missing).fill("0"), ...tail];
  }

  let value = BigInt(0);
  for (const g of groups) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(g)) return null;
    value = (value << BigInt(16)) | BigInt(parseInt(g, 16));
  }
  return { version: 6, value };
}

/** Parseia um IP (v4 ou v6, inclui IPv4-mapped ::ffff:a.b.c.d). */
function parseIp(ip: string): ParsedIp | null {
  const trimmed = ip.trim();
  if (!trimmed) return null;
  const mapped = trimmed.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i);
  if (mapped) return parseIpv4(mapped[1]);
  return trimmed.includes(":") ? parseIpv6(trimmed) : parseIpv4(trimmed);
}

/** Parseia "base/bits". Retorna null se malformado ou bits fora da faixa. */
function parseCidr(cidr: string): ParsedCidr | null {
  const slash = cidr.lastIndexOf("/");
  if (slash < 0) return null;
  const parsed = parseIp(cidr.slice(0, slash));
  if (!parsed) return null;
  const bits = Number(cidr.slice(slash + 1));
  const maxBits = parsed.version === 4 ? 32 : 128;
  if (!Number.isInteger(bits) || bits < 0 || bits > maxBits) return null;
  return { version: parsed.version, base: parsed.value, bits };
}

/** True se `ip` está dentro do bloco `cidr`. Compara só os bits de rede. */
function inCidr(ip: ParsedIp, cidr: ParsedCidr): boolean {
  if (ip.version !== cidr.version) return false;
  const totalBits = cidr.version === 4 ? BigInt(32) : BigInt(128);
  const hostBits = totalBits - BigInt(cidr.bits);
  // Desloca ambos à direita pelos host bits → restam só os bits de rede.
  // Cobre /32 e /128 (hostBits = 0n, shift inócuo) sem máscara negativa.
  return ip.value >> hostBits === cidr.base >> hostBits;
}

let cidrCache: ParsedCidr[] | null = null;

function trustedCidrs(): ParsedCidr[] {
  if (cidrCache !== null) return cidrCache;

  const override = process.env.TRUSTED_PROXY_CIDRS?.trim();
  const raw = override
    ? override
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [...CLOUDFLARE_CIDRS_V4, ...CLOUDFLARE_CIDRS_V6];

  const parsed: ParsedCidr[] = [];
  for (const c of raw) {
    const cidr = parseCidr(c);
    if (cidr && cidr.bits === 0) {
      // /0 (0.0.0.0/0 ou ::/0) marcaria TODO IP como proxy confiável →
      // reabriria o spoof de cf-connecting-ip que este módulo fecha. Recusamos
      // sempre. A lista base nunca usa /0; só um override mal configurado chega
      // aqui. Recusar deixa a lista (potencialmente) vazia, o que degrada com
      // segurança: isTrustedProxy = false → getClientIp usa x-real-ip
      // (não-spoofável), nunca o header forjável.
      console.error(
        `[trusted-proxy] CIDR /0 recusado (marcaria todo IP como confiável): ${c}`,
      );
    } else if (cidr) {
      parsed.push(cidr);
    } else if (override) {
      // CIDR inválido no override de produção: avisa e ignora (não derruba o
      // app). A lista base nunca cai aqui (é estática e validada).
      console.warn(
        `[trusted-proxy] CIDR inválido ignorado em TRUSTED_PROXY_CIDRS: ${c}`,
      );
    }
  }
  cidrCache = parsed;
  return cidrCache;
}

/**
 * True se `ip` (o peer imediato visto pela Vercel) é um proxy confiável
 * (Cloudflare, por default; ou o que `TRUSTED_PROXY_CIDRS` definir).
 */
export function isTrustedProxy(ip: string): boolean {
  const parsed = parseIp(ip);
  if (!parsed) return false;
  return trustedCidrs().some((c) => inCidr(parsed, c));
}

/** Apenas para testes — força releitura de TRUSTED_PROXY_CIDRS. */
export function __resetTrustedProxyCache(): void {
  cidrCache = null;
}
