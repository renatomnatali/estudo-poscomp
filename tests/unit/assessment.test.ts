import { describe, expect, it } from 'vitest';

import { gradeAssessment } from '@/lib/assessment';
import type { Question } from '@/lib/types';

const questionMap = new Map<string, Question>([
  [
    'q1',
    {
      id: 'q1',
      year: 2025,
      source: 'caderno_2025.pdf',
      number: 1,
      macroArea: 'fundamentos',
      subTopic: 'conversao_afn_afd',
      difficulty: 'medium',
      stem: 'Pergunta',
      options: [
        { key: 'A', text: 'A' },
        { key: 'B', text: 'B' },
        { key: 'C', text: 'C' },
        { key: 'D', text: 'D' },
        { key: 'E', text: 'E' },
      ],
      answerKey: 'A',
      tags: ['afn'],
      explanation: 'Explicação',
    },
  ],
  [
    'q2',
    {
      id: 'q2',
      year: 2025,
      source: 'caderno_2025.pdf',
      number: 13,
      macroArea: 'fundamentos',
      subTopic: 'afd_modelagem_execucao',
      difficulty: 'medium',
      stem: 'Pergunta anulada',
      options: [
        { key: 'A', text: 'A' },
        { key: 'B', text: 'B' },
        { key: 'C', text: 'C' },
        { key: 'D', text: 'D' },
        { key: 'E', text: 'E' },
      ],
      answerKey: '*',
      tags: ['anulada'],
      explanation: 'Questão anulada.',
    },
  ],
]);

describe('assessment', () => {
  it('marca subtópico abaixo da meta com status "reforçar" e recomenda atividades', () => {
    const result = gradeAssessment(
      [
        {
          questionId: 'q1',
          choice: 'B',
        },
      ],
      questionMap
    );

    expect(result.byTopic.conversao_afn_afd.status).toBe('reforçar');
    expect(result.recommendedNextTopics).toEqual(['conversao_afn_afd']);
    expect(result.recommendedActivities).toBeDefined();
    expect(result.recommendedActivities.length).toBeGreaterThan(0);
    expect(result.recommendedActivities[0].subTopic).toBe('conversao_afn_afd');
  });

  it('não penaliza questão anulada e informa feedback específico', () => {
    const result = gradeAssessment(
      [
        {
          questionId: 'q2',
          choice: 'A',
        },
      ],
      questionMap
    );

    expect(result.score.total).toBe(1);
    expect(result.score.correct).toBe(1);
    expect(result.gradedAnswers[0].correct).toBe(true);
    expect(result.gradedAnswers[0].explanation).toMatch(/anulada/i);
  });
});
