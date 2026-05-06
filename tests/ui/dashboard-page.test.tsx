/** @vitest-environment jsdom */

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DashboardPage } from '@/components/study/dashboard-page';

const DASHBOARD_PAYLOAD = {
  greeting: {
    title: 'Bom dia, Renato',
    subtitle: 'Linguagens Formais concluído · Próximo: Análise de Algoritmos',
    cta: { label: '▶ Continuar estudando', href: '/trilhas/f6/modulo-01' },
  },
  hero: {
    eyebrow: 'Linguagens Formais concluído · 9 módulos ✓',
    title: 'Pronto para o próximo tópico?',
    subtitle: 'F1 — Análise de Algoritmos · Big-O, recorrências, cotas inferiores',
    primaryCta: { label: 'Começar F1 →', href: '/trilhas' },
    secondaryCta: { label: 'Ver currículo', href: '/trilhas' },
  },
  stats: [
    { id: 'done', label: 'Módulos concluídos', value: '9', helper: 'de ~200 no currículo', delta: '↑ +9 este mês', tone: 'default', deltaTone: 'up' },
    { id: 'coverage', label: 'Currículo coberto', value: '4%', helper: '1 de 25 tópicos', delta: '24 tópicos restantes', tone: 'sap', deltaTone: 'warn' },
    { id: 'simulados', label: 'Simulados realizados', value: '0', helper: 'Nenhum ainda', delta: 'Disponível após F1', tone: 'em', deltaTone: 'muted' },
    { id: 'streak', label: 'Sequência de estudo', value: '3', helper: 'dias seguidos', delta: '↑ Recorde pessoal', tone: 'amb', deltaTone: 'up' },
  ],
  tracks: [
    {
      id: 'f6',
      code: 'F6',
      title: 'Ling. Formais e Autômatos',
      subtitle: '9 módulos · ~6h de estudo',
      progressPercent: 100,
      tagLabel: '✓ Completo',
      tagTone: 'done',
      href: '/trilhas/f6/modulo-01',
      iconTone: 'em',
    },
    {
      id: 'f1',
      code: 'F1',
      title: 'Análise de Algoritmos',
      subtitle: 'Big-O, recorrências · 2–3 módulos',
      progressPercent: 0,
      tagLabel: '→ Próximo',
      tagTone: 'next',
      href: '/trilhas',
      iconTone: 'sap',
    },
  ],
  activity: {
    title: 'Atividade — últimas 4 semanas',
    subtitle: 'módulos estudados/dia',
    days: [
      { id: 'd1', label: 'S', levels: [0, 0, 0, 0, 1, 2, 0] },
      { id: 'd2', label: 'T', levels: [0, 1, 0, 2, 3, 2, 0] },
      { id: 'd3', label: 'Q', levels: [1, 0, 2, 3, 4, 3, 1] },
      { id: 'd4', label: 'Q', levels: [0, 2, 1, 3, 4, 2, 0] },
      { id: 'd5', label: 'S', levels: [2, 3, 4, 2, 3, 4, 2] },
      { id: 'd6', label: 'S', levels: [1, 2, 3, 0, 2, 3, 4] },
      { id: 'd7', label: 'D', levels: [0, 1, 0, 2, 0, 1, 3] },
    ],
    legendStart: 'Menos',
    legendEnd: 'Mais',
  },
  coverage: {
    title: 'Cobertura por área',
    rows: [
      { id: 'fundamentos', label: 'Fundamentos (F1–F10)', percentage: 10, caption: '1 de 10 tópicos', tone: 'sap' },
      { id: 'matematica', label: 'Matemática (M1–M7)', percentage: 0, caption: '0 de 7 tópicos', tone: 'amb' },
      { id: 'tecnologia', label: 'Tecnologia (T1–T8)', percentage: 0, caption: '0 de 8 tópicos', tone: 'coral' },
    ],
  },
  flashcards: {
    eyebrow: 'Flashcards',
    title: 'Linguagens Formais prontos para revisão',
    subtitle: 'Spaced repetition ativado · ~15 min/dia',
    count: 47,
    countLabel: 'cartões',
    cta: { label: 'Revisar agora →', href: '/flashcards' },
  },
  upcoming: [
    { id: 'u1', icon: '📚', title: 'Começar F1 — Análise', subtitle: 'Módulo 1 de 3 · ~35 min', actionLabel: 'Iniciar →', href: '/trilhas', tone: 'sap' },
    { id: 'u2', icon: '🃏', title: 'Revisar flashcards F6', subtitle: '47 cartões · ~15 min', actionLabel: 'Revisar →', href: '/flashcards', tone: 'em' },
  ],
};

describe('dashboard no padrão do mockup', () => {
  beforeEach(() => {
    // Fixa hora em 9h para a saudação dinâmica retornar "Bom dia"
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(9);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => DASHBOARD_PAYLOAD,
      }))
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renderiza estrutura principal da tela de dashboard', async () => {
    render(<DashboardPage />);

    expect(await screen.findByText(/bom dia, renato/i)).toBeInTheDocument();
    expect(screen.getByText(/pronto para o próximo tópico\?/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /continuar estudando/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /começar f1/i })).toBeInTheDocument();

    expect(screen.getByText(/módulos concluídos/i)).toBeInTheDocument();
    expect(screen.getByText(/currículo coberto/i)).toBeInTheDocument();
    expect(screen.getByText(/simulados realizados/i)).toBeInTheDocument();
    expect(screen.getByText(/sequência de estudo/i)).toBeInTheDocument();

    expect(screen.getByText(/trilhas de estudo/i)).toBeInTheDocument();
    expect(screen.getByText(/atividade — últimas 4 semanas/i)).toBeInTheDocument();
    expect(screen.getByText(/cobertura por área/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /revisar agora/i })).toBeInTheDocument();
    expect(screen.getByText(/próximas ações/i)).toBeInTheDocument();
  });
});
