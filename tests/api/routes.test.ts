import { describe, expect, it, vi } from 'vitest';
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
    // Usa o primeiro módulo da trilha de onboarding atual (F1 — Análise
    // de Algoritmos). Se a trilha de onboarding mudar, atualize este slug.
    await postModuleProgress(
      new Request('http://localhost/api/study/modules/f1-1-analise-notacoes/progress', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-summary-1',
          status: 'completed',
          score: 1,
        }),
      }),
      { params: Promise.resolve({ slug: 'f1-1-analise-notacoes' }) }
    );

    // A leitura de userId do cliente (query/header) é fallback exclusivo de
    // development — guard anti-spoofing que força 401 fora dele quando o
    // Clerk não está configurado. O teste exerce esse caminho de dev.
    vi.stubEnv('NODE_ENV', 'development');
    try {
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
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('rejeita userId vindo do cliente fora de development (guard anti-spoofing)', async () => {
    // Sem stub de NODE_ENV (vitest roda com 'test') e sem Clerk configurado:
    // identidade lida de query/header é recusada com 401 — aceitá-la fora
    // de dev seria vetor de spoofing. É o inverso do caso acima, que cobre
    // o caminho de dev com o stub.
    const response = await getDashboardSummary(
      new NextRequest('http://localhost/api/study/dashboard/summary?userId=user-summary-1')
    );

    expect(response.status).toBe(401);
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

    // A trilha de entrada (onboarding) precisa de link clicável para o
    // primeiro módulo. Estimativas (estimatedModules/estimatedHours) e os
    // hrefs de F2–F4 removidos no conserto desta suíte são igualmente dado
    // estático de produto em TRACK_CARDS (o href só existe para trilhas
    // com contentReady, hoje F1 e F6) — não contrato desta rota — e por
    // isso não ficam pinados aqui.
    expect(byCode.get('F1')?.href).toBe('/trilhas/f1/f1-1-analise-notacoes');
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
});
