/** @vitest-environment jsdom */

import { readFileSync } from 'node:fs';
import path from 'node:path';

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    { id: 'kleene-sim', label: 'Simulador Σ*' },
    { id: 'quiz', label: 'Exercícios' },
    { id: 'resumo', label: 'Resumo' },
  ],
  html: '<section id=\"por-que\"><h2><span class=\"num\">0</span> Por que estudar isso antes de autômatos?</h2></section><section id=\"kleene-sim\"><h2><span class=\"num\">8</span> Simulador — Explore o Fecho de Kleene Σ*</h2><div class=\"sim-box\"><div class=\"sim-controls\"><input class=\"sim-input\" id=\"sigmaInput\" value=\"a,b\" placeholder=\"a,b\"><input class=\"sim-input\" id=\"maxLen\" type=\"number\" value=\"3\" min=\"0\" max=\"5\"><button class=\"sim-btn go\">▶ Gerar Σ*</button><button class=\"sim-btn rst\">↺ Limpar</button></div><div id=\"kleeneOutput\"></div><div class=\"kleene-stats\" id=\"kleeneStats\" style=\"display:none\"></div></div></section><section id=\"quiz\"><h2><span class=\"num\">9</span> Exercícios</h2><div class=\"quiz\"><h3>Questão 1</h3><div class=\"quiz-q\"><p>Dado <code>A = {a, b, c}</code>, qual é o valor de <code>|2^A|</code>?</p><div class=\"options\" id=\"q1\"><label class=\"opt\"><input type=\"radio\" name=\"q1\" value=\"6\"> 6</label><label class=\"opt\"><input type=\"radio\" name=\"q1\" value=\"8\"> 8</label></div></div><button class=\"quiz-btn\" data-question-id=\"q1\" data-answer-key=\"8\" data-explanation=\"O conjunto das partes de um conjunto com n elementos tem 2ⁿ elementos.\">Verificar</button><div class=\"quiz-result\" id=\"q1-res\"></div></div></section><section id=\"resumo\"><h2><span class=\"num\">10</span> Resumo do módulo</h2></section>',
};

const MODULE_01_REAL_SOURCE_PAYLOAD = JSON.parse(
  readFileSync(path.join(process.cwd(), 'data/study/modules/modulo-01.source.json'), 'utf8')
);

function clickButtonTextNode(button: HTMLButtonElement) {
  const textNode = Array.from(button.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
  if (!textNode) {
    throw new Error('Botão sem nó de texto para simular clique.');
  }
  textNode.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}

describe('módulo 1 no padrão do mockup', () => {
  let sourcePayload: typeof MODULE_01_SOURCE_PAYLOAD | typeof MODULE_01_REAL_SOURCE_PAYLOAD;

  beforeEach(() => {
    sourcePayload = MODULE_01_SOURCE_PAYLOAD;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/study/modules/modulo-01/source')) {
          return {
            ok: true,
            status: 200,
            json: async () => sourcePayload,
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

  it('corrige questão importada e exibe a explicação oficial do mockup', async () => {
    const user = userEvent.setup();
    render(<ModulePage moduleSlug="modulo-01" userId="user-local" />);

    await screen.findByText(/questão 1/i);

    await user.click(screen.getByLabelText('6'));
    await user.click(screen.getByRole('button', { name: /verificar/i }));

    expect(screen.getByText(/incorreta\./i)).toBeInTheDocument();
    expect(screen.getByText(/resposta correta:\s*8/i)).toBeInTheDocument();
    expect(
      screen.getByText(/o conjunto das partes de um conjunto com n elementos tem 2ⁿ elementos\./i)
    ).toBeInTheDocument();
  });

  it('executa o simulador Σ* do módulo importado e limpa o resultado', async () => {
    sourcePayload = MODULE_01_REAL_SOURCE_PAYLOAD;

    const user = userEvent.setup();
    render(<ModulePage moduleSlug="modulo-01" userId="user-local" />);

    await screen.findByRole('button', { name: /gerar σ\*/i });
    await user.click(screen.getByRole('button', { name: /gerar σ\*/i }));

    expect(screen.getByText(/n = 0/i)).toBeInTheDocument();
    expect(screen.getByText(/n = 3/i)).toBeInTheDocument();
    expect(screen.getByText(/strings geradas \(n=0 até 3\):/i)).toBeInTheDocument();

    const statsEl = document.getElementById('kleeneStats');
    expect(statsEl?.style.display).toBe('block');

    await user.click(screen.getByRole('button', { name: /limpar/i }));
    expect(screen.queryByText(/n = 0/i)).not.toBeInTheDocument();
    expect(statsEl?.style.display).toBe('none');
  });

  it('executa ações do simulador mesmo quando o clique ocorre no texto do botão', async () => {
    sourcePayload = MODULE_01_REAL_SOURCE_PAYLOAD;

    render(<ModulePage moduleSlug="modulo-01" userId="user-local" />);

    const generateButton = (await screen.findByRole('button', { name: /gerar σ\*/i })) as HTMLButtonElement;
    const clearButton = screen.getByRole('button', { name: /limpar/i }) as HTMLButtonElement;

    clickButtonTextNode(generateButton);
    expect(screen.getByText(/n = 0/i)).toBeInTheDocument();

    clickButtonTextNode(clearButton);
    expect(screen.queryByText(/n = 0/i)).not.toBeInTheDocument();
  });
});
