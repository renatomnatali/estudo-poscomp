import { auth, currentUser } from '@clerk/nextjs/server';

import { isClerkEnabledServer } from '@/lib/auth-config';

export interface AdminAccessResolution {
  allowed: boolean;
  status: number;
  error?: string;
  adminEmail?: string;
}

function normalizeEmail(value?: string | null) {
  return String(value || '').trim().toLowerCase();
}

function parseAdminEmails() {
  const raw = String(process.env.ADMIN_EMAILS || '').trim();
  if (!raw) return new Set<string>();

  return new Set(
    raw
      .split(',')
      .map((entry) => normalizeEmail(entry))
      .filter((entry) => entry.length > 0)
  );
}

export async function resolveAdminAccess(): Promise<AdminAccessResolution> {
  if (!isClerkEnabledServer()) {
    return {
      allowed: true,
      status: 200,
      adminEmail: normalizeEmail(process.env.DEV_USER_EMAIL) || 'local-dev-admin',
    };
  }

  const session = await auth();
  if (!session.userId) {
    return {
      allowed: false,
      status: 401,
      error: 'Autenticação necessária para acessar o painel administrativo.',
    };
  }

  const user = typeof currentUser === 'function' ? await currentUser().catch(() => null) : null;
  const email =
    normalizeEmail(user?.primaryEmailAddress?.emailAddress) ||
    normalizeEmail(user?.emailAddresses?.[0]?.emailAddress);

  if (!email) {
    return {
      allowed: false,
      status: 403,
      error: 'Não foi possível validar seu e-mail de administrador.',
    };
  }

  const adminEmails = parseAdminEmails();
  if (adminEmails.size === 0) {
    return {
      allowed: false,
      status: 403,
      error: 'ADMIN_EMAILS não configurado. Defina os e-mails autorizados no ambiente.',
    };
  }

  if (!adminEmails.has(email)) {
    return {
      allowed: false,
      status: 403,
      error: 'Acesso restrito ao painel administrativo.',
    };
  }

  return {
    allowed: true,
    status: 200,
    adminEmail: email,
  };
}
