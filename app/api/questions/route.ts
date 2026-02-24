import { NextRequest, NextResponse } from 'next/server';

import { listQuestions } from '@/lib/questions-repo';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const items = listQuestions({
    year: searchParams.get('year') || undefined,
    macroArea: searchParams.get('macroArea') || undefined,
    subTopic: searchParams.get('subTopic') || undefined,
    difficulty: searchParams.get('difficulty') || undefined,
    limit: searchParams.get('limit') || undefined,
  });

  return NextResponse.json({ items, total: items.length });
}
