import { NextRequest, NextResponse } from 'next/server';

import { resolveAdminAccess } from '@/lib/admin-auth';
import { setUserVipAccess } from '@/lib/admin-users-repo';

export async function POST(request: NextRequest) {
  const admin = await resolveAdminAccess();
  if (!admin.allowed) {
    return NextResponse.json({ error: admin.error || 'Acesso negado.' }, { status: admin.status || 403 });
  }

  const body = await request.json().catch(() => null);
  const email = String(body?.email || '').trim() || undefined;
  const userId = String(body?.userId || '').trim() || undefined;
  const enabled = typeof body?.enabled === 'boolean' ? body.enabled : null;
  const reason = String(body?.reason || '').trim() || undefined;

  if (enabled === null) {
    return NextResponse.json({ error: 'Campo "enabled" deve ser booleano.' }, { status: 400 });
  }

  if (!email && !userId) {
    return NextResponse.json({ error: 'Informe e-mail ou userId.' }, { status: 400 });
  }

  try {
    const updated = await setUserVipAccess({
      email,
      userId,
      enabled,
      reason,
      grantedBy: admin.adminEmail,
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao atualizar VIP.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
