import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SIMULATOR_KINDS } from '@/components/infantil/simulators/registry';

/**
 * O loader lê arquivos reais de data/study/modules. Para exercitar os caminhos
 * de erro (arquivo ausente, shape inválido) sem escrever no disco, o mock
 * intercepta node:fs/promises.readFile — a fronteira externa do loader — e
 * delega ao fs real no modo "real" (caminho feliz lê o fragmento verdadeiro).
 */
const fsMode = vi.hoisted(() => ({
  mode: 'real' as 'real' | 'missing' | 'invalid',
  payload: '',
}));

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    readFile: ((path: unknown, encoding: unknown) => {
      if (fsMode.mode === 'missing') {
        return Promise.reject(new Error('ENOENT: arquivo simulado ausente'));
      }
      if (fsMode.mode === 'invalid') {
        return Promise.resolve(fsMode.payload);
      }
      return (actual.readFile as (p: unknown, e: unknown) => Promise<string>)(path, encoding);
    }) as unknown as typeof actual.readFile,
  };
});

import {
  getInfantilAvailableLessons,
  getInfantilLesson,
  getInfantilLessonModuleSlugs,
  getInfantilSubject,
  getInfantilTheme,
  getInfantilYear,
  loadInfantilLessonSource,
} from '@/lib/courses/infantil-catalog';

const FRACOES_PARAMS = { ano: '5-ano', materia: 'matematica', tema: 'fracoes' } as const;

