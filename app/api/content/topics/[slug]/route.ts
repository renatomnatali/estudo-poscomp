import { NextResponse } from 'next/server';

import { getTopicBySlug } from '@/lib/content-data';

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const topic = await getTopicBySlug(slug);

  if (!topic) {
    return NextResponse.json({ error: 'Tópico não encontrado.' }, { status: 404 });
  }

  return NextResponse.json(topic);
}
