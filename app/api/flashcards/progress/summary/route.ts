import { NextRequest, NextResponse } from 'next/server';

import { getFlashcardProgressSummary } from '@/lib/flashcards-repo';

export async function GET(request: NextRequest) {
  const userId = String(
    request.nextUrl.searchParams.get('userId') || request.headers.get('x-user-id') || ''
  ).trim();

  if (!userId) {
    return NextResponse.json(
      { error: 'Autenticação necessária para consultar resumo.' },
      { status: 401 }
    );
  }

  const summary = await getFlashcardProgressSummary(userId);
  return NextResponse.json(summary);
}
