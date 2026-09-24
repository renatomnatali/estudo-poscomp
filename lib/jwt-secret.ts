/**
 * Retorna o secret JWT codificado.
 * Em produção valida que JWT_SECRET está definido e é forte o suficiente.
 * A validação é lazy (não roda no build, apenas no primeiro uso em runtime).
 *
 * Espelho do sem-cilada (src/lib/jwt-secret.ts).
 *
 * Separado de auth.ts para poder ser importado no middleware (Edge Runtime)
 * sem arrastar a dependência de `cookies` de `next/headers`.
 *
 * Em dev sem JWT_SECRET: gera random bytes em runtime — cada boot invalida
 * sessões antigas, mas evita o risco de um secret hardcoded idêntico em
 * todas as instalações ser commitado/vazado.
 */
import { isProduction, readEnv } from "./env";

let _secret: Uint8Array | null = null;

const HEX_REGEX = /^[0-9a-fA-F]+$/;
const MIN_ENTROPY_BITS_PER_CHAR = 4.0;

/**
 * Shannon entropy em bits por caractere — mede dispersão de simbolos.
 * "aaaaaa..." = 0 bits/char (1 simbolo unico); base64 random ≈ 6 bits/char;
 * hex random ≈ 4 bits/char.
 *
 * Aceitamos >= 4.0 bits/char (suficiente para hex completo). Aceitamos
 * tambem secrets >= 64 chars puramente hex sem checar entropia: 64 hex
 * chars = 32 bytes = 256 bits, formato canonico do `openssl rand -hex 32`.
 */
function shannonEntropy(input: string): number {
  if (input.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const ch of input) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  let entropy = 0;
  for (const count of counts.values()) {
    const p = count / input.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/**
 * Aprova o secret em prod se:
 *  - 64+ chars puramente hex (formato `openssl rand -hex 32`); OU
 *  - >= 32 chars E Shannon entropy >= 4.0 bits/char.
 *
 * Rejeita exemplos como "your-jwt-secret-here" (32 chars mas entropia
 * ≈ 3.4 bits/char por repetição), "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
 * (entropia 0) e qualquer placeholder/copy-paste obvio.
 */
function isStrongSecret(raw: string): boolean {
  if (raw.length >= 64 && HEX_REGEX.test(raw)) return true;
  if (raw.length >= 32 && shannonEntropy(raw) >= MIN_ENTROPY_BITS_PER_CHAR) return true;
  return false;
}

export function getSecret(): Uint8Array {
  if (_secret) return _secret;

  const raw = readEnv("JWT_SECRET");

  if (isProduction()) {
    if (!raw || raw.length < 32) {
      throw new Error(
        "JWT_SECRET deve estar definido e ter pelo menos 32 caracteres",
      );
    }
    if (!isStrongSecret(raw)) {
      // Length pass mas entropia baixa — palavra-passe humana, repeticao,
      // placeholder. Forca o operador a usar `openssl rand -hex 32`.
      throw new Error(
        "JWT_SECRET com baixa entropia — use `openssl rand -hex 32` (64 chars hex) ou string aleatoria de 32+ chars",
      );
    }
  }

  if (raw) {
    _secret = new TextEncoder().encode(raw);
    return _secret;
  }

  // Dev sem secret: gera valor aleatório em runtime. Invalida sessões a cada
  // restart (aceitável em dev) e evita o risco de um valor hardcoded vazar.
  // Usa Web Crypto API (disponível em Node 19+ e Edge Runtime via globalThis).
  console.warn(
    "[Security] JWT_SECRET não definido — gerando secret ephemeral. Sessões invalidam a cada boot.",
  );
  _secret = new Uint8Array(32);
  globalThis.crypto.getRandomValues(_secret);
  return _secret;
}

// Exportado apenas para testes — nao usar fora do test runner.
export const __internals = { shannonEntropy, isStrongSecret };
