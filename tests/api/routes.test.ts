import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { GET as getTopics } from '@/app/api/content/topics/route';
import { GET as getTopicBySlug } from '@/app/api/content/topics/[slug]/route';
import { GET as getQuestions } from '@/app/api/questions/route';
import { POST as runAfd } from '@/app/api/simulator/afd/run/route';
import { POST as minimizeAfd } from '@/app/api/simulator/afd/minimize/route';
import { POST as convertAfn } from '@/app/api/simulator/afn/convert/route';
import { POST as submitAssessment } from '@/app/api/assessment/submit/route';

const afd = {
  alphabet: ['a', 'b', 'c'],
  states: ['e1', 'e2', 'e3'],
  initialState: 'e1',
  acceptStates: ['e2'],
  transitions: {
    e1: { a: 'e1', b: 'e1', c: 'e2' },
    e2: { a: 'e3', b: 'e3', c: 'e3' },
    e3: { a: 'e3', b: 'e3', c: 'e3' },
  },
};

const nfa = {
  alphabet: ['a', 'b'],
  states: ['q0', 'q1', 'q2'],
  initialState: 'q0',
  acceptStates: ['q2'],
  transitions: {
    q0: { a: [], b: [], 'ε': ['q1'] },
    q1: { a: ['q1'], b: ['q2'], 'ε': [] },
    q2: { a: [], b: [], 'ε': [] },
  },
};

describe('api routes', () => {
  it('lista tópicos de conteúdo', async () => {
    const response = await getTopics(new NextRequest('http://localhost/api/content/topics?macroArea=fundamentos'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(payload.items)).toBe(true);
    expect(payload.items.length).toBeGreaterThan(0);
  });

  it('retorna tópico por slug', async () => {
    const response = await getTopicBySlug(new Request('http://localhost') as Request, {
      params: Promise.resolve({ slug: 'automatos-finitos-afd' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.slug).toBe('automatos-finitos-afd');
  });

  it('filtra questões', async () => {
    const response = await getQuestions(new NextRequest('http://localhost/api/questions?year=2022'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.total).toBeGreaterThan(0);
  });

  it('simula e minimiza AFD', async () => {
    const runResponse = await runAfd(
      new Request('http://localhost/api/simulator/afd/run', {
        method: 'POST',
        body: JSON.stringify({ automaton: afd, inputWord: 'ababc' }),
      })
    );

    const runPayload = await runResponse.json();
    expect(runResponse.status).toBe(200);
    expect(runPayload.result).toBe('ACEITA');

    const minResponse = await minimizeAfd(
      new Request('http://localhost/api/simulator/afd/minimize', {
        method: 'POST',
        body: JSON.stringify({ automaton: { ...afd, states: ['e1', 'e2', 'e3', 'e4'], transitions: { ...afd.transitions, e4: { a: 'e4', b: 'e4', c: 'e4' } } } }),
      })
    );

    const minPayload = await minResponse.json();
    expect(minResponse.status).toBe(200);
    expect(minPayload.minimized.states.length).toBeGreaterThan(0);
  });

  it('converte AFN e corrige assessment', async () => {
    const convResponse = await convertAfn(
      new Request('http://localhost/api/simulator/afn/convert', {
        method: 'POST',
        body: JSON.stringify({ automaton: nfa }),
      })
    );

    const convPayload = await convResponse.json();
    expect(convResponse.status).toBe(200);
    expect(convPayload.dfa.states.length).toBeGreaterThanOrEqual(2);

    const assessmentResponse = await submitAssessment(
      new Request('http://localhost/api/assessment/submit', {
        method: 'POST',
        body: JSON.stringify({
          attemptId: 'test',
          answers: [{ questionId: 'q-2022-afd-01', choice: 'B' }],
        }),
      })
    );

    const assessmentPayload = await assessmentResponse.json();
    expect(assessmentResponse.status).toBe(200);
    expect(assessmentPayload.score.correct).toBe(1);
  });
});
