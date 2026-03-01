/** @vitest-environment jsdom */

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TrilhasPage } from '@/components/study/trilhas-page';

const TRACKS_PAYLOAD = {
  items: [
    {
      id: 'track-f1',
      code: 'F1',
      title: 'Análise de Algoritmos',
      macroArea: 'fundamentos',
      summary: 'Big-O, Theta, Omega · recorrências · cotas inferiores · algoritmos ótimos',
      estimatedModules: 3,
      estimatedHours: 2,
      status: 'locked',
      free: false,
      progressPercent: 0,
    },
    {
      id: 'track-f6',
      code: 'F6',
      title: 'Linguagens Formais e Autômatos',
      macroArea: 'fundamentos',
      summary: 'AFD, AFN, Gramáticas, PDA, MT · Hierarquia de Chomsky · P vs NP · Gödel',
      estimatedModules: 9,
      estimatedHours: 6,
      status: 'done',
      free: true,
      progressPercent: 100,
      href: '/trilhas/f6/modulo-01',
    },
    {
      id: 'track-f7',
      code: 'F7',
      title: 'Compiladores',
      macroArea: 'fundamentos',
      summary: 'Análise léxica, sintática, semântica · geração de código · otimização',
      estimatedModules: 3,
      estimatedHours: 2.5,
      status: 'locked',
      free: false,
      progressPercent: 0,
    },
    {
      id: 'track-m1',
      code: 'M1',
      title: 'Análise Combinatória',
      macroArea: 'matematica',
      summary: 'Permutações, combinações, arranjos · inclusão-exclusão',
      estimatedModules: 2,
      estimatedHours: 1.5,
      status: 'locked',
      free: false,
      progressPercent: 0,
    },
    {
      id: 'track-t1',
      code: 'T1',
      title: 'Banco de Dados',
      macroArea: 'tecnologia',
      summary: 'Modelo relacional, SQL, normalização · transações',
      estimatedModules: 3,
      estimatedHours: 2.5,
      status: 'locked',
      free: false,
      progressPercent: 0,
    },
  ],
};

describe('trilhas no padrão do mockup', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => TRACKS_PAYLOAD,
      }))
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renderiza estrutura principal com filtros, resumo e seções', async () => {
    render(<TrilhasPage />);

    expect(await screen.findByRole('heading', { name: /trilhas de estudo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^todos$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^free$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^concluídos$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^fundamentos$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^matemática$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^tecnologia$/i })).toBeInTheDocument();

    expect(screen.getByText(/tópico concluído/i)).toBeInTheDocument();
    expect(screen.getByText(/em progresso/i)).toBeInTheDocument();
    expect(screen.getByText(/bloqueados/i)).toBeInTheDocument();
    expect(screen.getByText(/currículo coberto/i)).toBeInTheDocument();

    expect(screen.getByText(/fundamentos da computação/i)).toBeInTheDocument();
    expect(screen.getByText(/matemática para computação/i)).toBeInTheDocument();
    expect(screen.getByText(/tecnologia da computação/i)).toBeInTheDocument();

    expect(screen.getByText(/✓ concluído/i)).toBeInTheDocument();
    expect(screen.getByText(/→ próximo/i)).toBeInTheDocument();
    expect(screen.getAllByText(/premium/i).length).toBeGreaterThan(0);

    expect(screen.getByRole('link', { name: /assinar premium/i })).toBeInTheDocument();
  });

  it('filtra por free e por macroárea', async () => {
    render(<TrilhasPage />);
    await screen.findByText(/linguagens formais e autômatos/i);

    await userEvent.click(screen.getByRole('button', { name: /^free$/i }));
    expect(screen.getByText(/linguagens formais e autômatos/i)).toBeInTheDocument();
    expect(screen.queryByText(/análise combinatória/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/banco de dados/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/matemática para computação/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^matemática$/i }));
    await waitFor(() => {
      expect(screen.getByText(/matemática para computação/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/análise combinatória/i)).toBeInTheDocument();
    expect(screen.queryByText(/fundamentos da computação/i)).not.toBeInTheDocument();
  });
});
