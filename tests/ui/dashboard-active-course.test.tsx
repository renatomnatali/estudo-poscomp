/** @vitest-environment jsdom */

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Cookie store fake: fronteira do framework (cookies() lança fora de
// request scope). Ele APENAS dirige o curso ativo — getActiveCourseContext,
// a rota e os dois dashboards rodam reais.
const cookieStore = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => cookieStore),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => '/dashboard',
}));

import DashboardRoutePage from '@/app/dashboard/page';
import type { DashboardSummary } from '@/lib/types';

/** Payload mínimo válido do contrato DashboardSummary (fronteira /api). */
const POSCOMP_SUMMARY: DashboardSummary = {
  greeting: { title: 'Bom dia, Estudante' },
  hero: {
    eyebrow: 'F6 concluído',
    title: 'Pronto para o próximo tópico?',
    subtitle: 'F1 — Análise de Algoritmos',
    primaryCta: { label: 'Retomar estudos', href: '/trilhas/f1/modulo-01' },
    secondaryCta: { label: 'Ver trilhas', href: '/trilhas' },
  },
  stats: [],
  tracks: [],
  activity: {
    title: 'Atividade — últimas 4 semanas',
    subtitle: 'módulos estudados/dia',
    days: [],
    legendStart: 'Menos',
    legendEnd: 'Mais',
  },
  coverage: { title: 'Cobertura por área', rows: [] },
  flashcards: {
    eyebrow: 'Flashcards',
    title: 'Revisão espaçada',
    subtitle: '~15 min/dia',
    count: 0,
    countLabel: 'cartões',
    cta: { label: 'Revisar', href: '/flashcards' },
  },
  upcoming: [],
};

describe('dashboard ramifica pelo curso ativo do cookie', () => {
  beforeEach(() => {
    cookieStore.get.mockReset();
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it('com o curso Infantil ativo, renderiza o dashboard do Infantil com a aula disponível do catálogo', async () => {
    // Arrange — usuário que escolheu Infantil no seletor.
    cookieStore.get.mockReturnValue({ value: 'infantil' });
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    // Act
    render(await DashboardRoutePage());

    // Assert — o CTA aponta para a aula disponível do primeiro tema do
    // catálogo infantil (href é o contrato, não o texto do botão).
    const startLesson = await screen.findByRole('link', { name: /começar:/i });
    expect(startLesson).toHaveAttribute(
      'href',
      '/infantil/5-ano/matematica/fracoes/subtraindo-fracoes-com-denominadores-diferentes'
    );
    // O dashboard do Infantil é 100% catálogo: o resumo de estudos POSCOMP
    // nem é buscado.
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sem cookie, renderiza o dashboard do POSCOMP alimentado pelo resumo de estudos', async () => {
    // Arrange — fluxo histórico: nenhuma escolha de curso na sessão.
    cookieStore.get.mockReturnValue(undefined);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => POSCOMP_SUMMARY,
      }))
    );

    // Act
    render(await DashboardRoutePage());

    // Assert — o hero traz o CTA do payload da API (dado renderizado), e o
    // conteúdo do Infantil não aparece.
    const heroCta = await screen.findByRole('link', { name: /retomar estudos/i });
    expect(heroCta).toHaveAttribute('href', '/trilhas/f1/modulo-01');
    expect(screen.queryByRole('link', { name: /começar:/i })).not.toBeInTheDocument();
  });
});
