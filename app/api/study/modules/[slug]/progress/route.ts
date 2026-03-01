import { NextResponse } from 'next/server';

import { mapModuleSlugToTopicSlug } from '@/lib/study-data';
import { getTopicProgress, saveTopicProgress } from '@/lib/topics-repo';

const VALID_STATUS = new Set(['not_started', 'in_progress', 'completed']);

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const topicSlug = mapModuleSlugToTopicSlug(slug);

  if (!topicSlug) {
    return NextResponse.json({ error: 'Modulo nao encontrado.' }, { status: 404 });
  }

  const payload = await request.json().catch(() => null);
  const userId = String(payload?.userId || request.headers.get('x-user-id') || '').trim();
  const status = String(payload?.status || '').trim();
  const rawScore = payload?.score;
  const score = rawScore === null || typeof rawScore === 'undefined' ? null : Number(rawScore);

  if (!userId) {
    return NextResponse.json(
      { error: 'Autenticacao necessaria para salvar progresso.' },
      { status: 401 }
    );
  }

  if (!VALID_STATUS.has(status)) {
    return NextResponse.json(
      { error: 'Status de progresso invalido.' },
      { status: 400 }
    );
  }

  if (score !== null && (!Number.isFinite(score) || score < 0 || score > 1)) {
    return NextResponse.json(
      { error: 'Pontuacao invalida. Use numero entre 0 e 1.' },
      { status: 400 }
    );
  }

  const saved = await saveTopicProgress({
    userId,
    topicSlug,
    status: status as 'not_started' | 'in_progress' | 'completed',
    score,
  });

  if (!saved) {
    return NextResponse.json({ error: 'Falha ao salvar progresso.' }, { status: 500 });
  }

  return NextResponse.json({
    moduleSlug: slug,
    userId: saved.userId,
    status: saved.status,
    score: saved.score,
    updatedAt: saved.updatedAt,
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const topicSlug = mapModuleSlugToTopicSlug(slug);

  if (!topicSlug) {
    return NextResponse.json({ error: 'Modulo nao encontrado.' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const userId = String(searchParams.get('userId') || request.headers.get('x-user-id') || '').trim();

  if (!userId) {
    return NextResponse.json(
      { error: 'Autenticacao necessaria para consultar progresso.' },
      { status: 401 }
    );
  }

  const progress = await getTopicProgress(userId, topicSlug);
  if (!progress) {
    return NextResponse.json({
      moduleSlug: slug,
      userId,
      status: 'not_started',
      score: null,
      updatedAt: null,
    });
  }

  return NextResponse.json({
    moduleSlug: slug,
    userId: progress.userId,
    status: progress.status,
    score: progress.score,
    updatedAt: progress.updatedAt,
  });
}
