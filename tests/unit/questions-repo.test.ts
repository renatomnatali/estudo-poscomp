import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const dbMock = {
  question: {
    findMany: vi.fn(),
  },
};

vi.mock('@/lib/db', () => ({
  db: dbMock,
}));

describe('questions-repo', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    vi.resetModules();
    dbMock.question.findMany.mockReset();
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it('usa banco como fonte primária quando disponível', async () => {
    process.env.DATABASE_URL = 'postgresql://mock';

    dbMock.question.findMany.mockResolvedValue([
      {
        id: 'db-q1',
        year: 2025,
        source: 'caderno_2025.pdf',
        number: 36,
        macroArea: 'fundamentos',
        subTopic: 'minimizacao_afd',
        difficulty: 'hard',
        stem: 'Questão em banco',
        answerKey: 'C',
        tags: ['poscomp'],
        explanation: null,
        optionExplanations: null,
        options: [
          { key: 'A', text: 'A' },
          { key: 'B', text: 'B' },
          { key: 'C', text: 'C' },
          { key: 'D', text: 'D' },
          { key: 'E', text: 'E' },
        ],
      },
    ]);

    const { listQuestions } = await import('@/lib/questions-repo');
    const questions = await listQuestions({ year: '2025' });

    expect(dbMock.question.findMany).toHaveBeenCalledTimes(1);
    expect(questions).toHaveLength(1);
    expect(questions[0].id).toBe('db-q1');
  });

  it('usa fallback em arquivo quando banco não está configurado', async () => {
    delete process.env.DATABASE_URL;

    const { listQuestions } = await import('@/lib/questions-repo');
    const questions = await listQuestions({ year: '2022' });

    expect(dbMock.question.findMany).not.toHaveBeenCalled();
    expect(questions.length).toBeGreaterThan(0);
  });
});
