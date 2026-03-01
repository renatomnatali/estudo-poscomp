/** @vitest-environment jsdom */

import React from 'react';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PoscompApp } from '@/components/poscomp-app';

const TOPICS_FIXTURE = [
  {
    id: 'topic-automatos-afd',
    slug: 'automatos-finitos-afd',
    title: 'Autômatos Finitos Determinísticos',
    macroArea: 'fundamentos',
    subTopic: 'afd_modelagem_execucao',
    difficulty: 'medium',
    incidence: 'high',
    estimatedMinutes: 40,
    learningObjectives: [
      'Modelar AFD com função de transição determinística.',
      'Executar leitura símbolo a símbolo.',
    ],
  },
];

const TOPIC_DETAIL_FIXTURE = {
  ...TOPICS_FIXTURE[0],
  prerequisites: ['linguagens_formais_basico'],
  sections: [
    {
      id: 'sec-essential',
      kind: 'essential',
      title: 'Camada essencial',
      content: 'Resumo direto para prova.',
      order: 1,
    },
    {
      id: 'sec-advanced',
      kind: 'advanced',
      title: 'Camada avançada',
      content: 'Formalismo M = (E, Σ, δ, i, F).',
      order: 2,
    },
  ],
  examples: [
    {
      id: 'ex-1',
      title: 'Exemplo resolvido 1',
      problem: 'A palavra ababc é aceita?',
      strategy: 'Executar estado a estado.',
      solution: 'e1 -> e1 -> e1 -> e1 -> e1 -> e2.',
      takeaway: 'Aceita ao terminar em estado final.',
      order: 1,
    },
    {
      id: 'ex-2',
      title: 'Exemplo resolvido 2',
      problem: 'A palavra aba é aceita?',
      strategy: 'Executar estado a estado.',
      solution: 'e1 -> e1 -> e1 -> e1.',
      takeaway: 'Rejeita por terminar em estado não final.',
      order: 2,
    },
  ],
  applications: [
    {
      id: 'app-1',
      title: 'Aplicação real',
      context: 'Análise léxica em compiladores.',
      howItApplies: 'Reconhecimento de tokens em tempo linear.',
      order: 1,
    },
  ],
  references: [
    {
      id: 'ref-1',
      label: 'MIT OCW 6.045J',
      url: 'https://ocw.mit.edu/courses/6-045j-automata-computability-and-complexity-spring-2011/',
      order: 1,
    },
  ],
};

const QUICK_CHECK_FIXTURE = [
  {
    id: 'qc-1',
    prompt: 'Um AFD permite duas transições com mesmo símbolo no mesmo estado?',
    options: [
      { key: 'A', text: 'Sim' },
      { key: 'B', text: 'Não' },
    ],
    answerKey: 'B',
    explanation: 'Não. A transição de AFD é determinística.',
    order: 1,
  },
];

const RELATED_QUESTIONS_FIXTURE = [
  {
    id: 'q-2022-40',
    year: 2022,
    source: 'caderno_2022.pdf',
    number: 40,
    macroArea: 'fundamentos',
    subTopic: 'afd_modelagem_execucao',
    difficulty: 'medium',
    stem: 'Qual linguagem é aceita por este AFD?',
    options: [
      { key: 'A', text: 'A' },
      { key: 'B', text: 'B' },
      { key: 'C', text: 'C' },
      { key: 'D', text: 'D' },
      { key: 'E', text: 'E' },
    ],
    answerKey: 'B',
    tags: ['poscomp'],
  },
];

describe('módulo de tópicos', () => {
  async function openTopicsModule() {
    const desktopMenu = screen.getByRole('navigation', { name: /menu principal/i });
    await userEvent.click(within(desktopMenu).getByRole('button', { name: /^tópicos$/i }));
  }

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();

        if (url.includes('/api/content/topics?') || url.endsWith('/api/content/topics')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ items: TOPICS_FIXTURE }),
          };
        }

        if (url.includes('/api/content/topics/automatos-finitos-afd/quick-check')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ items: QUICK_CHECK_FIXTURE }),
          };
        }

        if (url.includes('/api/content/topics/automatos-finitos-afd/progress')) {
          if (!init || init.method === 'GET') {
            return {
              ok: true,
              status: 200,
              json: async () => ({
                topicSlug: 'automatos-finitos-afd',
                userId: 'user-local',
                status: 'not_started',
                score: null,
                updatedAt: new Date().toISOString(),
              }),
            };
          }

          return {
            ok: true,
            status: 200,
            json: async () => ({
              topicSlug: 'automatos-finitos-afd',
              userId: 'user-local',
              status: 'completed',
              score: 1,
              updatedAt: new Date().toISOString(),
            }),
          };
        }

        if (url.includes('/api/content/topics/automatos-finitos-afd')) {
          return {
            ok: true,
            status: 200,
            json: async () => TOPIC_DETAIL_FIXTURE,
          };
        }

        if (url.includes('/api/questions')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ items: RELATED_QUESTIONS_FIXTURE, total: RELATED_QUESTIONS_FIXTURE.length }),
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

  it('exibe catálogo com filtros de estudo', async () => {
    render(<PoscompApp />);
    await openTopicsModule();

    expect(await screen.findByRole('heading', { name: /catálogo de tópicos de estudo/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/macroárea/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subtópico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dificuldade/i)).toBeInTheDocument();
    expect(screen.getByText(/Autômatos Finitos Determinísticos/i)).toBeInTheDocument();
  });

  it('abre detalhe com camada essencial e avançada recolhida', async () => {
    render(<PoscompApp />);
    await openTopicsModule();
    await screen.findByText(/Autômatos Finitos Determinísticos/i);

    await userEvent.click(screen.getByRole('button', { name: /abrir tópico/i }));

    expect(
      await screen.findByRole('heading', { name: /Autômatos Finitos Determinísticos/i, level: 2 })
    ).toBeInTheDocument();
    expect(screen.getByText(/Resumo direto para prova/i)).toBeInTheDocument();

    const advancedDetails = screen.getByText(/Camada avançada/i).closest('details');
    expect(advancedDetails).not.toBeNull();
    expect(advancedDetails).not.toHaveAttribute('open');

    expect(screen.getByText(/Exemplo resolvido 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Exemplo resolvido 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Aplicação real/i)).toBeInTheDocument();
    expect(screen.getByText(/MIT OCW 6.045J/i)).toBeInTheDocument();
  });

  it('corrige quick-check e salva progresso do tópico', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    render(
      <PoscompApp
        auth={{
          mode: 'authenticated',
          userId: 'user-local',
          displayName: 'Renato',
          email: 'renato@example.com',
        }}
      />
    );

    await openTopicsModule();
    await screen.findByText(/Autômatos Finitos Determinísticos/i);
    await userEvent.click(screen.getByRole('button', { name: /abrir tópico/i }));

    await screen.findByText(/Um AFD permite duas transições/i);
    await userEvent.click(screen.getByRole('button', { name: /B\)\s*Não/i }));
    await userEvent.click(screen.getByRole('button', { name: /corrigir quick-check/i }));
    expect(await screen.findByText(/Não\. A transição de AFD é determinística/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /salvar progresso/i }));
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/content/topics/automatos-finitos-afd/progress'),
        expect.objectContaining({ method: 'POST' })
      );
    });
    expect(await screen.findByText(/Progresso salvo com sucesso/i)).toBeInTheDocument();
  });
});
