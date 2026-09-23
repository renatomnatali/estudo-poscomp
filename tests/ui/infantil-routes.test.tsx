/** @vitest-environment jsdom */

import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import ThemePage, {
  generateMetadata as generateThemeMetadata,
  generateStaticParams as themeStaticParams,
} from '@/app/infantil/[ano]/[materia]/[tema]/page';
import LessonPage, {
  generateMetadata as generateLessonMetadata,
  generateStaticParams as lessonStaticParams,
} from '@/app/infantil/[ano]/[materia]/[tema]/[aula]/page';
import { loadInfantilLessonSource } from '@/lib/courses/infantil-catalog';

/** Digest que o Next usa para o notFound() — o contrato de 404 do App Router. */
const NOT_FOUND_DIGEST = 'NEXT_HTTP_ERROR_FALLBACK;404';

const TEMA_PARAMS = { ano: '5-ano', materia: 'matematica', tema: 'fracoes' };
const AULA_BASE = {
  ...TEMA_PARAMS,
  aula: 'subtraindo-fracoes-com-denominadores-diferentes',
};
type AulaParams = typeof AULA_BASE;
const AULA_EM_BREVE = { ...TEMA_PARAMS, aula: 'o-que-e-uma-fracao-parte-todo' };

const temaParams = (override: Partial<typeof TEMA_PARAMS> = {}) => ({
  params: Promise.resolve({ ...TEMA_PARAMS, ...override }),
});
const aulaParams = (override: Partial<AulaParams> = {}) => ({
  params: Promise.resolve({ ...AULA_BASE, ...override }),
});

describe('rota da porta do tema /infantil/[ano]/[materia]/[tema]', () => {
  afterEach(() => {
    cleanup();
  });

  it('gera metadata com título composto do catálogo, BNCC na descrição e canonical da porta', async () => {
    const metadata = await generateThemeMetadata(temaParams());

    expect(metadata.title).toBe('Frações · Matemática 5º ano — aprovado.xyz');
    // year.title dinâmico: a descrição cita o ano do catálogo, não texto fixo.
    expect(metadata.description).toContain('Aulas do 5º ano');
    expect(metadata.description).toContain('EF05MA07');
    expect(metadata.alternates).toEqual({ canonical: '/infantil/5-ano/matematica/fracoes' });
  });

  it('pré-gera exatamente os temas do catálogo', () => {
    expect(themeStaticParams()).toEqual([{ ano: '5-ano', materia: 'matematica', tema: 'fracoes' }]);
  });

  it('lista o tema com apenas a aula disponível navegável — aulas em-breve não viram link', async () => {
    const ui = await ThemePage(temaParams());
    render(ui);

    expect(screen.getByRole('heading', { level: 1, name: 'Frações' })).toBeInTheDocument();

    // A grade de aulas expõe UM link: o da aula disponível, com a URL certa.
    const grade = screen.getByRole('region', { name: /aulas do tema frações/i });
    const links = within(grade).getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute(
      'href',
      '/infantil/5-ano/matematica/fracoes/subtraindo-fracoes-com-denominadores-diferentes',
    );

    // A aula em-breve existe na grade (título visível), mas não navega.
    expect(within(grade).getByRole('heading', { level: 3, name: /o que é uma fração/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /o que é uma fração/i })).not.toBeInTheDocument();
  });

  it('oferece trilha de volta para a home do infantil', async () => {
    const ui = await ThemePage(temaParams());
    render(ui);

    const nav = screen.getByRole('navigation', { name: /trilha até este tema/i });
    expect(within(nav).getByRole('link', { name: 'Infantil' })).toHaveAttribute('href', '/infantil');
  });

  it('tema desconhecido devolve 404 (notFound), sem página inventada', async () => {
    await expect(ThemePage(temaParams({ tema: 'decimais' }))).rejects.toMatchObject({
      digest: NOT_FOUND_DIGEST,
    });
  });
});

describe('rota da aula /infantil/[ano]/[materia]/[tema]/[aula]', () => {
  afterEach(() => {
    cleanup();
  });

  it('gera metadata com o título canônico da aula e o subtítulo real do fragmento', async () => {
    const metadata = await generateLessonMetadata(aulaParams());
    const fragmento = await loadInfantilLessonSource('fracoes-subtracao-mmc');

    expect(metadata.title).toBe(
      'Subtraindo frações com denominadores diferentes | Frações · Matemática 5º ano',
    );
    expect(metadata.description).toBe(fragmento?.header.subtitle);
    expect(metadata.alternates).toEqual({
      canonical:
        '/infantil/5-ano/matematica/fracoes/subtraindo-fracoes-com-denominadores-diferentes',
    });
  });

  it('aula em-breve não gera metadata órfã — 404 e metadata vazia por simetria', async () => {
    // A página de aula em-breve devolve 404; a metadata devolve {} pelo
    // mesmo motivo (early-return sem moduleSlug) — nada de title/description
    // para uma página que não existe.
    const emBreve = await generateLessonMetadata(aulaParams({ aula: AULA_EM_BREVE.aula }));

    expect(emBreve).toEqual({});
  });

  it('aula desconhecida não gera metadata', async () => {
    const desconhecida = await generateLessonMetadata(aulaParams({ aula: 'aula-x' }));

    expect(desconhecida).toEqual({});
  });

  it('pré-gera exatamente as aulas disponíveis do catálogo', () => {
    expect(lessonStaticParams()).toEqual([
      {
        ano: '5-ano',
        materia: 'matematica',
        tema: 'fracoes',
        aula: 'subtraindo-fracoes-com-denominadores-diferentes',
      },
    ]);
  });

  it('aula em-breve devolve 404 (não há página para o que ainda não existe)', async () => {
    await expect(LessonPage(aulaParams({ aula: AULA_EM_BREVE.aula }))).rejects.toMatchObject({
      digest: NOT_FOUND_DIGEST,
    });
  });

  it('aula desconhecida devolve 404', async () => {
    await expect(LessonPage(aulaParams({ aula: 'nao-existe' }))).rejects.toMatchObject({
      digest: NOT_FOUND_DIGEST,
    });
  });

  it('tema desconhecido devolve 404 mesmo com slug de aula válido', async () => {
    await expect(
      LessonPage(aulaParams({ tema: 'geometria', aula: AULA_EM_BREVE.aula })),
    ).rejects.toMatchObject({ digest: NOT_FOUND_DIGEST });
  });

  it('aula disponível renderiza o fragmento real com os 4 simuladores interativos montados', async () => {
    const ui = await LessonPage(aulaParams());
    render(ui);

    // Título do fragmento ingerido real, direto do pipeline.
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Subtração de Frações com Denominadores Diferentes',
      }),
    ).toBeInTheDocument();

    // Os 4 marcadores do fragmento viraram simuladores React vivos
    // (cada um com sua barra de ações ▶ ⏭ ⏮ ↺).
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /executar tudo/i })).toHaveLength(4);
    });
  });
});
