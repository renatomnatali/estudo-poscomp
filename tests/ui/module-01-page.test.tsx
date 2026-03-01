/** @vitest-environment jsdom */

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ModulePage } from '@/components/study/module-page';

const MODULE_01_PAYLOAD = {
  slug: 'modulo-01',
  order: 1,
  title: 'Entendendo a Funcao de Transicao',
  subtitle: 'Do zero absoluto ate dominar o papel de delta em AFD.',
  trackCode: 'F6',
  progressLabel: 'Modulo 1 de 9',
  chapters: [
    { id: 'fundamentos', title: 'Fundamentos matematicos necessarios', content: '...' },
    { id: 'componentes', title: 'Componentes do AFD', content: '...' },
    { id: 'funcao', title: 'A funcao delta', content: '...' },
    { id: 'exemplo', title: 'Exemplo completo', content: '...' },
    { id: 'executando', title: 'Executando', content: '...' },
    { id: 'dfa-vs-nfa', title: 'DFA vs NFA', content: '...' },
    { id: 'aplicacoes', title: 'Aplicacoes', content: '...' },
    { id: 'resumo', title: 'Resumo', content: '...' },
  ],
  quiz: [
    {
      id: 'm1-q1',
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
  nextSlug: 'modulo-02',
};

const MODULE_01_SOURCE_PAYLOAD = {
  header: {
    badge: 'Módulo 1 de 8',
    title: 'Fundamentos Matemáticos',
    subtitle: 'Conjuntos, relações, funções, alfabetos e linguagens.',
    meta: ['⏱ ~40 min', '📐 Nível: Iniciante'],
    progressLabel: 'Módulo 1 de 8 — Fundamentos',
  },
  navLinks: [
    { id: 'por-que', label: 'Por quê?' },
    { id: 'conjuntos', label: 'Conjuntos' },
    { id: 'resumo', label: 'Resumo' },
  ],
  html: '<section id=\"por-que\"><h2><span class=\"num\">0</span> Por que estudar isso antes de autômatos?</h2></section><section id=\"resumo\"><h2><span class=\"num\">9</span> Resumo do módulo</h2></section>',
};

describe('módulo 1 no padrão do mockup', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/study/modules/modulo-01/source')) {
          return {
            ok: true,
            status: 200,
            json: async () => MODULE_01_SOURCE_PAYLOAD,
          };
        }

        return {
          ok: true,
          status: 200,
          json: async () => MODULE_01_PAYLOAD,
        };
      })
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renderiza hero, navegação de seções e navegação inferior', async () => {
    render(<ModulePage moduleSlug="modulo-01" userId="user-local" />);

    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/módulo 1 de 9/i)).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { level: 2, name: /1\s*Por que estudar isso antes de autômatos\?/i })
    ).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /por quê\?/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^resumo$/i })).toBeInTheDocument();
    expect(screen.queryByText(/módulo 1 de 9 — fundamentos/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/⏱/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/📐/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/🧠/i)).not.toBeInTheDocument();

    expect(screen.getByText(/progresso na trilha/i)).toBeInTheDocument();
    expect(screen.getByText(/1\s*\/\s*9 módulos/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /próximo módulo/i })).toHaveAttribute(
      'href',
      '/trilhas/f6/modulo-02'
    );
    expect(screen.getByRole('button', { name: /módulo anterior/i })).toBeDisabled();
  });
});
