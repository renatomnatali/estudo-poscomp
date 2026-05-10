/** @vitest-environment jsdom */

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DashboardPage } from '@/components/study/dashboard-page';

const DASHBOARD_PAYLOAD = {
  greeting: {
    title: 'Bom dia, Marina',
    subtitle: 'Linguagens Formais em progresso',
    cta: { label: '▶ Continuar estudando', href: '/trilhas/f6/modulo-02' },
  },
  hero: {
    eyebrow: 'Linguagens Formais em progresso',
    title: 'Continue de onde parou',
    subtitle: 'Próximo módulo: 2 — Autômato Finito Determinístico',
    primaryCta: { label: 'Continuar F6 →', href: '/trilhas/f6/modulo-02' },
    secondaryCta: { label: 'Ver currículo', href: '/trilhas' },
  },
  stats: [
    { id: 'modules', label: 'Módulos concluídos', value: '1', helper: 'de 9 na trilha F6', delta: '↑ 1 concluído(s)', tone: 'default', deltaTone: 'up' },
    { id: 'coverage', label: 'Currículo coberto', value: '0%', helper: '0 de 25 tópicos', delta: '25 tópicos restantes', tone: 'sap', deltaTone: 'warn' },
    { id: 'mock', label: 'Simulados realizados', value: '0', helper: 'Nenhum ainda', delta: 'Comece pelo simulado parcial', tone: 'em', deltaTone: 'muted' },
    { id: 'streak', label: 'Sequência de estudo', value: '1', helper: 'dias seguidos', delta: 'Mantenha o ritmo diário', tone: 'amb', deltaTone: 'up' },
  ],
  tracks: [],
  activity: {
    title: 'Atividade — últimas 4 semanas',
    subtitle: 'ações de estudo por dia',
    days: [
      { id: 'd1', label: 'S', levels: [0, 0, 0, 0] },
      { id: 'd2', label: 'T', levels: [0, 0, 0, 0] },
      { id: 'd3', label: 'Q', levels: [0, 0, 0, 0] },
      { id: 'd4', label: 'Q', levels: [0, 0, 0, 0] },
      { id: 'd5', label: 'S', levels: [0, 0, 0, 0] },
      { id: 'd6', label: 'S', levels: [0, 0, 0, 0] },
      { id: 'd7', label: 'D', levels: [0, 0, 0, 0] },
    ],
    legendStart: 'Menos',
    legendEnd: 'Mais',
  },
  coverage: {
    title: 'Cobertura por área',
    rows: [{ id: 'fund', label: 'Fundamentos (F1–F10)', percentage: 10, caption: '1 de 10 tópicos', tone: 'sap' }],
  },
  flashcards: {
    eyebrow: 'Flashcards',
    title: '2 revisão(ões) pendente(s) hoje',
    subtitle: 'Spaced repetition ativado · priorize os cartões vencidos',
    cta: { label: 'Revisar agora →', href: '/flashcards' },
    count: 2,
    countLabel: 'pendentes',
  },
  upcoming: [],
};

describe('dashboard com fallback de erro e retry', () => {
  beforeEach(() => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network-error'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => DASHBOARD_PAYLOAD,
      });

    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('exibe erro acionável e recarrega dados ao clicar em tentar novamente', async () => {
    const user = userEvent.setup();
    render(<DashboardPage userId="user-local" />);

    expect(
      await screen.findByText(/não foi possível carregar o dashboard\./i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /tentar novamente/i }));

    expect(await screen.findByText(/continue de onde parou/i)).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
