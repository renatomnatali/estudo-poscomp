import { NextRequest, NextResponse } from 'next/server';

import { getFlashcardQueue } from '@/lib/flashcards-repo';

const VALID_MODES = new Set(['today', 'topic', 'mistakes']);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('mode') || 'today';
  const userId = searchParams.get('userId') || request.headers.get('x-user-id') || undefined;
  const topicSlug = searchParams.get('topicSlug') || undefined;
  const limit = searchParams.get('limit') || undefined;

  if (!VALID_MODES.has(mode)) {
    return NextResponse.json(
      { error: 'Modo inválido. Use today, topic ou mistakes.' },
      { status: 400 }
    );
  }

  const payload = await getFlashcardQueue({
    mode: mode as 'today' | 'topic' | 'mistakes',
    userId: userId ? String(userId).trim() : undefined,
    topicSlug,
    limit,
  });

  return NextResponse.json(payload);
}
