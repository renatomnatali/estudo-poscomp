/** @vitest-environment jsdom */

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SimuladoPage } from '@/components/study/simulado-page';

const SESSION_PAYLOAD = {
  mode: 'partial',
  config: { questionCount: 20, minutes: 45, premium: false },
  items: [
    {
      id: 'q-1',
      year: 2025,
      source: 'POSCOMP',
      number: 1,
      macroArea: 'fundamentos',
      subTopic: 'automatos-finitos-afd',
      difficulty: 'medium',
      stem: 'Qual alternativa representa uma linguagem regular?',
      options: [
        { key: 'A', text: 'a^n b^n' },
        { key: 'B', text: '(ab)*' },
      ],
      answerKey: 'B',
      tags: [],
    },
  ],
};

describe('simulado com persistência de histórico no backend', () => {
  beforeEach(() => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes('/api/simulado/attempts') && (!init || init.method === 'GET')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ userId: 'user-local', items: [] }),
        };
      }

      if (url.includes('/api/simulado/session') && init?.method === 'POST') {
        return {
          ok: true,
          status: 200,
          json: async () => SESSION_PAYLOAD,
        };
      }

      if (url.includes('/api/assessment/submit')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            score: { total: 1, correct: 1, accuracy: 1 },
            recommendedNextTopics: ['automatos-finitos-afd'],
          }),
        };
      }

      if (url.includes('/api/simulado/attempts') && init?.method === 'POST') {
        return {
          ok: true,
          status: 201,
          json: async () => ({
            id: 'attempt-1',
            userId: 'user-local',
            mode: 'partial',
            total: 1,
            correct: 1,
            accuracy: 1,
            durationSeconds: 60,
            recommendedNextTopics: ['automatos-finitos-afd'],
            createdAt: '2026-03-02T12:00:00.000Z',
          }),
        };
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({
          userId: 'user-local',
          items: [
            {
              id: 'attempt-1',
              userId: 'user-local',
              mode: 'partial',
              total: 1,
              correct: 1,
              accuracy: 1,
              durationSeconds: 60,
              recommendedNextTopics: ['automatos-finitos-afd'],
              createdAt: '2026-03-02T12:00:00.000Z',
            },
          ],
        }),
      };
    });

    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('salva tentativa após correção e recarrega histórico via API', async () => {
    const user = userEvent.setup();
    render(<SimuladoPage userId="user-local" />);

    await screen.findByRole('heading', { name: /simule.*poscomp/i });
    await user.click(screen.getByRole('button', { name: /iniciar simulado/i }));
    await screen.findByText(/questão 1 de 1/i);

    await user.click(screen.getByRole('button', { name: /encerrar e corrigir/i }));

    expect(await screen.findByText(/desempenho da sessão/i)).toBeInTheDocument();
    expect(await screen.findByText(/1\/1 · 100%/i)).toBeInTheDocument();

    const fetchCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    const postAttempt = fetchCalls.find(
      ([url, init]) => String(url).includes('/api/simulado/attempts') && (init as RequestInit | undefined)?.method === 'POST'
    );

    expect(postAttempt).toBeTruthy();
  });

  it('permite iniciar modo premium quando usuário premium', async () => {
    const user = userEvent.setup();
    render(<SimuladoPage userId="user-local" isPremiumUser />);

    await screen.findByRole('heading', { name: /simule.*poscomp/i });
    await user.click(screen.getByRole('button', { name: /simulado completo/i }));

    const startButton = screen.getByRole('button', { name: /iniciar simulado/i });
    expect(startButton).not.toBeDisabled();

    await user.click(startButton);
    expect(await screen.findByText(/questão 1 de 1/i)).toBeInTheDocument();
  });
});
