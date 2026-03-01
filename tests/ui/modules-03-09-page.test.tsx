/** @vitest-environment jsdom */

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ModulePage } from '@/components/study/module-page';

type ModuleCase = {
  slug: string;
  order: number;
  title: string;
  previousSlug: string | null;
  nextSlug: string | null;
};

const MODULE_CASES: ModuleCase[] = [
  { slug: 'modulo-03', order: 3, title: 'AFN e ε-Transições', previousSlug: 'modulo-02', nextSlug: 'modulo-04' },
  { slug: 'modulo-04', order: 4, title: 'Operações e Fechamento', previousSlug: 'modulo-03', nextSlug: 'modulo-05' },
  { slug: 'modulo-05', order: 5, title: 'Minimização de AFD', previousSlug: 'modulo-04', nextSlug: 'modulo-06' },
  { slug: 'modulo-06', order: 6, title: 'Expressões Regulares', previousSlug: 'modulo-05', nextSlug: 'modulo-07' },
  {
    slug: 'modulo-07',
    order: 7,
    title: 'GLC e Autômatos de Pilha',
    previousSlug: 'modulo-06',
    nextSlug: 'modulo-08',
  },
  {
    slug: 'modulo-08',
    order: 8,
    title: 'Bombeamento, Chomsky e Computabilidade',
    previousSlug: 'modulo-07',
    nextSlug: 'modulo-09',
  },
  {
    slug: 'modulo-09',
    order: 9,
    title: 'P, NP, NP-Completo e Teorema de Gödel',
    previousSlug: 'modulo-08',
    nextSlug: null,
  },
];

function buildModulePayload(moduleCase: ModuleCase) {
  return {
    slug: moduleCase.slug,
    order: moduleCase.order,
    title: `Título legado ${moduleCase.slug}`,
    subtitle: `Subtítulo legado ${moduleCase.slug}`,
    trackCode: 'F6',
    progressLabel: `Módulo ${moduleCase.order} de 9`,
    chapters: [{ id: 'intro', title: 'Introdução', content: '...' }],
    quiz: [],
    previousSlug: moduleCase.previousSlug,
    nextSlug: moduleCase.nextSlug,
  };
}

function buildSourcePayload(moduleCase: ModuleCase) {
  return {
    header: {
      badge: `Módulo ${moduleCase.order} de 8`,
      title: moduleCase.title,
      subtitle: `Subtítulo importado ${moduleCase.slug}`,
      meta: ['⏱ ~40 min', '📐 Nível: Intermediário'],
      progressLabel: `Módulo ${moduleCase.order} de 8 — Importado`,
    },
    navLinks: [
      { id: 'definicao', label: 'Definição' },
      { id: 'resumo', label: 'Resumo' },
    ],
    html: '<section id="definicao"><h2><span class="num">0</span> Definição</h2></section><section id="resumo"><h2><span class="num">1</span> Resumo</h2></section>',
  };
}

describe('módulos 03 a 09 importados da trilha F6', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        const moduleCase = MODULE_CASES.find((entry) => url.includes(`/api/study/modules/${entry.slug}`));
        if (!moduleCase) {
          return { ok: false, status: 404, json: async () => ({ error: 'not found' }) };
        }

        if (url.endsWith('/source')) {
          return { ok: true, status: 200, json: async () => buildSourcePayload(moduleCase) };
        }

        return { ok: true, status: 200, json: async () => buildModulePayload(moduleCase) };
      })
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each(MODULE_CASES)(
    'carrega %s com conteúdo importado e navegação de trilha',
    async ({ slug, order, title, previousSlug, nextSlug }) => {
      render(<ModulePage moduleSlug={slug} userId="user-local" />);

      expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument();
      expect(screen.getByText(new RegExp(`${order}\\s*\\/\\s*9 módulos`, 'i'))).toBeInTheDocument();

      if (previousSlug) {
        expect(screen.getByRole('link', { name: /módulo anterior/i })).toHaveAttribute(
          'href',
          `/trilhas/f6/${previousSlug}`
        );
      }

      if (nextSlug) {
        expect(screen.getByRole('link', { name: /próximo módulo/i })).toHaveAttribute(
          'href',
          `/trilhas/f6/${nextSlug}`
        );
      } else {
        expect(screen.getByRole('button', { name: /próximo módulo/i })).toBeDisabled();
      }

      expect((fetch as ReturnType<typeof vi.fn>).mock.calls.some((call) => String(call[0]).endsWith(`/${slug}/source`))).toBe(
        true
      );
    }
  );
});
