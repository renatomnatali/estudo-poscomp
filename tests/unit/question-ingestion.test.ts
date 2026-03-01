import { describe, expect, it } from 'vitest';

import { buildQuestionBankFromPdfs } from '@/lib/question-ingestion';

describe('question-ingestion', () => {
  it('captura 100% das questões dos cadernos 2022-2025 e anexa gabarito oficial', async () => {
    const result = await buildQuestionBankFromPdfs({
      provasDir: 'docs/Provas',
      years: [2022, 2023, 2024, 2025],
    });

    expect(result.questions).toHaveLength(280);
    expect(result.stats.byYear['2022']).toBe(70);
    expect(result.stats.byYear['2023']).toBe(70);
    expect(result.stats.byYear['2024']).toBe(70);
    expect(result.stats.byYear['2025']).toBe(70);
    expect(result.stats.missingAnswerKeys).toBe(0);

    const q2022_39 = result.questions.find((item) => item.year === 2022 && item.number === 39);
    expect(q2022_39?.answerKey).toBe('A');

    const q2022_40 = result.questions.find((item) => item.year === 2022 && item.number === 40);
    expect(q2022_40?.answerKey).toBe('*');

    const q2025_13 = result.questions.find((item) => item.year === 2025 && item.number === 13);
    expect(q2025_13?.answerKey).toBe('*');
  }, 20000);
});
