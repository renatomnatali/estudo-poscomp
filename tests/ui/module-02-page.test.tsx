/** @vitest-environment jsdom */

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ModulePage } from '@/components/study/module-page';

const MODULE_02_PAYLOAD = {
  slug: 'modulo-02',
  order: 2,
  title: 'Automato Finito Deterministico',
  subtitle: 'Modelagem completa, tabela de transicao e estado morto.',
  trackCode: 'F6',
  progressLabel: 'Modulo 2 de 9',
  chapters: [
    { id: 'definicao', title: 'Definição', content: '...' },
    { id: 'cinco-tupla', title: '5-Tupla', content: '...' },
    { id: 'resumo', title: 'Resumo', content: '...' },
  ],
  quiz: [
    {
      id: 'm2-q1',
      prompt: 'Pergunta',
      options: [
        { key: 'A', text: 'A' },
        { key: 'B', text: 'B' },
      ],
      answerKey: 'B',
      explanation: 'Explicação',
    },
  ],
  previousSlug: 'modulo-01',
  nextSlug: 'modulo-03',
};

const MODULE_02_SOURCE_PAYLOAD = {
  header: {
    badge: 'Módulo 2 de 8',
    title: 'Autômato Finito Determinístico',
    subtitle: 'Da definição formal à execução visual — construa, leia e simule um AFD do zero.',
    meta: ['⏱ ~55 min', '📐 Nível: Fundamental', '⚙️ Simulador interativo'],
    progressLabel: 'Módulo 2 de 8 — AFD',
  },
  navLinks: [
    { id: 'definicao', label: 'Definição' },
    { id: 'cinco-tupla', label: '5-Tupla' },
    { id: 'quiz', label: 'Exercícios' },
    { id: 'resumo', label: 'Resumo' },
  ],
  html: '<section id=\"definicao\"><h2><span class=\"num\">1</span> O que é um AFD?</h2></section><section id=\"simulador\"><h2><span class=\"num\">2</span> Simulador interativo de AFD</h2><div id=\"simulator\"><div class=\"sim-body\"><div class=\"preset-row\"><button class=\"preset-btn active\" data-preset-id=\"par1s\">Nº par de 1s</button><button class=\"preset-btn\" data-preset-id=\"termina01\">Termina em 01</button></div><div id=\"preset-desc\" class=\"callout\"><strong>Nº par de 1s:</strong> descrição.</div><canvas id=\"afd-canvas\"></canvas><div class=\"sim-table-wrap\"><table id=\"sim-table\"><tbody id=\"sim-table-body\"></tbody></table></div><div class=\"sim-input-row\"><label for=\"sim-string\">String de entrada:</label><input type=\"text\" id=\"sim-string\" value=\"\" /><div class=\"sim-controls\"><button class=\"sim-btn btn-primary\">▶ Iniciar</button><button class=\"sim-btn btn-secondary\">⏭ Passo</button><button class=\"sim-btn btn-green\">⚡ Executar tudo</button><button class=\"sim-btn btn-secondary\">↺ Resetar</button></div></div><div class=\"sim-status\"><div id=\"sim-state-circle\" class=\"sim-state-display\">—</div><div><div id=\"sim-tape\" class=\"sim-tape\"></div></div></div><div id=\"sim-log\"></div><div id=\"sim-result\"></div></div></div></section><section id=\"quiz\"><div class=\"quiz\"><h3>Questão 1</h3><div class=\"options\" id=\"q1\"><label class=\"opt\"><input type=\"radio\" name=\"q1\" value=\"A\"> A) Opção incorreta</label><label class=\"opt\"><input type=\"radio\" name=\"q1\" value=\"B\"> B) Opção correta</label></div><button class=\"quiz-btn\" data-question-id=\"q1\" data-answer-key=\"B\">Verificar</button><div class=\"quiz-result\" id=\"q1-res\"></div></div></section><section id=\"resumo\"><h2><span class=\"num\">3</span> Resumo do módulo</h2></section>',
};

describe('módulo 2 importado no padrão do mockup', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/study/modules/modulo-02/source')) {
          return {
            ok: true,
            status: 200,
            json: async () => MODULE_02_SOURCE_PAYLOAD,
          };
        }

        return {
          ok: true,
          status: 200,
          json: async () => MODULE_02_PAYLOAD,
        };
      })
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renderiza hero importado, navegação de seções e rodapé com fluxo entre módulos', async () => {
    render(<ModulePage moduleSlug="modulo-02" userId="user-local" />);

    expect(await screen.findByRole('heading', { level: 1, name: /autômato finito determinístico/i })).toBeInTheDocument();
    expect(await screen.findByText(/questão 1/i)).toBeInTheDocument();
    expect(screen.getByText(/módulo 2 de 9/i)).toBeInTheDocument();

    expect(await screen.findByRole('link', { name: /definição/i })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /5-tupla/i })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /exercícios/i })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /^resumo$/i })).toBeInTheDocument();

    expect(screen.getByText(/progresso na trilha/i)).toBeInTheDocument();
    expect(screen.getByText(/2\s*\/\s*9 módulos/i)).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /módulo anterior/i })).toHaveAttribute(
      'href',
      '/trilhas/f6/modulo-01'
    );
    expect(screen.getByRole('link', { name: /próximo módulo/i })).toHaveAttribute(
      'href',
      '/trilhas/f6/modulo-03'
    );
  });

  it('corrige a questão quando clico em verificar no módulo importado', async () => {
    const user = userEvent.setup();
    render(<ModulePage moduleSlug="modulo-02" userId="user-local" />);

    await screen.findByText(/questão 1/i);

    await user.click(await screen.findByLabelText(/A\) opção incorreta/i));
    await user.click(screen.getByRole('button', { name: /verificar/i }));

    expect(screen.getByText(/incorreta\./i)).toBeInTheDocument();
    expect(screen.getByText(/resposta correta:\s*B/i)).toBeInTheDocument();

    await user.click(await screen.findByLabelText(/B\) opção correta/i));
    await user.click(screen.getByRole('button', { name: /verificar/i }));

    expect(screen.getByText(/correta\./i)).toBeInTheDocument();
    expect(screen.getByText(/alternativa B/i)).toBeInTheDocument();
  });

  it('atualiza o destaque ativo do menu de seções ao navegar entre tópicos', async () => {
    const user = userEvent.setup();
    render(<ModulePage moduleSlug="modulo-02" userId="user-local" />);

    await screen.findByText(/questão 1/i);

    const definicaoLink = await screen.findByRole('link', { name: /definição/i });
    const resumoLink = await screen.findByRole('link', { name: /^resumo$/i });

    expect(definicaoLink).toHaveClass('active');
    expect(resumoLink).not.toHaveClass('active');

    await user.click(resumoLink);

    expect(resumoLink).toHaveClass('active');
    expect(definicaoLink).not.toHaveClass('active');
  });

  it('executa o simulador do mockup no módulo 2', async () => {
    const user = userEvent.setup();
    render(<ModulePage moduleSlug="modulo-02" userId="user-local" />);

    await screen.findByRole('heading', { level: 1, name: /autômato finito determinístico/i });

    const input = screen.getByLabelText(/string de entrada/i);
    await user.clear(input);
    await user.type(input, '11');

    await user.click(screen.getByRole('button', { name: /iniciar/i }));
    await user.click(screen.getByRole('button', { name: /executar tudo/i }));

    expect(screen.getByText(/^ACEITA$/i)).toBeInTheDocument();
    expect(screen.getByText(/palavra aceita/i)).toBeInTheDocument();
  });
});
