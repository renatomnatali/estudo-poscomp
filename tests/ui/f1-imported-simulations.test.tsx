/** @vitest-environment jsdom */

import { readFileSync } from 'node:fs';
import path from 'node:path';

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ModulePage } from '@/components/study/module-page';

const F11_SOURCE = JSON.parse(
  readFileSync(path.join(process.cwd(), 'data/study/modules/f1-1-analise-notacoes.source.json'), 'utf8')
);
const F13_SOURCE = JSON.parse(
  readFileSync(path.join(process.cwd(), 'data/study/modules/f1-3-analise-recorrencias.source.json'), 'utf8')
);

const F11_PAYLOAD = {
  slug: 'f1-1-analise-notacoes',
  order: 1,
  title: 'Algoritmos de Referência',
  subtitle: 'Antes de medir a eficiência de algoritmos, você precisa vê-los funcionar.',
  trackCode: 'F1',
  progressLabel: 'Módulo 1 de 3',
  chapters: [{ id: 'porque', title: 'Por quê?', content: '...' }],
  quiz: [],
  previousSlug: null,
  nextSlug: 'f1-2-notacoes-assintoticas',
};

const F13_PAYLOAD = {
  slug: 'f1-3-analise-recorrencias',
  order: 3,
  title: 'Análise de Recorrências',
  subtitle: 'Como calcular o custo de algoritmos recursivos.',
  trackCode: 'F1',
  progressLabel: 'Módulo 3 de 3',
  chapters: [{ id: 'motivacao', title: 'Motivação', content: '...' }],
  quiz: [],
  previousSlug: 'f1-2-notacoes-assintoticas',
  nextSlug: null,
};

describe('simulações importadas da trilha F1', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
      const noop = () => undefined;
      return new Proxy(
        {},
        {
          get: () => noop,
          set: () => true,
        }
      ) as unknown as CanvasRenderingContext2D;
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('executa simulador de busca linear no F1.1', async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/study/modules/f1-1-analise-notacoes/source')) {
          return { ok: true, status: 200, json: async () => F11_SOURCE };
        }
        return { ok: true, status: 200, json: async () => F11_PAYLOAD };
      })
    );

    render(<ModulePage moduleSlug="f1-1-analise-notacoes" userId="user-local" />);

    expect(await screen.findByRole('heading', { level: 1, name: /algoritmos de referência/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(document.getElementById('linearPlayBtn')).toBeTruthy();
    });

    const playBtn = document.getElementById('linearPlayBtn');
    const status = document.getElementById('linearStatus');
    expect(playBtn).toBeTruthy();
    expect(status).toBeTruthy();

    await user.click(playBtn as HTMLElement);

    await waitFor(() => {
      expect((status as HTMLElement).textContent?.trim()).not.toBe('—');
    });
  });

  it('executa calculadora do teorema mestre no F1.3', async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/study/modules/f1-3-analise-recorrencias/source')) {
          return { ok: true, status: 200, json: async () => F13_SOURCE };
        }
        return { ok: true, status: 200, json: async () => F13_PAYLOAD };
      })
    );

    render(<ModulePage moduleSlug="f1-3-analise-recorrencias" userId="user-local" />);

    expect(await screen.findByRole('heading', { level: 1, name: /análise de recorrências/i })).toBeInTheDocument();

    const calcBtn = await screen.findByRole('button', { name: /calcular/i });
    await user.click(calcBtn);

    const resultBox = document.getElementById('mcResultBox');
    expect(resultBox).toBeTruthy();

    await waitFor(() => {
      expect((resultBox as HTMLElement).className).toContain('show');
    });
  });
});
