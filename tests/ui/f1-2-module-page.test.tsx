/** @vitest-environment jsdom */

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ModulePage } from '@/components/study/module-page';

const F12_PAYLOAD = {
  slug: 'f1-2-notacoes-assintoticas',
  order: 2,
  title: 'Notações Assintóticas',
  subtitle: 'Como medir crescimento de algoritmos.',
  trackCode: 'F1',
  progressLabel: 'Módulo 2 de 3',
  chapters: [
    { id: 'motivacao', title: 'Motivação', content: '...' },
    { id: 'quiz', title: 'Quiz', content: '...' },
  ],
  quiz: [
    {
      id: 'f1-2-q1',
      prompt: 'Pergunta',
      options: [
        { key: 'A', text: 'A' },
        { key: 'B', text: 'B' },
      ],
      answerKey: 'B',
      explanation: 'Explicação',
    },
  ],
  previousSlug: 'f1-1-analise-notacoes',
  nextSlug: 'f1-3-analise-recorrencias',
};

const F12_SOURCE = {
  header: {
    badge: 'ANÁLISE DE ALGORITMOS · F1.2',
    title: 'Notações Assintóticas',
    subtitle: 'Conteúdo importado',
    meta: [],
    progressLabel: 'F1.2 — Notações Assintóticas',
  },
  navLinks: [
    { id: 'formal', label: 'Formal' },
    { id: 'quiz', label: 'Quiz' },
  ],
  html: `
    <section id="formal">
      <h2><span class="num">1</span> Definição</h2>
      <div class="formula-annotated">
        <div class="details-toggle" style="margin:1rem 0 0">
          <div class="dt-trigger"><span class="dt-arrow">▸</span> Ver tradução símbolo a símbolo</div>
          <div class="dt-content">
            <table class="dt-table">
              <thead><tr><th>Símbolo</th><th>Lê-se</th><th>Significa</th></tr></thead>
              <tbody>
                <tr><td>∃</td><td>"existe"</td><td>Basta um funcionar.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="anim-box">
        <canvas id="bigOCanvas" style="width:100%;height:240px;display:block;"></canvas>
        <div class="anim-controls">
          <button class="anim-btn active" id="animPlayBtn">▶ Animar</button>
          <button class="anim-btn">↺ Reiniciar</button>
        </div>
      </div>
      <div class="slider-box">
        <div class="slider-row">
          <input type="range" min="1" max="5" value="2" id="nSlider">
          <span class="slider-val" id="nDisplay">n = 100</span>
        </div>
        <div class="counts-grid" id="countsGrid"></div>
      </div>
      <div class="code-ann" id="codeAnn">
        <div class="code-line"><span class="cl-num">1</span><span class="cl-code">def exemplo(arr):</span></div>
        <div class="cl-explain" id="cl0">Explicação da linha 1</div>
      </div>
    </section>
    <section id="quiz">
      <h2><span class="num">2</span> Quiz</h2>
      <div class="quiz-box" id="q1">
        <div class="quiz-q">Qual a complexidade?</div>
        <div class="quiz-option">A) O(n)</div>
        <div class="quiz-option">B) O(n²)</div>
        <div class="quiz-feedback" id="q1-fb"></div>
      </div>
    </section>
  `,
};

describe('módulo F1.2 importado', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      setTransform: () => undefined,
      clearRect: () => undefined,
      beginPath: () => undefined,
      moveTo: () => undefined,
      lineTo: () => undefined,
      stroke: () => undefined,
      fillText: () => undefined,
      setLineDash: () => undefined,
    } as unknown as CanvasRenderingContext2D);

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/study/modules/f1-2-notacoes-assintoticas/source')) {
          return {
            ok: true,
            status: 200,
            json: async () => F12_SOURCE,
          };
        }

        return {
          ok: true,
          status: 200,
          json: async () => F12_PAYLOAD,
        };
      })
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('aplica interação de animação, slider, anotador e quiz', async () => {
    const user = userEvent.setup();
    render(<ModulePage moduleSlug="f1-2-notacoes-assintoticas" userId="user-local" />);

    expect(await screen.findByRole('heading', { level: 1, name: /notações assintóticas/i })).toBeInTheDocument();
    expect(await screen.findByText(/O\(1\)/)).toBeInTheDocument();

    const animButton = screen.getByRole('button', { name: /animar/i });
    await user.click(animButton);
    expect(animButton).toHaveTextContent(/pausar/i);

    const slider = screen.getByRole('slider');
    fireEvent.input(slider, { target: { value: '5' } });
    expect(screen.getByText(/n = 100\.000/i)).toBeInTheDocument();

    await user.click(screen.getByText(/def exemplo\(arr\):/i));
    expect(screen.getByText(/explicação da linha 1/i)).toHaveClass('show');

    const detailsTrigger = screen.getByText(/ver tradução símbolo a símbolo/i);
    const detailsContent = detailsTrigger.parentElement?.querySelector('.dt-content');
    expect(detailsContent).not.toBeNull();
    expect(detailsContent).not.toHaveClass('show');
    await user.click(detailsTrigger);
    expect(detailsContent).toHaveClass('show');

    await user.click(screen.getByText(/A\) O\(n\)/i));
    expect(screen.getByText(/incorreto/i)).toBeInTheDocument();
  });
});
