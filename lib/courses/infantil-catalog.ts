import { readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Catálogo do curso infantil: ano → matéria → tema → aulas.
 *
 * Fonte de verdade da taxonomia /infantil/[ano]/[materia]/[tema]/[aula].
 * O conteúdo de uma aula disponível vive no fragmento ingerido em
 * data/study/modules/<moduleSlug>.source.json (mesmo pipeline dos módulos
 * POSCOMP); o catálogo só referencia.
 */

/** Status de publicação de uma aula. */
export type InfantilLessonStatus = 'disponivel' | 'em-breve';

export interface InfantilLesson {
  /** Slug da aula na URL: /infantil/<ano>/<materia>/<tema>/<slug>. */
  slug: string;
  /** Título exibido — escrito como termo de busca (SEO). */
  title: string;
  status: InfantilLessonStatus;
  /**
   * Slug do fragmento ingerido em data/study/modules (apenas aulas
   * disponíveis). Aula "em-breve" não tem fragmento.
   */
  moduleSlug?: string;
  /**
   * Data real da última mudança de substância no conteúdo da aula
   * (data do commit do fragmento) — alimenta o lastmod do sitemap.
   * Nunca é timestamp de build.
   */
  updatedAt?: string;
}

export interface InfantilTheme {
  /** Slug do tema na URL: /infantil/<ano>/<materia>/<slug>. */
  slug: string;
  title: string;
  description: string;
  /** Habilidade da BNCC que o tema desenvolve (ex.: EF05MA07). */
  bnccCode: string;
  lessons: InfantilLesson[];
}

export interface InfantilSubject {
  /** Slug da matéria na URL: /infantil/<ano>/<slug>. */
  slug: string;
  title: string;
  themes: InfantilTheme[];
}

export interface InfantilYear {
  /** Slug do ano na URL: /infantil/<slug>. */
  slug: string;
  title: string;
  subjects: InfantilSubject[];
}

export const INFANTIL_CATALOG: InfantilYear[] = [
  {
    slug: '5-ano',
    title: '5º ano',
    subjects: [
      {
        slug: 'matematica',
        title: 'Matemática',
        themes: [
          {
            slug: 'fracoes',
            title: 'Frações',
            description:
              'Do pedaço de chocolate até a conta no caderno: o que é uma fração, frações equivalentes, comparação, soma e subtração — com barras animadas para ver cada fatia.',
            bnccCode: 'EF05MA07',
            lessons: [
              {
                slug: 'o-que-e-uma-fracao-parte-todo',
                title: 'O que é uma fração: a ideia de parte e todo',
                status: 'em-breve',
              },
              {
                slug: 'fracoes-maiores-que-a-unidade',
                title: 'Frações maiores que a unidade',
                status: 'em-breve',
              },
              {
                slug: 'fracoes-equivalentes',
                title: 'Frações equivalentes',
                status: 'em-breve',
              },
              {
                slug: 'comparando-e-ordenando-fracoes',
                title: 'Comparando e ordenando frações',
                status: 'em-breve',
              },
              {
                slug: 'somando-fracoes-com-denominadores-diferentes',
                title: 'Somando frações com denominadores diferentes',
                status: 'em-breve',
              },
              {
                slug: 'subtraindo-fracoes-com-denominadores-diferentes',
                title: 'Subtraindo frações com denominadores diferentes',
                status: 'disponivel',
                moduleSlug: 'fracoes-subtracao-mmc',
                // Data do commit que registrou o fragmento (6bcc5bf, PR #27).
                updatedAt: '2026-09-23',
              },
              {
                slug: 'misturando-fracoes-e-decimais',
                title: 'Misturando frações e decimais',
                status: 'em-breve',
              },
              {
                slug: 'revisao-o-mapa-das-fracoes',
                title: 'Revisão: o mapa das frações',
                status: 'em-breve',
              },
            ],
          },
        ],
      },
    ],
  },
];

export function getInfantilYear(slug: string): InfantilYear | undefined {
  return INFANTIL_CATALOG.find((year) => year.slug === slug);
}

export function getInfantilSubject(
  yearSlug: string,
  subjectSlug: string,
): InfantilSubject | undefined {
  return getInfantilYear(yearSlug)?.subjects.find((subject) => subject.slug === subjectSlug);
}

export function getInfantilTheme(
  yearSlug: string,
  subjectSlug: string,
  themeSlug: string,
): InfantilTheme | undefined {
  return getInfantilSubject(yearSlug, subjectSlug)?.themes.find(
    (theme) => theme.slug === themeSlug,
  );
}

export function getInfantilLesson(
  theme: InfantilTheme,
  lessonSlug: string,
): InfantilLesson | undefined {
  return theme.lessons.find((lesson) => lesson.slug === lessonSlug);
}

/** Aulas disponíveis do catálogo inteiro (generateStaticParams/sitemap). */
export function getInfantilAvailableLessons(): Array<{
  ano: string;
  materia: string;
  tema: string;
  aula: string;
  lesson: InfantilLesson;
  theme: InfantilTheme;
  subject: InfantilSubject;
  year: InfantilYear;
}> {
  const available: ReturnType<typeof getInfantilAvailableLessons> = [];
  for (const year of INFANTIL_CATALOG) {
    for (const subject of year.subjects) {
      for (const theme of subject.themes) {
        for (const lesson of theme.lessons) {
          if (lesson.status !== 'disponivel' || !lesson.moduleSlug) {
            continue;
          }
          available.push({
            ano: year.slug,
            materia: subject.slug,
            tema: theme.slug,
            aula: lesson.slug,
            lesson,
            theme,
            subject,
            year,
          });
        }
      }
    }
  }
  return available;
}

/** Combinações ano/materia/tema do catálogo (generateStaticParams/sitemap). */
export function getInfantilThemes(): Array<{
  ano: string;
  materia: string;
  tema: string;
  theme: InfantilTheme;
  subject: InfantilSubject;
  year: InfantilYear;
}> {
  const themes: ReturnType<typeof getInfantilThemes> = [];
  for (const year of INFANTIL_CATALOG) {
    for (const subject of year.subjects) {
      for (const theme of subject.themes) {
        themes.push({ ano: year.slug, materia: subject.slug, tema: theme.slug, theme, subject, year });
      }
    }
  }
  return themes;
}

/** Fragmentos referenciados pelo catálogo — allowlist do loader de arquivos. */
export function getInfantilLessonModuleSlugs(): Set<string> {
  const slugs = new Set<string>();
  for (const entry of getInfantilAvailableLessons()) {
    if (entry.lesson.moduleSlug) {
      slugs.add(entry.lesson.moduleSlug);
    }
  }
  return slugs;
}

/** Fragmento ingerido de uma aula (header/navLinks/html), server-side. */
export interface InfantilLessonSource {
  header: {
    badge: string;
    title: string;
    subtitle: string;
    meta: string[];
    progressLabel: string;
  };
  navLinks: Array<{ id: string; label: string }>;
  html: string;
}

/**
 * Carrega o fragmento de uma aula disponível de data/study/modules.
 * Retorna null para slug fora do catálogo ou arquivo ausente; lança para
 * arquivo presente com shape inválido (falha rápida, erro específico).
 */
export async function loadInfantilLessonSource(
  moduleSlug: string,
): Promise<InfantilLessonSource | null> {
  if (!getInfantilLessonModuleSlugs().has(moduleSlug)) {
    return null;
  }

  const sourcePath = path.join(
    process.cwd(),
    'data',
    'study',
    'modules',
    `${moduleSlug}.source.json`,
  );
  const rawSource = await readFile(sourcePath, 'utf8').catch(() => null);
  if (!rawSource) {
    return null;
  }

  const parsed = JSON.parse(rawSource) as Partial<InfantilLessonSource>;
  if (
    !parsed.header ||
    typeof parsed.header.title !== 'string' ||
    typeof parsed.html !== 'string' ||
    !Array.isArray(parsed.navLinks)
  ) {
    throw new Error(`Fragmento de aula com shape inesperado: ${sourcePath}`);
  }

  return {
    header: {
      badge: parsed.header.badge ?? '',
      title: parsed.header.title,
      subtitle: parsed.header.subtitle ?? '',
      meta: Array.isArray(parsed.header.meta) ? parsed.header.meta : [],
      progressLabel: parsed.header.progressLabel ?? '',
    },
    navLinks: parsed.navLinks,
    html: parsed.html,
  };
}
