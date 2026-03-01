/** @vitest-environment jsdom */

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FlashcardsPanel } from '@/components/modules/flashcards-panel';

const DECKS_PAYLOAD = {
  items: [
    {
      id: 'deck-afd',
      slug: 'fundamentos-afd',
      title: 'Linguagens Formais e Autômatos',
      macroArea: 'fundamentos',
      subTopic: 'afd_modelagem_execucao',
      difficulty: 'medium',
      description: 'Revisão AFD',
      estimatedMinutes: 12,
      cardsCount: 2,
    },
  ],
};

const QUEUE_PAYLOAD = {
  sessionId: 'session-1',
  mode: 'today',
  total: 2,
  items: [
    {
      id: 'card-1',
      deckId: 'deck-afd',
      deckSlug: 'fundamentos-afd',
      front: 'Frente card 1',
      back: 'Verso card 1',
      explanation: 'Explicação card 1',
      subTopic: 'afd_modelagem_execucao',
      dueAt: new Date().toISOString(),
      lapses: 0,
      repetitions: 0,
    },
    {
      id: 'card-2',
      deckId: 'deck-afd',
      deckSlug: 'fundamentos-afd',
      front: 'Frente card 2',
      back: 'Verso card 2',
      explanation: 'Explicação card 2',
      subTopic: 'afd_modelagem_execucao',
      dueAt: new Date().toISOString(),
      lapses: 0,
      repetitions: 0,
    },
  ],
};

function setupFetch() {
  const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes('/api/flashcards/decks')) {
        return {
          ok: true,
          json: async () => DECKS_PAYLOAD,
        } as Response;
      }

      if (url.includes('/api/flashcards/queue')) {
        return {
          ok: true,
          json: async () => QUEUE_PAYLOAD,
        } as Response;
      }

      if (url.includes('/api/flashcards/review') && init?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({
            flashcardId: 'card-1',
            rating: 'good',
            intervalDays: 3,
          }),
        } as Response;
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({ error: 'not found' }),
      } as Response;
    });

  vi.stubGlobal('fetch', fetchSpy);
  return fetchSpy;
}

describe('módulo de flashcards no fluxo do mockup', () => {
  beforeEach(() => {
    setupFetch();
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it('exibe carta ativa com CTA de revelar resposta', async () => {
    render(<FlashcardsPanel userId="user-1" />);

    expect(await screen.findByText('Frente card 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ver resposta/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^bom$/i })).not.toBeInTheDocument();
  });

  it('revela resposta e exibe botões de avaliação', async () => {
    render(<FlashcardsPanel userId="user-1" />);

    await screen.findByText('Frente card 1');
    await userEvent.click(screen.getByRole('button', { name: /ver resposta/i }));

    expect(screen.getByText('Verso card 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^errei$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^difícil$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^bom$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^fácil$/i })).toBeInTheDocument();
  });

  it('envia rating e avança para próxima carta', async () => {
    const fetchSpy = setupFetch();
    render(<FlashcardsPanel userId="user-1" />);

    await screen.findByText('Frente card 1');
    await userEvent.click(screen.getByRole('button', { name: /ver resposta/i }));
    await userEvent.click(screen.getByRole('button', { name: /^bom$/i }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/flashcards/review',
        expect.objectContaining({ method: 'POST' })
      );
    });

    expect(await screen.findByText('Frente card 2')).toBeInTheDocument();
  });
});
