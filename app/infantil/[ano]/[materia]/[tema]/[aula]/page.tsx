import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { InfantilLessonView } from '@/components/infantil/lesson-view';
import {
  getInfantilAvailableLessons,
  getInfantilLesson,
  getInfantilSubject,
  getInfantilTheme,
  getInfantilYear,
  loadInfantilLessonSource,
} from '@/lib/courses/infantil-catalog';

interface LessonRouteProps {
  params: Promise<{ ano: string; materia: string; tema: string; aula: string }>;
}

export function generateStaticParams() {
  return getInfantilAvailableLessons().map(({ ano, materia, tema, aula }) => ({
    ano,
    materia,
    tema,
    aula,
  }));
}

export async function generateMetadata({ params }: LessonRouteProps): Promise<Metadata> {
  const { ano, materia, tema, aula } = await params;
  const theme = getInfantilTheme(ano, materia, tema);
  const lesson = theme ? getInfantilLesson(theme, aula) : undefined;
  const year = getInfantilYear(ano);
  const subject = getInfantilSubject(ano, materia);
  if (!theme || !lesson || !year || !subject) {
    return {};
  }

  const source = lesson.moduleSlug
    ? await loadInfantilLessonSource(lesson.moduleSlug)
    : null;

  return {
    title: `${lesson.title} | ${theme.title} · ${subject.title} ${year.title}`,
    description: source?.header.subtitle || theme.description,
  };
}

/** Página de uma aula disponível: fragmento ingerido + simuladores React. */
export default async function InfantilLessonPage({ params }: LessonRouteProps) {
  const { ano, materia, tema, aula } = await params;
  const theme = getInfantilTheme(ano, materia, tema);
  const lesson = theme ? getInfantilLesson(theme, aula) : undefined;
  if (!theme || !lesson || lesson.status !== 'disponivel' || !lesson.moduleSlug) {
    notFound();
  }

  const source = await loadInfantilLessonSource(lesson.moduleSlug);
  if (!source) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-[920px] bg-white px-4 py-8 sm:px-6">
      <InfantilLessonView
        source={source}
        themeHref={`/infantil/${ano}/${materia}/${tema}`}
        themeTitle={theme.title}
      />
    </div>
  );
}
