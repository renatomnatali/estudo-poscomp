/** @vitest-environment jsdom */

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ModulePage } from '@/components/study/module-page';

const MODULE_03_PAYLOAD = {
  slug: 'modulo-03',
  order: 3,
  title: 'AFN e epsilon-Transicoes',
  subtitle: 'Nao determinismo e fecho epsilon.',
  trackCode: 'F6',
  progressLabel: 'Modulo 3 de 9',
  chapters: [
    { id: 'definicao-afn', title: 'Definição do AFN', content: '...' },
    { id: 'resumo', title: 'Resumo', content: '...' },
  ],
  quiz: [
    {
      id: 'm3-q1',
      prompt: 'Pergunta',
      options: [
        { key: 'A', text: 'A' },
        { key: 'B', text: 'B' },
      ],
      answerKey: 'A',
      explanation: 'Explicação',
    },
  ],
  previousSlug: 'modulo-02',
  nextSlug: 'modulo-04',
};

const MODULE_03_SOURCE_PAYLOAD = {
  header: {
    badge: 'Módulo 3 de 8',
    title: 'AFN e ε-Transições',
    subtitle: 'Não-determinismo, ε-fecho e construção por subconjuntos.',
    meta: ['⏱ ~55 min', '📐 Nível: Fundamental'],
    progressLabel: 'Módulo 3 de 8 — AFN',
  },
  navLinks: [
    { id: 'definicao-afn', label: 'Definição do AFN' },
    { id: 'resumo', label: 'Resumo' },
  ],
  html: '<section id="definicao-afn"><h2><span class="num">1</span> O que é um AFN?</h2></section><section id="resumo"><h2><span class="num">2</span> Resumo do módulo</h2></section>',
};

describe('módulo 3 importado no padrão do mockup', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/study/modules/modulo-03/source')) {
          return {
            ok: true,
            status: 200,
            json: async () => MODULE_03_SOURCE_PAYLOAD,
          };
        }

        return {
          ok: true,
          status: 200,
          json: async () => MODULE_03_PAYLOAD,
        };
      })
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renderiza conteúdo importado do módulo 3 com navegação entre módulos', async () => {
    render(<ModulePage moduleSlug="modulo-03" userId="user-local" />);

    expect(await screen.findByRole('heading', { level: 1, name: /afn e ε-transições/i })).toBeInTheDocument();
    expect(screen.getByText(/módulo 3 de 9/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /definição do afn/i })).toBeInTheDocument();
    expect(screen.getByText(/3\s*\/\s*9 módulos/i)).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /módulo anterior/i })).toHaveAttribute(
      'href',
      '/trilhas/f6/modulo-02'
    );
    expect(screen.getByRole('link', { name: /próximo módulo/i })).toHaveAttribute(
      'href',
      '/trilhas/f6/modulo-04'
    );
  });
});
