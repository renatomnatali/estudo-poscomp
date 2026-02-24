import type { Question } from '@/lib/types';

export interface AssessmentAnswer {
  questionId: string;
  choice: string;
}

export function gradeAssessment(
  answers: AssessmentAnswer[],
  questionMap: Map<string, Question>
): {
  score: { total: number; correct: number; accuracy: number };
  byTopic: Record<string, { answered: number; correct: number; accuracy: number; status: 'ok' | 'reforcar' }>;
  recommendedNextTopics: string[];
  gradedAnswers: Array<{
    questionId: string;
    status?: 'not_found';
    subTopic?: string;
    choice?: string;
    answerKey?: string;
    correct?: boolean;
    explanation?: string;
  }>;
} {
  const normalizedAnswers = Array.isArray(answers) ? answers : [];

  let total = 0;
  let correct = 0;
  const byTopic: Record<string, { answered: number; correct: number }> = {};

  const gradedAnswers = normalizedAnswers.map((attempt) => {
    const question = questionMap.get(attempt.questionId);

    if (!question) {
      return {
        questionId: attempt.questionId,
        status: 'not_found' as const,
      };
    }

    total += 1;
    const isCorrect = attempt.choice === question.answerKey;
    if (isCorrect) correct += 1;

    if (!byTopic[question.subTopic]) {
      byTopic[question.subTopic] = { answered: 0, correct: 0 };
    }

    byTopic[question.subTopic].answered += 1;
    if (isCorrect) byTopic[question.subTopic].correct += 1;

    return {
      questionId: attempt.questionId,
      subTopic: question.subTopic,
      choice: attempt.choice,
      answerKey: question.answerKey,
      correct: isCorrect,
      explanation: question.optionExplanations?.[attempt.choice] || question.explanation,
    };
  });

  const byTopicWithAccuracy: Record<string, { answered: number; correct: number; accuracy: number; status: 'ok' | 'reforcar' }> = {};
  Object.entries(byTopic).forEach(([subTopic, stats]) => {
    const accuracy = stats.answered > 0 ? stats.correct / stats.answered : 0;
    byTopicWithAccuracy[subTopic] = {
      ...stats,
      accuracy,
      status: accuracy >= 0.7 ? 'ok' : 'reforcar',
    };
  });

  const recommendedNextTopics = Object.entries(byTopicWithAccuracy)
    .filter(([, stats]) => stats.status === 'reforcar')
    .map(([subTopic]) => subTopic);

  return {
    score: {
      total,
      correct,
      accuracy: total > 0 ? correct / total : 0,
    },
    byTopic: byTopicWithAccuracy,
    recommendedNextTopics,
    gradedAnswers,
  };
}
