import { NextResponse } from 'next/server';

import { reviewFlashcard } from '@/lib/flashcards-repo';

const VALID_RATINGS = new Set(['again', 'hard', 'good', 'easy']);

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  const userId = String(payload?.userId || request.headers.get('x-user-id') || '').trim();
  const flashcardId = String(payload?.flashcardId || '').trim();
  const rating = String(payload?.rating || '').trim();
  const sessionId = payload?.sessionId ? String(payload.sessionId).trim() : undefined;

  if (!userId) {
    return NextResponse.json(
      { error: 'Autenticação necessária para salvar revisão.' },
      { status: 401 }
    );
  }

  if (!flashcardId) {
    return NextResponse.json(
      { error: 'Flashcard obrigatório.' },
      { status: 400 }
    );
  }

  if (!VALID_RATINGS.has(rating)) {
    return NextResponse.json(
      { error: 'Avaliação inválida. Use again, hard, good ou easy.' },
      { status: 400 }
    );
  }

  const saved = await reviewFlashcard({
    userId,
    flashcardId,
    rating: rating as 'again' | 'hard' | 'good' | 'easy',
    sessionId,
  });

  if (!saved) {
    return NextResponse.json(
      { error: 'Flashcard não encontrado.' },
      { status: 404 }
    );
  }

  return NextResponse.json(saved);
}
