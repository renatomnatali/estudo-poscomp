import { auth, currentUser } from '@clerk/nextjs/server';

import { isClerkEnabledServer } from '@/lib/auth-config';

export interface RouteIdentity {
  userId?: string;
  email?: string;
}

/**
 * Lê userId de fontes do cliente (body, query, header). USADO APENAS EM DEV.
 * Em produção (NODE_ENV !== 'development') retorna null para forçar 401 —
 * sem esse guard, misconfiguration de Clerk em prod abriria vetor de spoofing.
 */
function getDevFallbackUserId(request: Request, payloadUserId?: unknown): string | null {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const fromBody = String(payloadUserId || '').trim();
  if (fromBody) return fromBody;

  const { searchParams } = new URL(request.url);
  const fromQuery = String(searchParams.get('userId') || '').trim();
  if (fromQuery) return fromQuery;

  const fromHeader = String(request.headers.get('x-user-id') || '').trim();
  if (fromHeader) return fromHeader;

  return 'local-dev-user';
}

function getDevFallbackEmail(request: Request, payloadEmail?: unknown): string | undefined {
  if (process.env.NODE_ENV !== 'development') {
    return undefined;
  }

  const fromBody = String(payloadEmail || '').trim();
  if (fromBody) return fromBody;

  const { searchParams } = new URL(request.url);
  const fromQuery = String(searchParams.get('email') || '').trim();
  if (fromQuery) return fromQuery;

  const fromHeader = String(request.headers.get('x-user-email') || '').trim();
  if (fromHeader) return fromHeader;

  return process.env.DEV_USER_EMAIL || undefined;
}

/**
 * Resolve userId + email com UMA única chamada paralela a `auth()` e `currentUser()`
 * (em vez de duas chamadas separadas que criam inconsistência entre userId e email).
 *
 * Em produção, exige Clerk configurado — fallback do cliente NÃO é aceito (vide
 * `getDevFallbackUserId`). Em desenvolvimento, aceita fallback de body/query/header
 * para facilitar tests e dev manual.
 */
export async function resolveRouteIdentity(
  request: Request,
  payloadUserId?: unknown,
  payloadEmail?: unknown
): Promise<RouteIdentity> {
  if (isClerkEnabledServer()) {
    const [session, user] = await Promise.all([
      auth(),
      typeof currentUser === 'function' ? currentUser().catch(() => null) : Promise.resolve(null),
    ]);

    if (!session.userId) return {};

    const email =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      undefined;

    return { userId: session.userId, email };
  }

  const fallbackUserId = getDevFallbackUserId(request, payloadUserId);
  if (!fallbackUserId) return {};

  return {
    userId: fallbackUserId,
    email: getDevFallbackEmail(request, payloadEmail),
  };
}
