import { NextRequest, NextResponse } from 'next/server';

import { getStudyTrackCards } from '@/lib/study-data';

export async function GET(request: NextRequest) {
  const filter = request.nextUrl.searchParams.get('filter') || 'all';
  const items = getStudyTrackCards().filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'free') return item.free;
    if (filter === 'done') return item.status === 'done';
    if (filter === 'fund') return item.macroArea === 'fundamentos';
    if (filter === 'mat') return item.macroArea === 'matematica';
    if (filter === 'tec') return item.macroArea === 'tecnologia';
    return true;
  });

  return NextResponse.json({ items });
}
