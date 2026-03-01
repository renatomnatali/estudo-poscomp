/** @vitest-environment jsdom */

import React from 'react';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { QuestionsPanel } from '@/components/modules/questions-panel';

const QUESTIONS_FIXTURE = [
  {
    id: 'q1',
    year: 2025,
    source: 'caderno_2025.pdf',
    number: 31,
    macroArea: 'fundamentos',
    subTopic: 'afd_modelagem_execucao',
    difficulty: 'medium',
    stem: 'Questão 1: linguagem reconhecida por AFD.',
    options: [
      { key: 'A', text: 'Opção A1' },
      { key: 'B', text: 'Opção B1' },
      { key: 'C', text: 'Opção C1' },
      { key: 'D', text: 'Opção D1' },
      { key: 'E', text: 'Opção E1' },
    ],
    answerKey: 'B',
    tags: ['afd'],
    explanation: 'Explicação geral Q1',
    optionExplanations: {
      A: 'Resposta incorreta.\n\nGabarito oficial: B.\n\nIncorreta: termina com a.',
      B: 'Q1 alternativa B',
      C: 'Q1 alternativa C',
      D: 'Q1 alternativa D',
      E: 'Q1 alternativa E',
    },
  },
  {
    id: 'q2',
    year: 2024,
    source: 'caderno_2024.pdf',
    number: 37,
    macroArea: 'fundamentos',
    subTopic: 'minimizacao_afd',
    difficulty: 'hard',
    stem: 'Questão 2: minimização de AFD.',
    options: [
      { key: 'A', text: 'Opção A2' },
      { key: 'B', text: 'Opção B2' },
      { key: 'C', text: 'Opção C2' },
      { key: 'D', text: 'Opção D2' },
      { key: 'E', text: 'Opção E2' },
    ],
    answerKey: 'C',
    tags: ['min'],
    explanation: 'Explicação geral Q2',
    optionExplanations: {
      A: 'Q2 alternativa A',
      B: 'Q2 alternativa B',
      C: 'Q2 alternativa C',
      D: 'Q2 alternativa D',
      E: 'Q2 alternativa E',
    },
  },
  {
    id: 'q3',
    year: 2023,
    source: 'caderno_2023.pdf',
    number: 40,
    macroArea: 'fundamentos',
    subTopic: 'conversao_afn_afd',
    difficulty: 'easy',
    stem: 'Questão 3: conversão AFN→AFD.',
    options: [
      { key: 'A', text: 'Opção A3' },
      { key: 'B', text: 'Opção B3' },
      { key: 'C', text: 'Opção C3' },
      { key: 'D', text: 'Opção D3' },
      { key: 'E', text: 'Opção E3' },
    ],
    answerKey: 'A',
    tags: ['conv'],
    explanation: 'Explicação geral Q3',
    optionExplanations: {
      A: 'Q3 alternativa A',
      B: 'Q3 alternativa B',
      C: 'Q3 alternativa C',
      D: 'Q3 alternativa D',
      E: 'Q3 alternativa E',
    },
  },
] as const;

function buildAssessmentPayload(answers: Array<{ questionId: string; choice: string }>) {
  const questionMap = new Map(QUESTIONS_FIXTURE.map((question) => [question.id, question]));

  const byTopic = new Map<string, { answered: number; correct: number }>();

  const gradedAnswers = answers.map((answer) => {
    const question = questionMap.get(answer.questionId);
    if (!question) return { questionId: answer.questionId, status: 'not_found' as const };

    const isCorrect = answer.choice === question.answerKey;
    const stats = byTopic.get(question.subTopic) ?? { answered: 0, correct: 0 };
    stats.answered += 1;
    if (isCorrect) stats.correct += 1;
    byTopic.set(question.subTopic, stats);

    return {
      questionId: question.id,
      subTopic: question.subTopic,
      choice: answer.choice,
      answerKey: question.answerKey,
      correct: isCorrect,
      explanation: question.optionExplanations[answer.choice as 'A' | 'B' | 'C' | 'D' | 'E'] || question.explanation,
    };
  });

  const byTopicPayload = Object.fromEntries(
    Array.from(byTopic.entries()).map(([topic, stats]) => {
      const accuracy = stats.answered > 0 ? stats.correct / stats.answered : 0;
      return [
        topic,
        {
          answered: stats.answered,
          correct: stats.correct,
          accuracy,
          status: accuracy >= 0.7 ? 'ok' : 'reforçar',
        },
      ];
    })
  );

  const recommendedNextTopics = Object.entries(byTopicPayload)
    .filter(([, item]) => (item as { status: string }).status === 'reforçar')
    .map(([topic]) => topic);

  const correctCount = gradedAnswers.filter((item) => 'correct' in item && item.correct).length;

  return {
    score: {
      total: gradedAnswers.length,
      correct: correctCount,
      accuracy: gradedAnswers.length > 0 ? correctCount / gradedAnswers.length : 0,
    },
    byTopic: byTopicPayload,
    recommendedNextTopics,
    recommendedActivities: recommendedNextTopics.map((topic) => ({
      subTopic: topic,
      activities: ['Atividade 1', 'Atividade 2'],
    })),
    gradedAnswers,
  };
}

