import { NextRequest, NextResponse } from 'next/server';

import { resolveAdminAccess } from '@/lib/admin-auth';
import { listAdminUsers } from '@/lib/admin-users-repo';

export async function GET(request: NextRequest) {
  const admin = await resolveAdminAccess();
  if (!admin.allowed) {
    return NextResponse.json({ error: admin.error || 'Acesso negado.' }, { status: admin.status || 403 });
  }

  const search = String(request.nextUrl.searchParams.get('q') || '').trim() || undefined;
  const payload = await listAdminUsers({ search });

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
