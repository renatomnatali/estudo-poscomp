import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

import { isClerkEnabledServer } from '@/lib/auth-config';
import { getDashboardSummaryForUser } from '@/lib/dashboard-repo';

function getFallbackUserId(request: NextRequest) {
  const fromQuery = String(request.nextUrl.searchParams.get('userId') || '').trim();
  if (fromQuery) return fromQuery;

  const fromHeader = String(request.headers.get('x-user-id') || '').trim();
  if (fromHeader) return fromHeader;

  return 'local-dev-user';
}

export async function GET(request: NextRequest) {
  const clerkEnabled = isClerkEnabledServer();

  let userId: string;
  if (clerkEnabled) {
    const session = await auth();
    if (!session.userId) {
      return NextResponse.json(
        { error: 'Autenticação necessária para consultar o dashboard.' },
        { status: 401 }
      );
    }
    userId = session.userId;
  } else {
    userId = getFallbackUserId(request);
  }

  const payload = await getDashboardSummaryForUser(userId);
  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
