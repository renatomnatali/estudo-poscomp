import { NextResponse } from 'next/server';

import { gradeModuleQuiz, getStudyModule } from '@/lib/study-data';

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  if (!getStudyModule(slug)) {
    return NextResponse.json({ error: 'Modulo nao encontrado.' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const questionId = String(body?.questionId || '').trim();
  const choice = String(body?.choice || '').trim();

  if (!questionId || !choice) {
    return NextResponse.json(
      { error: 'Informe questionId e choice.' },
      { status: 400 }
    );
  }

  const result = gradeModuleQuiz(slug, questionId, choice);
  if (!result) {
    return NextResponse.json({ error: 'Questao do modulo nao encontrada.' }, { status: 404 });
  }

  return NextResponse.json(result);
}
