import Link from 'next/link';

import type { InfantilTheme } from '@/lib/courses/infantil-catalog';

interface ThemeLessonsProps {
  theme: InfantilTheme;
  /** Rota canônica do tema (/infantil/<ano>/<materia>/<tema>). */
  themeHref: string;
}

/**
 * Grade de aulas de um tema do Infantil — fonte única: renderizada pela
 * página pública do tema e pelo dashboard infantil da área logada.
 */
export function ThemeLessons({ theme, themeHref }: ThemeLessonsProps) {
  const firstAvailableIndex = theme.lessons.findIndex(
    (lesson) => lesson.status === 'disponivel',
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            {/* #007a52 (em-d escurecido) no CTA de entrada: texto pequeno
                sobre branco exige AA ≥4,5:1 — em-d dá 3,65:1. Só a cor muda,
                sem tocar no layout. */}
            <p
              className={`mt-3 text-sm font-semibold ${isEntry ? 'text-[#007a52]' : 'text-sap'}`}
            >
              {isEntry ? 'Começar por aqui →' : 'Continuar →'}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
