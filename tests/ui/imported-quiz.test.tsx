/** @vitest-environment jsdom */

import { useRef } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { useImportedQuiz } from '@/components/study/imported-quiz';

/** HTML no mesmo formato que o pipeline de ingestão produz para o quiz. */
const QUIZ_HTML = `
<div class="quiz">
  <div class="options" id="q1">
    <label class="opt"><input type="radio" name="q1" value="A"> A) 2/12</label>
    <label class="opt"><input type="radio" name="q1" value="B"> B) 1/12</label>
  </div>
  <button class="quiz-btn" data-question-id="q1" data-answer-key="B" data-explanation-id="e1">Verificar</button>
  <div class="quiz-result" id="q1-res"></div>
  <details id="e1"><summary>Por quê?</summary><p>Explicação da questão.</p></details>
</div>
<div class="quiz">
  <div class="options" id="q2">
    <label class="opt"><input type="radio" name="q2" value="A"> A) sem dados</label>
  </div>
  <button class="quiz-btn">Verificar</button>
  <div class="quiz-result" id="q2-res"></div>
</div>
`;

function QuizHarness({ html }: { html: string }) {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  useImportedQuiz(bodyRef, html, { openExplanation: true });
  return <div ref={bodyRef} dangerouslySetInnerHTML={{ __html: html }} />;
}

function optionLabel(match: RegExp): HTMLElement {
  return screen.getByLabelText(match).closest('label') as HTMLElement;
}

/** Botão "Verificar" do quiz indicado (o fixture tem um segundo sem dados). */
function botaoVerificar(questionId: string): HTMLElement {
  const quiz = document.getElementById(questionId)?.closest<HTMLElement>('.quiz');
  if (!quiz) throw new Error(`quiz não encontrado: ${questionId}`);
  return within(quiz).getByRole('button', { name: /verificar/i });
}

describe('useImportedQuiz (quiz do conteúdo ingerido)', () => {
  afterEach(() => {
    cleanup();
  });

  it('marca a alternativa errada E a correta, mostra a resposta e abre a explicação', async () => {
    const user = userEvent.setup();
    render(<QuizHarness html={QUIZ_HTML} />);

    await user.click(screen.getByLabelText(/A\) 2\/12/i));
    await user.click(botaoVerificar('q1'));

    // A errada fica marcada como selecionada-e-errada; a correta é revelada.
    expect(optionLabel(/A\) 2\/12/i)).toHaveClass('is-selected', 'is-wrong');
    expect(optionLabel(/B\) 1\/12/i)).toHaveClass('is-correct');

    // Mensagem de correção — contrato do feedback ("Resposta correta: B").
    expect(screen.getByText(/incorreta\./i)).toBeInTheDocument();
    expect(screen.getByText(/resposta correta:\s*B/i)).toBeInTheDocument();

    // A explicação abre sozinha para quem errou.
    expect(screen.getByText(/por quê\?/i).closest('details')).toHaveAttribute('open');
  });

  it('ao acertar, marca só a correta e limpa a marcação de erro de uma tentativa anterior', async () => {
    const user = userEvent.setup();
    render(<QuizHarness html={QUIZ_HTML} />);

    // 1ª tentativa: erra.
    await user.click(screen.getByLabelText(/A\) 2\/12/i));
    await user.click(botaoVerificar('q1'));
    expect(optionLabel(/A\) 2\/12/i)).toHaveClass('is-wrong');

    // 2ª tentativa: acerta — o estado da tentativa anterior é limpo.
    await user.click(screen.getByLabelText(/B\) 1\/12/i));
    await user.click(botaoVerificar('q1'));

    expect(optionLabel(/A\) 2\/12/i)).not.toHaveClass('is-wrong');
    expect(optionLabel(/B\) 1\/12/i)).toHaveClass('is-correct');
    expect(screen.getByText(/correta\./i)).toBeInTheDocument();
    expect(screen.getByText(/alternativa B/i)).toBeInTheDocument();
  });

  it('pede para selecionar uma alternativa antes de verificar, sem marcar nenhuma opção', async () => {
    const user = userEvent.setup();
    render(<QuizHarness html={QUIZ_HTML} />);

    await user.click(botaoVerificar('q1'));

    // Mensagem de validação — semântica obrigatória (literal é o contrato).
    expect(screen.getByText('Selecione uma alternativa antes de verificar.')).toBeInTheDocument();
    expect(optionLabel(/A\) 2\/12/i).className).not.toMatch(/is-(correct|wrong|selected)/);
  });

  it('botão de verificar sem data-question-id/data-answer-key não faz nada', () => {
    render(<QuizHarness html={QUIZ_HTML} />);

    const segundoResultado = document.getElementById('q2-res') as HTMLElement;
    fireEvent.click(screen.getAllByRole('button', { name: /verificar/i })[1]);

    expect(segundoResultado.textContent).toBe('');
    expect(segundoResultado.classList.contains('show')).toBe(false);
    expect(optionLabel(/A\) sem dados/i).className).not.toMatch(/is-(correct|wrong|selected)/);
  });
});
