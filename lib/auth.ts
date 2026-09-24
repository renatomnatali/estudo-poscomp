import { SignJWT, jwtVerify, type JWTPayload as JosePayload } from "jose";
import { cookies } from "next/headers";
import { getSecret } from "@/lib/jwt-secret";
import { db } from "@/lib/db";

export { getSecret };

/**
 * Sessão JWT espelhada do sem-cilada (src/lib/auth.ts) com adaptações APR-3:
 * sem AGENCY/EDITOR (Role = USER|ADMIN) e SEM `userAuthTag(userId)` — lá é um
 * no-op defensivo para chamadores de `revalidateTag`; reintroduzir aqui apenas
 * quando um PR passar a usar `revalidateTag` (manter o diff-arquivo-a-arquivo
 * honesto).
 */

/**
 * Níveis de acesso da aplicação. Espelha o enum `Role` do Prisma; mantido
 * como union de string literais porque o JWT é serializado.
 * (Adaptação APR-3: sem AGENCY/EDITOR — escopos do outro produto.)
 */
export type SessionRole = "USER" | "ADMIN";

/** Todos os valores de SessionRole. Fonte única para validar o `role` vindo do
 * JWT contra o DB — itera por aqui em vez de listar valores à mão, para que um
 * role novo nunca seja silenciosamente colapsado em "USER". */
export const SESSION_ROLES: readonly SessionRole[] = ["USER", "ADMIN"];

export interface JwtPayload {
  sub: string;
  email: string;
  emailVerified: boolean;
  role?: SessionRole;
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(getSecret());
}

/**
 * Valida apenas a assinatura/expiração do JWT. Não consulta DB.
 * Útil em contextos Edge (middleware). NÃO invalida sessões pós-reset de senha —
 * para esse caso use `getSession()` (que valida contra DB).
 */
export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Estado de auth do usuário em formato 100% serializável: apenas timestamps
 * em ms (`number | null`) e `exists: boolean`. Callers comparam contra `iat`
 * (segundos) sem reidratar `Date`.
 */
export interface UserAuthState {
  /** `true` se o usuário existe (registro físico no banco). */
  exists: boolean;
  /**
   * `passwordChangedAt` em milissegundos epoch, ou `null` se nunca trocou.
   * Comparar com `iat * 1000` para invalidar sessões anteriores à troca.
   */
  passwordChangedAtMs: number | null;
  /**
   * `deletedAt` em milissegundos epoch, ou `null` se conta ativa. Qualquer
   * valor não-null = soft-deleted (LGPD self-service) → rejeitar sessão.
   */
  deletedAtMs: number | null;
  /**
   * Role atual no banco. Comparar com `role` do JWT — divergência indica
   * downgrade/upgrade pós-emissão (ex.: ADMIN rebaixado a USER) e exige
   * invalidação da sessão. `null` quando usuário não existe.
   */
  role: SessionRole | null;
}

/**
 * Lê estado de auth (deletedAt, passwordChangedAt, role) do usuário.
 * Compartilhado entre `getSession()` e `verifySessionWithDb()` —
 * 1 query indexada (~1ms) por chamada, aceitável em rotas autenticadas.
 *
 * Retorna `exists: false` quando o usuário não existe no banco — a forma
 * é sempre `UserAuthState` para manter o tipo uniforme (callers checam
 * `exists`/`role !== null` antes de prosseguir).
 */
async function fetchUserAuthState(userId: string): Promise<UserAuthState> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { passwordChangedAt: true, deletedAt: true, role: true },
  });
  if (!user) {
    return {
      exists: false,
      passwordChangedAtMs: null,
      deletedAtMs: null,
      role: null,
    };
  }
  return {
    exists: true,
    passwordChangedAtMs: user.passwordChangedAt ? user.passwordChangedAt.getTime() : null,
    deletedAtMs: user.deletedAt ? user.deletedAt.getTime() : null,
    role: user.role,
  };
}

export function getUserAuthState(userId: string): Promise<UserAuthState> {
  // Sem cache de auth-state (decisão do sem-cilada após incidente com
  // `unstable_cache` em Next 16: request com cookie novo disparava
  // Invariant Violation interna do cache layer). 1 query/request a
  // `User.findUnique` por rota autenticada é aceitável (índice em `id`, ~1ms)
  // — validação por request, sempre contra o estado atual do banco.
  return fetchUserAuthState(userId);
}

