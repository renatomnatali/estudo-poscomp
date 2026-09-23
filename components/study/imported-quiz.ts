'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Wiring do quiz de conteúdo ingerido, por delegação de clique — o mesmo
 * padrão do ModuleImportedLessonView (components/study/module-page.tsx):
 * botão .quiz-btn com data-question-id/data-answer-key → marca .correct /
 * .wrong nas labels, mostra o resultado em #<qid>-res e (opcional) abre o
 * <details> da explicação — comportamento do mockup original.
 */
export function useImportedQuiz(
  rootRef: RefObject<HTMLElement | null>,
  reconnectKey: string,
  { openExplanation = false }: { openExplanation?: boolean } = {},
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    const rootEl = root;

    function setQuizResult(resultEl: HTMLElement, message: string, isCorrect: boolean) {
      resultEl.classList.add('show');
      resultEl.classList.remove('is-correct', 'is-wrong');
      resultEl.classList.add(isCorrect ? 'is-correct' : 'is-wrong');
      resultEl.textContent = message;
    }

    function clearOptionState(optionsRoot: HTMLElement) {
      optionsRoot.querySelectorAll<HTMLElement>('.opt').forEach((label) => {
        label.classList.remove('is-selected', 'is-correct', 'is-wrong');
      });
    }

    function handleVerifyClick(event: Event) {
      const target = event.target as HTMLElement | null;
      const button = target?.closest('button.quiz-btn') as HTMLButtonElement | null;
      if (!button || !rootEl.contains(button)) {
        return;
      }

      const questionId = button.dataset.questionId;
      const answerKey = (button.dataset.answerKey || '').trim().toUpperCase();
      if (!questionId || !answerKey) {
        return;
      }

      const optionsRoot = rootEl.querySelector<HTMLElement>(`#${questionId}`);
      const resultEl = rootEl.querySelector<HTMLElement>(`#${questionId}-res`);
      if (!optionsRoot || !resultEl) {
        return;
      }

      clearOptionState(optionsRoot);

      const selected = optionsRoot.querySelector<HTMLInputElement>(
        `input[name="${questionId}"]:checked`,
      );
      if (!selected) {
        setQuizResult(resultEl, 'Selecione uma alternativa antes de verificar.', false);
        return;
      }

      const selectedValue = selected.value.trim().toUpperCase();
      const selectedLabel = selected.closest<HTMLElement>('.opt');
      if (selectedLabel) {
        selectedLabel.classList.add('is-selected');
      }

      optionsRoot.querySelectorAll<HTMLElement>('.opt').forEach((label) => {
        const input = label.querySelector<HTMLInputElement>('input[type="radio"]');
        const optionValue = input?.value.trim().toUpperCase();
        if (optionValue === answerKey) {
          label.classList.add('is-correct');
        }
      });

      const isCorrect = selectedValue === answerKey;
      if (!isCorrect && selectedLabel) {
        selectedLabel.classList.add('is-wrong');
      }

      setQuizResult(
        resultEl,
        isCorrect
          ? `Correta. Alternativa ${answerKey}.`
          : `Incorreta. Resposta correta: ${answerKey}.`,
        isCorrect,
      );

      if (openExplanation) {
        const explanationId = button.dataset.explanationId;
        const explanation = explanationId
          ? rootEl.querySelector(`#${explanationId}`)
          : button.closest('.quiz')?.querySelector('details');
        explanation?.setAttribute('open', '');
      }
    }

    rootEl.addEventListener('click', handleVerifyClick);
    return () => {
      rootEl.removeEventListener('click', handleVerifyClick);
    };
  }, [rootRef, reconnectKey, openExplanation]);
}
