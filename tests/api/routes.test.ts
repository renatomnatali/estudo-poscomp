import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { GET as getTopics } from '@/app/api/content/topics/route';
import { GET as getFlashcardQueue } from '@/app/api/flashcards/queue/route';
import { POST as postFlashcardReview } from '@/app/api/flashcards/review/route';
import { GET as getDashboardSummary } from '@/app/api/study/dashboard/summary/route';
import { GET as getTracksCatalog } from '@/app/api/study/tracks/catalog/route';
import { GET as getModuleBySlug } from '@/app/api/study/modules/[slug]/route';
import { GET as getModuleSource } from '@/app/api/study/modules/[slug]/source/route';
import { POST as postModuleQuiz } from '@/app/api/study/modules/[slug]/quiz/route';
import { GET as getModuleProgress, POST as postModuleProgress } from '@/app/api/study/modules/[slug]/progress/route';

describe('api routes de estudo', () => {
  it('lista tópicos base para o catálogo', async () => {
    const response = await getTopics(new NextRequest('http://localhost/api/content/topics?macroArea=fundamentos'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(payload.items)).toBe(true);
    expect(payload.items.length).toBeGreaterThan(0);
  });

  it('retorna resumo do dashboard de estudo', async () => {
    const response = await getDashboardSummary(new NextRequest('http://localhost/api/study/dashboard/summary'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toHaveProperty('hero');
    expect(payload).toHaveProperty('stats');
    expect(Array.isArray(payload.stats)).toBe(true);
    expect(payload.stats.length).toBeGreaterThan(0);
  });

  it('retorna catálogo das trilhas com estados', async () => {
    const response = await getTracksCatalog(new NextRequest('http://localhost/api/study/tracks/catalog'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(payload.items)).toBe(true);
    expect(payload.items.length).toBeGreaterThan(0);
    expect(payload.items[0]).toHaveProperty('status');
    expect(['done', 'in_progress', 'locked', 'free']).toContain(payload.items[0].status);
  });

  it('retorna módulo por slug com capítulos e quiz', async () => {
    const response = await getModuleBySlug(new Request('http://localhost') as Request, {
      params: Promise.resolve({ slug: 'modulo-03' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.slug).toBe('modulo-03');
    expect(Array.isArray(payload.chapters)).toBe(true);
    expect(payload.chapters.length).toBeGreaterThan(0);
    expect(Array.isArray(payload.quiz)).toBe(true);
    expect(payload.quiz.length).toBeGreaterThan(0);
  });

  it('retorna conteúdo importado do módulo sem depender de Spec em runtime', async () => {
    const response = await getModuleSource(new Request('http://localhost') as Request, {
      params: Promise.resolve({ slug: 'modulo-01' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.header.title).toMatch(/fundamentos matemáticos/i);
    expect(Array.isArray(payload.navLinks)).toBe(true);
    expect(payload.navLinks.length).toBeGreaterThan(0);
    expect(typeof payload.html).toBe('string');
    expect(payload.html.length).toBeGreaterThan(50);
  });

  it('retorna 404 para slug de módulo inválido', async () => {
    const moduleResponse = await getModuleBySlug(new Request('http://localhost') as Request, {
      params: Promise.resolve({ slug: 'modulo-10' }),
    });
    expect(moduleResponse.status).toBe(404);

    const sourceResponse = await getModuleSource(new Request('http://localhost') as Request, {
      params: Promise.resolve({ slug: 'modulo-10' }),
    });
    expect(sourceResponse.status).toBe(404);
  });

  it('corrige quiz embutido do módulo', async () => {
    const moduleResponse = await getModuleBySlug(new Request('http://localhost') as Request, {
      params: Promise.resolve({ slug: 'modulo-02' }),
    });
    const modulePayload = await moduleResponse.json();
    const firstQuiz = modulePayload.quiz[0];

    const response = await postModuleQuiz(
      new Request('http://localhost/api/study/modules/modulo-02/quiz', {
        method: 'POST',
        body: JSON.stringify({
          questionId: firstQuiz.id,
          choice: firstQuiz.answerKey,
        }),
      }),
      { params: Promise.resolve({ slug: 'modulo-02' }) }
    );

    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.correct).toBe(true);
    expect(payload).toHaveProperty('explanation');
  });

  it('salva progresso de módulo autenticado', async () => {
    const response = await postModuleProgress(
      new Request('http://localhost/api/study/modules/modulo-05/progress', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-local',
          status: 'completed',
          score: 0.9,
        }),
      }),
      { params: Promise.resolve({ slug: 'modulo-05' }) }
    );

    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.userId).toBe('user-local');
    expect(payload.moduleSlug).toBe('modulo-05');
    expect(payload.status).toBe('completed');
  });

  it('rejeita salvar progresso de módulo sem autenticação', async () => {
    const response = await postModuleProgress(
      new Request('http://localhost/api/study/modules/modulo-05/progress', {
        method: 'POST',
        body: JSON.stringify({ status: 'in_progress' }),
      }),
      { params: Promise.resolve({ slug: 'modulo-05' }) }
    );

    expect(response.status).toBe(401);
  });

  it('consulta progresso de módulo salvo', async () => {
    await postModuleProgress(
      new Request('http://localhost/api/study/modules/modulo-04/progress', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-local',
          status: 'in_progress',
          score: 0.6,
        }),
      }),
      { params: Promise.resolve({ slug: 'modulo-04' }) }
    );

    const response = await getModuleProgress(
      new Request('http://localhost/api/study/modules/modulo-04/progress?userId=user-local'),
      { params: Promise.resolve({ slug: 'modulo-04' }) }
    );

    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.userId).toBe('user-local');
    expect(payload.moduleSlug).toBe('modulo-04');
  });

  it('registra revisão de flashcard com rating do fluxo novo', async () => {
    const queueResponse = await getFlashcardQueue(
      new NextRequest('http://localhost/api/flashcards/queue?mode=today&limit=1&userId=user-local')
    );
    const queuePayload = await queueResponse.json();
    const firstCard = queuePayload.items[0];

    const reviewResponse = await postFlashcardReview(
      new Request('http://localhost/api/flashcards/review', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-local',
          flashcardId: firstCard.id,
          rating: 'good',
          sessionId: queuePayload.sessionId,
        }),
      })
    );

    const reviewPayload = await reviewResponse.json();
    expect(reviewResponse.status).toBe(200);
    expect(reviewPayload.flashcardId).toBe(firstCard.id);
    expect(reviewPayload.rating).toBe('good');
  });
});
