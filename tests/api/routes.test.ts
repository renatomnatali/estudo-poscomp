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
import { GET as getSimuladoAttempts, POST as postSimuladoAttempt } from '@/app/api/simulado/attempts/route';

describe('api routes de estudo', () => {
  it('lista tópicos base para o catálogo', async () => {
    const response = await getTopics(new NextRequest('http://localhost/api/content/topics?macroArea=fundamentos'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(payload.items)).toBe(true);
    expect(payload.items.length).toBeGreaterThan(0);
  });

  it('retorna resumo do dashboard de estudo', async () => {
    // Usa um módulo da trilha de onboarding *efetiva* (atualmente F6
    // via fallback, porque F1 ainda não tem topics ingeridos no banco).
    await postModuleProgress(
      new Request('http://localhost/api/study/modules/modulo-01/progress', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-summary-1',
          status: 'completed',
          score: 1,
        }),
      }),
      { params: Promise.resolve({ slug: 'modulo-01' }) }
    );

    const response = await getDashboardSummary(
      new NextRequest('http://localhost/api/study/dashboard/summary?userId=user-summary-1')
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toHaveProperty('hero');
    expect(payload).toHaveProperty('stats');
    expect(Array.isArray(payload.stats)).toBe(true);
    expect(payload.stats.length).toBeGreaterThan(0);

    const modulesCard = payload.stats.find((item: { label: string }) => item.label === 'Módulos concluídos');
    expect(modulesCard?.value).toBe('1');
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

  it('libera trilhas com conteúdo source já importado', async () => {
    const response = await getTracksCatalog(new NextRequest('http://localhost/api/study/tracks/catalog'));
    const payload = await response.json();

    const byCode = new Map<
      string,
      {
        status: string;
        free: boolean;
        href?: string;
        estimatedModules: number;
        estimatedHours: number;
      }
    >(
      payload.items.map(
        (item: {
          code: string;
          status: string;
          free: boolean;
          href?: string;
          estimatedModules: number;
          estimatedHours: number;
        }) => [
        item.code,
        {
          status: item.status,
          free: item.free,
          href: item.href,
          estimatedModules: item.estimatedModules,
          estimatedHours: item.estimatedHours,
        },
      ])
    );

    for (const code of ['F1', 'F2', 'F3', 'F4']) {
      const item = byCode.get(code);
      expect(item).toBeDefined();
      expect(item?.status).toBe('free');
      expect(item?.free).toBe(true);
    }

    expect(byCode.get('F1')?.href).toBe('/trilhas/f1/f1-1-analise-notacoes');
    expect(byCode.get('F1')?.estimatedModules).toBe(3);
    expect(byCode.get('F1')?.estimatedHours).toBe(3);

    expect(byCode.get('F2')?.href).toBe('/trilhas/f2/f2-1-estruturas-lineares');
    expect(byCode.get('F2')?.estimatedModules).toBe(3);
    expect(byCode.get('F2')?.estimatedHours).toBe(3);

    expect(byCode.get('F3')?.href).toBe('/trilhas/f3/f3-1-paradigmas');
    expect(byCode.get('F3')?.estimatedModules).toBe(1);
    expect(byCode.get('F3')?.estimatedHours).toBe(1);

    expect(byCode.get('F4')?.href).toBe('/trilhas/f4/f4-1-linguagens-formais');
    expect(byCode.get('F4')?.estimatedModules).toBe(1);
    expect(byCode.get('F4')?.estimatedHours).toBe(1);
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

  it('mantém encadeamento F1.1 -> F1.2 -> F1.3 para navegação entre módulos', async () => {
    const f11Response = await getModuleBySlug(new Request('http://localhost') as Request, {
      params: Promise.resolve({ slug: 'f1-1-analise-notacoes' }),
    });
    const f11Payload = await f11Response.json();

    expect(f11Response.status).toBe(200);
    expect(f11Payload.trackCode).toBe('F1');
    expect(f11Payload.nextSlug).toBe('f1-2-notacoes-assintoticas');

    const f12Response = await getModuleBySlug(new Request('http://localhost') as Request, {
      params: Promise.resolve({ slug: 'f1-2-notacoes-assintoticas' }),
    });
    const f12Payload = await f12Response.json();

    expect(f12Response.status).toBe(200);
    expect(f12Payload.trackCode).toBe('F1');
    expect(f12Payload.previousSlug).toBe('f1-1-analise-notacoes');
    expect(f12Payload.nextSlug).toBe('f1-3-analise-recorrencias');

    const f13Response = await getModuleBySlug(new Request('http://localhost') as Request, {
      params: Promise.resolve({ slug: 'f1-3-analise-recorrencias' }),
    });
    const f13Payload = await f13Response.json();

    expect(f13Response.status).toBe(200);
    expect(f13Payload.trackCode).toBe('F1');
    expect(f13Payload.previousSlug).toBe('f1-2-notacoes-assintoticas');
    expect(f13Payload.nextSlug).toBeNull();
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

  it('registra tentativa de simulado e retorna histórico ordenado por data', async () => {
    const postResponse = await postSimuladoAttempt(
      new Request('http://localhost/api/simulado/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'user-simulado-1' },
        body: JSON.stringify({
          mode: 'partial',
          total: 20,
          correct: 15,
          accuracy: 0.75,
          durationSeconds: 1800,
          recommendedNextTopics: ['automatos-finitos-afd'],
        }),
      })
    );

    const postPayload = await postResponse.json();
    expect(postResponse.status).toBe(201);
    expect(postPayload.userId).toBe('user-simulado-1');
    expect(postPayload.mode).toBe('partial');

    const getResponse = await getSimuladoAttempts(
      new NextRequest('http://localhost/api/simulado/attempts?userId=user-simulado-1&limit=5')
    );
    const getPayload = await getResponse.json();

    expect(getResponse.status).toBe(200);
    expect(Array.isArray(getPayload.items)).toBe(true);
    expect(getPayload.items.length).toBeGreaterThan(0);
    expect(getPayload.items[0].createdAt >= getPayload.items[getPayload.items.length - 1].createdAt).toBe(true);
  });
});
