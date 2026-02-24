import { NextResponse } from 'next/server';

import { gradeAssessment } from '@/lib/assessment';
import { getQuestionMap } from '@/lib/questions-repo';

export async function POST(request: Request) {
  const body = await request.json();
  const answers = Array.isArray(body?.answers) ? body.answers : [];

  if (answers.length === 0) {
    return NextResponse.json(
      { error: 'Nenhuma resposta enviada.' },
      { status: 400 }
    );
  }

  const questionMap = getQuestionMap();
  const result = gradeAssessment(answers, questionMap);

  return NextResponse.json({
    attemptId: body?.attemptId ?? null,
    ...result,
  });
}
