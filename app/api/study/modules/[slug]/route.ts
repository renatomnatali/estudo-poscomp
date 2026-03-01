import { NextResponse } from 'next/server';

import { getStudyModule } from '@/lib/study-data';

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const moduleData = getStudyModule(slug);

  if (!moduleData) {
    return NextResponse.json({ error: 'Modulo nao encontrado.' }, { status: 404 });
  }

  return NextResponse.json(moduleData);
}
