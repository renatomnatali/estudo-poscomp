import { describe, expect, it } from 'vitest';

import { validateTopicMaterialPackage } from '@/lib/topic-content';

describe('topic-content validation', () => {
  it('aceita pacote com exemplos e aplicação', () => {
    const result = validateTopicMaterialPackage({
      version: 1,
      generatedAt: '2026-02-25T00:00:00.000Z',
      topics: [
        {
          id: 'topic-1',
          slug: 'topic-1',
          title: 'Tópico 1',
          macroArea: 'fundamentos',
          subTopic: 'afd_modelagem_execucao',
          difficulty: 'medium',
          incidence: 'high',
          estimatedMinutes: 30,
          prerequisites: [],
          learningObjectives: ['Obj 1'],
          sections: [
            { id: 's1', kind: 'essential', title: 'Essencial', content: 'Resumo', order: 1 },
            { id: 's2', kind: 'advanced', title: 'Avançado', content: 'Formal', order: 2 },
          ],
          examples: [
            {
              id: 'e1',
              title: 'Exemplo',
              problem: 'Pergunta',
              strategy: 'Estratégia',
              solution: 'Solução',
              takeaway: 'Resumo',
              order: 1,
            },
          ],
          applications: [
            {
              id: 'a1',
              title: 'Aplicação',
              context: 'Contexto',
              howItApplies: 'Aplicação prática',
              order: 1,
            },
          ],
          references: [
            { id: 'r1', label: 'Fonte', url: 'https://example.org', order: 1 },
          ],
          quickChecks: [
            {
              id: 'q1',
              prompt: 'Pergunta',
              options: [
                { key: 'A', text: 'A' },
                { key: 'B', text: 'B' },
              ],
              answerKey: 'A',
              explanation: 'Explicação',
              order: 1,
            },
          ],
        },
      ],
    });

    expect(result.valid).toBe(true);
  });

  it('rejeita tópico sem exemplos', () => {
    const result = validateTopicMaterialPackage({
      version: 1,
      generatedAt: '2026-02-25T00:00:00.000Z',
      topics: [
        {
          id: 'topic-1',
          slug: 'topic-1',
          title: 'Tópico 1',
          macroArea: 'fundamentos',
          subTopic: 'afd_modelagem_execucao',
          difficulty: 'medium',
          incidence: 'high',
          estimatedMinutes: 30,
          prerequisites: [],
          learningObjectives: ['Obj 1'],
          sections: [
            { id: 's1', kind: 'essential', title: 'Essencial', content: 'Resumo', order: 1 },
            { id: 's2', kind: 'advanced', title: 'Avançado', content: 'Formal', order: 2 },
          ],
          examples: [],
          applications: [
            {
              id: 'a1',
              title: 'Aplicação',
              context: 'Contexto',
              howItApplies: 'Aplicação prática',
              order: 1,
            },
          ],
          references: [],
          quickChecks: [],
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((item) => item.includes('exemplos'))).toBe(true);
  });
});
