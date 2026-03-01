import { NextRequest, NextResponse } from 'next/server';

import { listTopics } from '@/lib/content-data';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const items = await listTopics({
    macroArea: searchParams.get('macroArea') || undefined,
    subTopic: searchParams.get('subTopic') || undefined,
    difficulty: searchParams.get('difficulty') || undefined,
    incidence: searchParams.get('incidence') || undefined,
    limit: searchParams.get('limit') || undefined,
  });

  return NextResponse.json({ items });
}
