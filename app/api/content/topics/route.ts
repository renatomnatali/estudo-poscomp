import { NextRequest, NextResponse } from 'next/server';

import { listTopics } from '@/lib/content-data';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const items = listTopics({
    macroArea: searchParams.get('macroArea') || undefined,
    subTopic: searchParams.get('subTopic') || undefined,
    difficulty: searchParams.get('difficulty') || undefined,
  });

  return NextResponse.json({ items });
}
