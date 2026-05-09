/** @vitest-environment jsdom */

import { readFileSync } from 'node:fs';
import path from 'node:path';

import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

const MODULE_03_REAL_SOURCE_PAYLOAD = JSON.parse(
  readFileSync(path.join(process.cwd(), 'data/study/modules/modulo-03.source.json'), 'utf8')
);

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
            json: async () => MODULE_03_REAL_SOURCE_PAYLOAD,
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

  it('executa simulador AFN importado e produz resultado', async () => {
    const user = userEvent.setup();
    render(<ModulePage moduleSlug="modulo-03" userId="user-local" />);

    const input = (await screen.findByLabelText(/string:/i)) as HTMLInputElement;
    await user.type(input, 'aab');
    await user.click(screen.getByRole('button', { name: /iniciar/i }));
    await user.click(screen.getByRole('button', { name: /executar/i }));

    const resultEl = document.getElementById('afn-result');
    expect(resultEl?.textContent || '').toMatch(/aceita/i);
  });

  it('avança a construção de subconjuntos no módulo 3 importado', async () => {
    const user = userEvent.setup();
    render(<ModulePage moduleSlug="modulo-03" userId="user-local" />);

    await screen.findByRole('button', { name: /próximo passo/i });
    await user.click(screen.getByRole('button', { name: /próximo passo/i }));

    const partialTable = document.getElementById('subset-table-container');
    expect(partialTable?.textContent || '').toMatch(/\{q0\}/i);

    await user.click(screen.getByRole('button', { name: /construir tudo/i }));
    expect(partialTable?.textContent || '').toMatch(/\{q0, q2\}/i);
  });

  it('corrige questão importada do módulo 3 e mostra explicação oficial', async () => {
    const user = userEvent.setup();
    render(<ModulePage moduleSlug="modulo-03" userId="user-local" />);

    const questionHeading = await screen.findByRole('heading', { name: /questão 3/i });
    const questionCard = questionHeading.closest('.quiz');
    expect(questionCard).not.toBeNull();

    if (!questionCard) {
      return;
    }

    await user.click(within(questionCard).getByLabelText(/aceita, pois pelo menos um caminho/i));
    await user.click(within(questionCard).getByRole('button', { name: /verificar/i }));

    expect(within(questionCard).getByText(/correta\./i)).toBeInTheDocument();
    expect(within(questionCard).getByText(/o caminho via q2 morreu/i)).toBeInTheDocument();
  });
});
