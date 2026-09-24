import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  getInfantilSubject,
  getInfantilTheme,
  getInfantilThemes,
  getInfantilYear,
} from '@/lib/courses/infantil-catalog';
import { getCourseOrThrow, getCourses } from '@/lib/courses/registry';
import { StudyShell } from '@/components/study/study-shell';
import { ThemeLessons } from '@/components/infantil/theme-lessons';

interface ThemeRouteProps {
  params: Promise<{ ano: string; materia: string; tema: string }>;
}

export function generateStaticParams() {
  return getInfantilThemes().map(({ ano, materia, tema }) => ({ ano, materia, tema }));
}

export async function generateMetadata({ params }: ThemeRouteProps): Promise<Metadata> {
  const { ano, materia, tema } = await params;
  const theme = getInfantilTheme(ano, materia, tema);
  const year = getInfantilYear(ano);
  const subject = getInfantilSubject(ano, materia);
  if (!theme || !year || !subject) {
    return {};
  }

  return {
    title: `${theme.title} · ${subject.title} ${year.title} — aprovado.xyz`,
    description: `${theme.description} Aulas do ${year.title} alinhadas à habilidade ${theme.bnccCode} da BNCC.`,
    alternates: { canonical: `/infantil/${ano}/${materia}/${tema}` },
  };
}

/**
 * Página do tema (porta): título, descrição e a grade de aulas. Monta o
 * StudyShell — o padrão do site — com o curso FIXO DA ROTA (sem cookie:
 * página estática, porta de busca do Google).
 */
export default async function InfantilThemePage({ params }: ThemeRouteProps) {
  const { ano, materia, tema } = await params;
  const theme = getInfantilTheme(ano, materia, tema);
  const year = getInfantilYear(ano);
  const subject = getInfantilSubject(ano, materia);
  if (!theme || !year || !subject) {
    notFound();
  }

  const themeHref = `/infantil/${ano}/${materia}/${tema}`;
  const availableCount = theme.lessons.filter((lesson) => lesson.status === 'disponivel').length;

  return (
    <StudyShell
      activeNav="trilhas"
      pageTitle={`${theme.title} · ${subject.title} · ${year.title}`}
      pageSubtitle={`Aulas do tema ${theme.title}`}
      breadcrumb={[
        { label: 'App', href: '/dashboard' },
        { label: 'Infantil', href: '/infantil' },
        { label: `${subject.title} ${year.title}`, href: '/infantil' },
        { label: theme.title },
      ]}
      searchPlaceholder="Buscar aula ou tema..."
      course={getCourseOrThrow('infantil')}
      courses={getCourses()}
    >
      <div className="mx-auto w-full max-w-[920px] px-4 py-10 sm:px-6">
      <nav aria-label="Trilha até este tema" className="text-sm text-n-500">
        <Link href="/infantil" className="hover:underline">
          Infantil
        </Link>
        <span aria-hidden="true"> · </span>
        <span>
          {subject.title} · {year.title}
        </span>
      </nav>

      <header className="mt-3">
        <h1 className="font-display text-3xl font-bold text-ink">{theme.title}</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-n-600">{theme.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-pill bg-sap-bg px-3 py-1 font-mono text-xs font-semibold text-sap">
            BNCC {theme.bnccCode}
          </span>
          <span className="rounded-pill bg-n-100 px-3 py-1 text-xs font-semibold text-n-600">
            {theme.lessons.length} aulas ·{' '}
            {availableCount > 0
              ? `${availableCount} ${availableCount === 1 ? 'disponível' : 'disponíveis'}`
              : 'nenhuma disponível ainda'}
          </span>
        </div>
      </header>

      <section aria-label={`Aulas do tema ${theme.title}`} className="mt-8">
        <h2 className="font-display text-xl font-bold text-ink">Aulas</h2>

        <div className="mt-4">
          <ThemeLessons theme={theme} themeHref={themeHref} />
        </div>
      </section>
      </div>
    </StudyShell>
  );
}
