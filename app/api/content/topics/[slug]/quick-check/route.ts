import { NextResponse } from 'next/server';

import { listTopicQuickChecks } from '@/lib/topics-repo';

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const items = await listTopicQuickChecks(slug);

  if (!items) {
    return NextResponse.json({ error: 'Tópico não encontrado.' }, { status: 404 });
  }

  return NextResponse.json({ items });
}
