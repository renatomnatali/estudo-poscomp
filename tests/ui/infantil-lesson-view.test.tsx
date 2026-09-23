/** @vitest-environment jsdom */

import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import type { InfantilLessonSource } from '@/lib/courses/infantil-catalog';
import { InfantilLessonView } from '@/components/infantil/lesson-view';

/** Fragmento mínimo no formato que o pipeline de ingestão produz. */
const FONTE: InfantilLessonSource = {
  header: {
    badge: 'Módulo 1 de 1',
    title: 'Subtração de Frações com Denominadores Diferentes',
    subtitle: 'Quando as fatias não são do mesmo tamanho, não dá para subtrair direto.',
    meta: ['~50 min', '4 simuladores interativos'],
    progressLabel: 'Módulo 1 de 1 — Frações',
  },
  navLinks: [
    { id: 'mmc', label: 'Encontrando o MMC' },
    { id: 'quiz', label: 'Quiz' },
  ],
  html: [
    '<section id="mmc">',
    '<h2>Encontrando o MMC</h2>',
    '<div class="sim-box" data-simulator="mmc">',
    '<h4>Descobrindo o MMC</h4>',
    '<p>Duas fileiras de múltiplos crescem até o primeiro comum.</p>',
    '<div>skeleton estático do simulador</div>',
    '</div>',
    '</section>',
    '<section id="quiz">',
    '<div class="quiz">',
    '<div class="options" id="q1">',
    '<label class="opt"><input type="radio" name="q1" value="A"> A) 2/12</label>',
    '<label class="opt"><input type="radio" name="q1" value="B"> B) 1/12</label>',
    '</div>',
    '<button class="quiz-btn" data-question-id="q1" data-answer-key="B" data-explanation-id="e1">Verificar</button>',
    '<div class="quiz-result" id="q1-res"></div>',
    '<details id="e1"><summary>Por quê?</summary><p>Explicação da questão.</p></details>',
    '</div>',
    '</section>',
  ].join(''),
};

/** Mesma view, mas com marcador de simulador que não existe no registry infantil. */
const FONTE_MARCADOR_DESCONHECIDO: InfantilLessonSource = {
  ...FONTE,
  html: [
    '<section id="mmc">',
    '<div class="sim-box" data-simulator="afd">',
    '<h4>Simulador de outro curso</h4>',
    '<div>skeleton estático do simulador</div>',
    '</div>',
    '</section>',
  ].join(''),
};

function renderView(fonte: InfantilLessonSource = FONTE) {
  return render(
    <InfantilLessonView
      source={fonte}
      themeHref="/infantil/5-ano/matematica/fracoes"
      themeTitle="Frações"
    />,
  );
}

describe('InfantilLessonView — aula do curso infantil', () => {
  beforeAll(() => {
    // jsdom não implementa scrollIntoView; a navegação de seções o chama
    // depois de atualizar o estado ativo (comportamento testado é o estado).
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterAll(() => {
    delete (window.HTMLElement.prototype as { scrollIntoView?: unknown }).scrollIntoView;
  });

  afterEach(() => {
    cleanup();
  });

  it('renderiza o header do fragmento ingerido (título, selo e metadados)', () => {
    renderView();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Subtração de Frações com Denominadores Diferentes' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Módulo 1 de 1')).toBeInTheDocument();
    expect(screen.getByText('~50 min')).toBeInTheDocument();
  });

  it('substitui o marcador data-simulator pelo simulador React, preservando título e abertura', async () => {
    renderView();

    // O simulador de MMC montou (botão de execução veio do componente lazy).
    const executar = await screen.findByRole('button', { name: /executar tudo/i });
    expect(executar).toBeInTheDocument();

    // Título e frase de abertura do HTML original foram preservados.
    expect(screen.getByRole('heading', { level: 4, name: 'Descobrindo o MMC' })).toBeInTheDocument();
    expect(screen.getByText(/duas fileiras de múltiplos/i)).toBeInTheDocument();

    // O skeleton estático saiu: o conteúdo interativo tomou o lugar.
    expect(screen.queryByText(/skeleton estático/i)).not.toBeInTheDocument();
  });

  it('marcador de simulador desconhecido mantém o skeleton estático em vez de quebrar a aula', async () => {
    renderView(FONTE_MARCADOR_DESCONHECIDO);

    // Nada de componente React montado…
    expect(screen.queryByRole('button', { name: /executar tudo/i })).not.toBeInTheDocument();
    // …e o conteúdo estático ingerido segue visível para o aluno.
    expect(screen.getByText(/skeleton estático/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'Simulador de outro curso' })).toBeInTheDocument();
  });

  it('o quiz do HTML ingerido corrige alternativa errada e abre a explicação', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByLabelText(/A\) 2\/12/i));
    await user.click(screen.getByRole('button', { name: /verificar/i }));

    expect(screen.getByText(/incorreta\./i)).toBeInTheDocument();
    expect(screen.getByText(/resposta correta:\s*B/i)).toBeInTheDocument();
    expect(screen.getByText(/por quê\?/i).closest('details')).toHaveAttribute('open');
  });

  it('oferece caminho de volta para a porta do tema', () => {
    renderView();

    const voltar = screen.getByRole('link', { name: /voltar para frações/i });
    expect(voltar).toHaveAttribute('href', '/infantil/5-ano/matematica/fracoes');
  });

  it('a navegação de seções aponta para as âncoras do conteúdo e marca a seção ativa', async () => {
    const user = userEvent.setup();
    renderView();

    const nav = screen.getByRole('navigation', { name: /navegação das seções/i });
    const linkMmc = within(nav).getByRole('link', { name: /encontrando o mmc/i });
    const linkQuiz = within(nav).getByRole('link', { name: /^quiz$/i });

    expect(linkMmc).toHaveAttribute('href', '#mmc');
    expect(linkQuiz).toHaveAttribute('href', '#quiz');

    // Nenhuma seção ativa antes da primeira navegação.
    expect(linkMmc).not.toHaveClass('active');
    await user.click(linkQuiz);
    expect(linkQuiz).toHaveClass('active');
    expect(linkMmc).not.toHaveClass('active');
  });
});
