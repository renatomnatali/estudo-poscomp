import { NextResponse } from 'next/server';

import { getTopicProgress, saveTopicProgress } from '@/lib/topics-repo';

const VALID_STATUS = new Set(['not_started', 'in_progress', 'completed']);

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const payload = await request.json().catch(() => null);

  const userId = String(payload?.userId || request.headers.get('x-user-id') || '').trim();
  const status = String(payload?.status || '').trim();
  const rawScore = payload?.score;
  const score = rawScore === null || typeof rawScore === 'undefined' ? null : Number(rawScore);

  if (!userId) {
    return NextResponse.json(
      { error: 'Autenticação necessária para salvar progresso.' },
      { status: 401 }
    );
  }

  if (!VALID_STATUS.has(status)) {
    return NextResponse.json(
      { error: 'Status de progresso inválido.' },
      { status: 400 }
    );
  }

  if (score !== null && (!Number.isFinite(score) || score < 0 || score > 1)) {
    return NextResponse.json(
      { error: 'Pontuação inválida. Use número entre 0 e 1.' },
      { status: 400 }
    );
  }

  const saved = await saveTopicProgress({
    userId,
    topicSlug: slug,
    status: status as 'not_started' | 'in_progress' | 'completed',
    score,
  });

  if (!saved) {
    return NextResponse.json({ error: 'Tópico não encontrado.' }, { status: 404 });
  }

  return NextResponse.json(saved);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const { searchParams } = new URL(request.url);
  const userId = String(searchParams.get('userId') || request.headers.get('x-user-id') || '').trim();

  if (!userId) {
    return NextResponse.json(
      { error: 'Autenticação necessária para consultar progresso.' },
      { status: 401 }
    );
  }

  const progress = await getTopicProgress(userId, slug);
  if (!progress) {
    return NextResponse.json({ topicSlug: slug, userId, status: 'not_started', score: null });
  }

  return NextResponse.json(progress);
}