describe('catálogo do curso infantil', () => {
  describe('tema Frações (5º ano · Matemática)', () => {
    it('lista 8 aulas: 7 em breve e exatamente 1 disponível, com fragmento e data reais', async () => {
      const theme = getInfantilTheme(FRACOES_PARAMS.ano, FRACOES_PARAMS.materia, FRACOES_PARAMS.tema);

      expect(theme).toBeDefined();
      expect(theme!.lessons).toHaveLength(8);

      const disponiveis = theme!.lessons.filter((lesson) => lesson.status === 'disponivel');
      expect(disponiveis).toHaveLength(1);
      expect(disponiveis[0].slug).toBe('subtraindo-fracoes-com-denominadores-diferentes');
      expect(disponiveis[0].moduleSlug).toBe('fracoes-subtracao-mmc');

      expect(theme!.lessons.filter((lesson) => lesson.status === 'em-breve')).toHaveLength(7);

      // Aula em-breve não referencia fragmento: não há meia-disponibilidade.
      for (const lesson of theme!.lessons) {
        if (lesson.status !== 'disponivel') {
          expect(lesson.moduleSlug).toBeUndefined();
        }
      }
    });

    it('toda aula disponível carrega updatedAt em formato de data real (YYYY-MM-DD), nunca timestamp de build', () => {
      const theme = getInfantilTheme(FRACOES_PARAMS.ano, FRACOES_PARAMS.materia, FRACOES_PARAMS.tema)!;

      for (const lesson of theme.lessons) {
        if (lesson.status !== 'disponivel') continue;
        expect(lesson.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });
  });

  describe('resolução de slugs da URL', () => {
    it('resolve ano, matéria, tema e aula pelos slugs canônicos', () => {
      const year = getInfantilYear('5-ano');
      const subject = getInfantilSubject('5-ano', 'matematica');
      const theme = getInfantilTheme('5-ano', 'matematica', 'fracoes');
      const lesson = theme ? getInfantilLesson(theme, 'subtraindo-fracoes-com-denominadores-diferentes') : undefined;

      expect(year?.title).toBe('5º ano');
      expect(subject?.title).toBe('Matemática');
      expect(theme?.title).toBe('Frações');
      expect(lesson?.moduleSlug).toBe('fracoes-subtracao-mmc');
    });

    it('devolve undefined para cada segmento desconhecido, sem lançar', () => {
      expect(getInfantilYear('9-ano')).toBeUndefined();
      expect(getInfantilSubject('5-ano', 'portugues')).toBeUndefined();
      expect(getInfantilTheme('5-ano', 'matematica', 'decimais')).toBeUndefined();

      const theme = getInfantilTheme('5-ano', 'matematica', 'fracoes')!;
      expect(getInfantilLesson(theme, 'aula-que-nao-existe')).toBeUndefined();
    });
  });

  describe('agregadores (rotas estáticas e sitemap)', () => {
    it('aponta exatamente a aula disponível com as 4 partes da URL', () => {
      const available = getInfantilAvailableLessons();

      expect(available).toHaveLength(1);
      expect(available[0]).toMatchObject({
        ano: '5-ano',
        materia: 'matematica',
        tema: 'fracoes',
        aula: 'subtraindo-fracoes-com-denominadores-diferentes',
      });
    });

    it('a allowlist de moduleSlugs contém apenas o fragmento da aula disponível', () => {
      expect(getInfantilLessonModuleSlugs()).toEqual(new Set(['fracoes-subtracao-mmc']));
    });
  });
});

describe('loadInfantilLessonSource (loader de fragmentos)', () => {
  beforeEach(() => {
    fsMode.mode = 'real';
    fsMode.payload = '';
  });

  afterEach(() => {
    fsMode.mode = 'real';
    fsMode.payload = '';
  });

  it('devolve o fragmento ingerido real para o slug da allowlist', async () => {
    const source = await loadInfantilLessonSource('fracoes-subtracao-mmc');

    expect(source).not.toBeNull();
    expect(source!.header.title).toBe('Subtração de Frações com Denominadores Diferentes');
    expect(source!.navLinks.length).toBeGreaterThan(0);
    for (const link of source!.navLinks) {
      expect(typeof link.id).toBe('string');
      expect(typeof link.label).toBe('string');
    }
    expect(typeof source!.html).toBe('string');
    expect(source!.html.length).toBeGreaterThan(0);
  });

  it('o fragmento real só referencia simuladores conhecidos pelo registry do infantil', async () => {
    // Arrange — contrato fragmento ingerido ↔ registry: um marcador novo no
    // HTML que não exista como componente deixaria skeleton estático no lugar.
    const source = await loadInfantilLessonSource('fracoes-subtracao-mmc');

    // Act
    const markers = Array.from(
      source!.html.matchAll(/data-simulator="([^"]+)"/g),
      (match) => match[1],
    );

    // Assert
    expect(new Set(markers).size).toBe(4);
    for (const marker of markers) {
      expect(SIMULATOR_KINDS, `marcador desconhecido: ${marker}`).toContain(marker);
    }
  });

  it('retorna null para slug fora da allowlist — inclusive slug de outro curso e tentativa de path traversal', async () => {
    await expect(loadInfantilLessonSource('modulo-01')).resolves.toBeNull();
    await expect(loadInfantilLessonSource('fracoes-subtracao-mmc.source')).resolves.toBeNull();
    await expect(loadInfantilLessonSource('../../lib/courses/infantil-catalog')).resolves.toBeNull();
  });

  it('retorna null, sem lançar, quando o arquivo do fragmento está ausente no disco', async () => {
    fsMode.mode = 'missing';

    await expect(loadInfantilLessonSource('fracoes-subtracao-mmc')).resolves.toBeNull();
  });

  it('lança erro específico citando o caminho quando o fragmento tem shape inesperado', async () => {
    // Arrange — arquivo presente, mas sem o campo html (drift de ingestão).
    fsMode.mode = 'invalid';
    fsMode.payload = JSON.stringify({ header: { title: 'Fragmento quebrado' }, navLinks: [] });

    // Act + Assert — falha rápida com diagnóstico do arquivo responsável.
    await expect(loadInfantilLessonSource('fracoes-subtracao-mmc')).rejects.toThrow(
      /Fragmento de aula com shape inesperado: .*fracoes-subtracao-mmc\.source\.json/,
    );
  });

  it('completa campos opcionais do header ausentes no fragmento, sem lançar', async () => {
    // Arrange — fragmento antigo sem badge/subtitle/meta ainda deve carregar.
    fsMode.mode = 'invalid';
    fsMode.payload = JSON.stringify({
      header: { title: 'Aula mínima' },
      navLinks: [{ id: 'inicio', label: 'Início' }],
      html: '<p>conteúdo</p>',
    });

    // Act
    const source = await loadInfantilLessonSource('fracoes-subtracao-mmc');

    // Assert
    expect(source).toEqual({
      header: {
        badge: '',
        title: 'Aula mínima',
        subtitle: '',
        meta: [],
        progressLabel: '',
      },
      navLinks: [{ id: 'inicio', label: 'Início' }],
      html: '<p>conteúdo</p>',
    });
  });
});
