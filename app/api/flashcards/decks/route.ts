import { NextRequest, NextResponse } from 'next/server';

import { listFlashcardDecks } from '@/lib/flashcards-repo';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const items = await listFlashcardDecks({
    macroArea: searchParams.get('macroArea') || undefined,
    subTopic: searchParams.get('subTopic') || undefined,
    difficulty: searchParams.get('difficulty') || undefined,
    limit: searchParams.get('limit') || undefined,
  });

  return NextResponse.json({ items });
}