/**
 * Razão pela qual um token JWT assinado deixou de ser válido.
 * `jwt_invalid` cobre assinatura/expiração inválidas (não consulta DB).
 */
export type SessionInvalidReason =
  | "jwt_invalid"
  | "user_not_found"
  | "deleted"
  | "password_changed"
  | "role_changed";

export type SessionValidation =
  | {
      valid: true;
      payload: JwtPayload;
      /**
       * Role autoritativo lido do banco. Diferente do `payload.role` apenas
       * em janela curta antes de o cache de auth invalidar — handlers
       * que checam permissão devem usar este, não `payload.role`.
       */
      dbRole: SessionRole;
    }
  | { valid: false; reason: SessionInvalidReason; userId?: string };

/**
 * Versão sem `cookies()` de `getSession()` — para callers que recebem o
 * token direto (ex.: middleware/proxy lendo `request.cookies`).
 *
 * Mesma lógica de invalidação contra o banco que `getSession()`, mas retorna
 * o motivo da falha para que o caller decida.
 */
export async function verifySessionWithDb(token: string): Promise<SessionValidation> {
  let raw: JosePayload;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    raw = payload;
  } catch {
    return { valid: false, reason: "jwt_invalid" };
  }

  const userId = raw.sub as string;
  const iat = typeof raw.iat === "number" ? raw.iat : 0;

  const state = await getUserAuthState(userId);

  if (!state.exists || state.role === null) {
    return { valid: false, reason: "user_not_found", userId };
  }
  if (state.deletedAtMs !== null) return { valid: false, reason: "deleted", userId };

  // Compara em segundos (mesma unidade do `iat` JWT). `>=` é inclusive:
  // se reset e emissão acontecem no mesmo segundo, o reset vence — token
  // emitido <= momento da troca de senha deixa de valer.
  if (
    state.passwordChangedAtMs !== null &&
    Math.floor(state.passwordChangedAtMs / 1000) >= iat
  ) {
    return { valid: false, reason: "password_changed", userId };
  }

  // Role do JWT (presente no cookie por até 1h de TTL) pode estar defasado
  // após qualquer transição (ex.: USER promovido a ADMIN, ADMIN rebaixado a
  // USER). Comparamos com o que o DB diz agora — divergência força re-login.
  // IMPORTANTE: NÃO colapsar role em "USER" silenciosamente (regressão
  // histórica do sem-cilada: JWT com role divergente virava "USER", disparava
  // `role_changed` em TODA request e causava loop de re-login). Validamos
  // contra SESSION_ROLES (fonte única) para que todo role novo seja
  // contemplado; token legado sem `role` (ou valor desconhecido) = USER.
  const tokenRole: SessionRole = SESSION_ROLES.includes(raw.role as SessionRole)
    ? (raw.role as SessionRole)
    : "USER";
  if (state.role !== tokenRole) {
    return { valid: false, reason: "role_changed", userId };
  }

  return {
    valid: true,
    payload: raw as unknown as JwtPayload,
    dbRole: state.role,
  };
}

/**
 * Retorna a sessão atual **já validada contra o banco**:
 * - Verifica assinatura do JWT
 * - Rejeita tokens emitidos antes da última troca de senha (passwordChangedAt)
 * - Rejeita usuário deletado, role divergente do JWT
 *
 * Faz 1 query indexada ao DB por chamada (~1ms — ver `getUserAuthState`).
 * Use em API routes e Server Components. Para middleware/Edge (sem acesso a
 * DB), use `verifyToken()`.
 */
export async function getSession(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  const result = await verifySessionWithDb(token);
  if (!result.valid) return null;
  // O role autoritativo é o do banco (tokens legacy sem `role` caem aqui):
  // nunca expor o role do payload sem sobrescrevê-lo pelo validado.
  return { ...result.payload, role: result.dbRole };
}

export async function requireAuth(): Promise<JwtPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("Não autorizado");
  }
  return session;
}
