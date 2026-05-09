/** @vitest-environment jsdom */

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ModulePage } from '@/components/study/module-page';

const F11_PAYLOAD = {
  slug: 'f1-1-analise-notacoes',
  order: 1,
  title: 'Algoritmos de Referência',
  subtitle: 'Antes de medir, precisamos observar o comportamento dos algoritmos.',
  trackCode: 'F1',
  progressLabel: 'Módulo 1 de 3',
  chapters: [
    { id: 'intro', title: 'Panorama', content: '...' },
    { id: 'comparacao', title: 'Comparação', content: '...' },
  ],
  quiz: [
    {
      id: 'f1-1-q1',
      prompt: 'Pergunta',
      options: [
        { key: 'A', text: 'A' },
        { key: 'B', text: 'B' },
      ],
      answerKey: 'B',
      explanation: 'Explicação',
    },
  ],
  previousSlug: null,
  nextSlug: 'f1-2-notacoes-assintoticas',
};

const F11_SOURCE = {
  header: {
    badge: 'ANÁLISE DE ALGORITMOS · F1.1',
    title: 'Algoritmos de Referência',
    subtitle: 'Conteúdo de base para notações assintóticas.',
    meta: [],
    progressLabel: 'F1.1 — Algoritmos de Referência',
  },
  navLinks: [{ id: 'porque', label: '1. Por que ver antes?' }],
  html: '<section id="porque"><h2><span class="num">1</span> Por que ver antes?</h2></section>',
};

describe('navegação entre módulos F1', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/study/modules/f1-1-analise-notacoes/source')) {
          return {
            ok: true,
            status: 200,
            json: async () => F11_SOURCE,
          };
        }

        return {
          ok: true,
          status: 200,
          json: async () => F11_PAYLOAD,
        };
      })
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renderiza link Próximo módulo apontando para F1.2', async () => {
    render(<ModulePage moduleSlug="f1-1-analise-notacoes" userId="user-local" />);

    const nextLink = await screen.findByRole('link', { name: /próximo módulo/i });
    expect(nextLink).toHaveAttribute('href', '/trilhas/f1/f1-2-notacoes-assintoticas');
  });
});
