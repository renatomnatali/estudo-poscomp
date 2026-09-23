import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  getInfantilSubject,
  getInfantilTheme,
  getInfantilThemes,
  getInfantilYear,
} from '@/lib/courses/infantil-catalog';

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
    description: `${theme.description} Aulas do 5º ano alinhadas à habilidade ${theme.bnccCode} da BNCC.`,
  };
}

/** Página do tema (porta): título, descrição e a grade de aulas. */
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
  const firstAvailableIndex = theme.lessons.findIndex(
    (lesson) => lesson.status === 'disponivel',
  );

  return (
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

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {theme.lessons.map((lesson, index) => {
            const lessonNumber = index + 1;
            const lessonHref = `${themeHref}/${lesson.slug}`;
            const isAvailable = lesson.status === 'disponivel' && Boolean(lesson.moduleSlug);
            const isEntry = index === firstAvailableIndex;

            if (!isAvailable) {
              return (
                <div
                  key={lesson.slug}
                  aria-disabled="true"
                  className="section-card border-dashed opacity-70"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-n-100 font-mono text-sm font-bold text-n-400">
                      {lessonNumber}
                    </span>
                    <span className="rounded-pill bg-amb-bg px-3 py-1 text-xs font-bold text-amb">
                      Em breve
                    </span>
                  </div>
                  <h3 className="mt-3 leading-snug text-ink">{lesson.title}</h3>
                  <p className="mt-3 text-sm text-n-400">Esta aula ainda está no forno.</p>
                </div>
              );
            }

            return (
              <Link
                key={lesson.slug}
                href={lessonHref}
                className={`section-card block transition hover:-translate-y-0.5 hover:shadow-md ${
                  isEntry ? 'border-em bg-em-bg' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full font-mono text-sm font-bold ${
                      isEntry ? 'bg-em text-white' : 'bg-sap-bg text-sap'
                    }`}
                  >
                    {lessonNumber}
                  </span>
                  <span
                    className={`rounded-pill px-3 py-1 text-xs font-bold ${
                      isEntry ? 'bg-em text-white' : 'bg-sap-bg text-sap'
                    }`}
                  >
                    Disponível
                  </span>
                </div>
                <h3 className="mt-3 leading-snug text-ink">{lesson.title}</h3>
                <p
                  className={`mt-3 text-sm font-semibold ${isEntry ? 'text-em-d' : 'text-sap'}`}
                >
                  {isEntry ? 'Começar por aqui →' : 'Continuar →'}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