describe('QuestionsPanel UX V2', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();

        if (url.includes('/api/questions')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ items: QUESTIONS_FIXTURE }),
          };
        }

        if (url.includes('/api/assessment/submit')) {
          const raw = init?.body ? String(init.body) : '{}';
          const parsed = JSON.parse(raw) as { answers?: Array<{ questionId: string; choice: string }> };

          return {
            ok: true,
            status: 200,
            json: async () => buildAssessmentPayload(parsed.answers || []),
          };
        }

        return {
          ok: false,
          status: 404,
          json: async () => ({ error: 'not found' }),
        };
      })
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('exibe sessão unificada sem lista lateral como fluxo primário', async () => {
    render(<QuestionsPanel />);

    await screen.findByText('Questão 1: linguagem reconhecida por AFD.');

    const sessionCard = screen.getByTestId('questions-session-card');
    expect(within(sessionCard).getByLabelText('Ano')).toBeInTheDocument();
    expect(within(sessionCard).getByText('Questão 1: linguagem reconhecida por AFD.')).toBeInTheDocument();
    expect(within(sessionCard).getByText(/Questão 1 de 3/)).toBeInTheDocument();
    expect(screen.queryByText(/^Lista$/i)).not.toBeInTheDocument();
  });

  it('navega em fluxo linear com botões anterior e próxima', async () => {
    render(<QuestionsPanel />);

    await screen.findByText('Questão 1: linguagem reconhecida por AFD.');

    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }));
    expect(screen.getByText('Questão 2: minimização de AFD.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(screen.getByText('Questão 1: linguagem reconhecida por AFD.')).toBeInTheDocument();
  });

  it('exibe feedback único abaixo dos botões com texto direto', async () => {
    render(<QuestionsPanel />);

    await screen.findByText('Questão 1: linguagem reconhecida por AFD.');

    expect(screen.queryByTestId('exercise-feedback')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /B\) Opção B1/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Corrigir resposta' }));
    const sessionCard = screen.getByTestId('questions-session-card');
    const feedback = await screen.findByTestId('exercise-feedback');

    await waitFor(() => {
      expect(feedback).toBeInTheDocument();
      expect(within(feedback).getByText('Q1 alternativa B')).toBeInTheDocument();
      expect(within(feedback).queryByText(/Gabarito oficial:/i)).not.toBeInTheDocument();
      expect(within(feedback).queryByText(/Resposta correta\./i)).not.toBeInTheDocument();
      expect(within(sessionCard).queryAllByTestId('exercise-feedback')).toHaveLength(1);
    });
  });

  it('oculta feedback da questão anterior ao navegar para próxima', async () => {
    render(<QuestionsPanel />);

    await screen.findByText('Questão 1: linguagem reconhecida por AFD.');

    await userEvent.click(screen.getByRole('button', { name: /A\) Opção A1/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Corrigir resposta' }));
    await screen.findByTestId('exercise-feedback');

    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }));
    expect(screen.queryByTestId('exercise-feedback')).not.toBeInTheDocument();
  });

  it('remove redundância de status e gabarito no feedback exibido', async () => {
    render(<QuestionsPanel />);

    await screen.findByText('Questão 1: linguagem reconhecida por AFD.');

    await userEvent.click(screen.getByRole('button', { name: /A\) Opção A1/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Corrigir resposta' }));

    const feedback = await screen.findByTestId('exercise-feedback');

    expect(within(feedback).getByText('Incorreta: termina com a.')).toBeInTheDocument();
    expect(within(feedback).queryByText(/Resposta incorreta\./i)).not.toBeInTheDocument();
    expect(within(feedback).queryByText(/Gabarito oficial:/i)).not.toBeInTheDocument();
  });

  it('atualiza progresso da sessão após correções', async () => {
    render(<QuestionsPanel />);

    await screen.findByText('Questão 1: linguagem reconhecida por AFD.');

    await userEvent.click(screen.getByRole('button', { name: /B\) Opção B1/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Corrigir resposta' }));

    expect(screen.getByText(/Respondidas: 1 · Corretas: 1/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }));
    await userEvent.click(screen.getByRole('button', { name: /A\) Opção A2/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Corrigir resposta' }));

    await waitFor(() => {
      expect(screen.getByText(/Respondidas: 2 · Corretas: 1/)).toBeInTheDocument();
    });
  });

  it('mantém métricas e atividades recolhidas por padrão', async () => {
    render(<QuestionsPanel />);

    await screen.findByText('Questão 1: linguagem reconhecida por AFD.');

    const metricsSummary = screen.getByText(/Métricas por subtópico/i);
    const metricsDetails = metricsSummary.closest('details');
    expect(metricsDetails).not.toBeNull();
    expect(metricsDetails).not.toHaveAttribute('open');

    const activitiesSummary = screen.getByText(/Atividades de reforço recomendadas/i);
    const activitiesDetails = activitiesSummary.closest('details');
    expect(activitiesDetails).not.toBeNull();
    expect(activitiesDetails).not.toHaveAttribute('open');
  });
});
