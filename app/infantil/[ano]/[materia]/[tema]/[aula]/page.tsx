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
import { getCourseOrThrow, getCourses } from '@/lib/courses/registry';
import { StudyShell } from '@/components/study/study-shell';

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
  if (!theme || !lesson || !lesson.moduleSlug || !year || !subject) {
    // aula em-breve (sem moduleSlug) devolve 404 na page — metadata vazia
    // por simetria, nada de title/description órfãos numa página que não existe
    return {};
  }

  const source = lesson.moduleSlug
    ? await loadInfantilLessonSource(lesson.moduleSlug)
    : null;

  return {
    title: `${lesson.title} | ${theme.title} · ${subject.title} ${year.title}`,
    description: source?.header.subtitle || theme.description,
    alternates: { canonical: `/infantil/${ano}/${materia}/${tema}/${aula}` },
  };
}

/**
 * Página de uma aula disponível: fragmento ingerido + simuladores React.
 * Monta o StudyShell no modo de aula — o mesmo da rota de módulo do
 * POSCOMP (/trilhas/f6/[moduleSlug]) — com o curso FIXO DA ROTA (sem
 * cookie: página estática).
 */
export default async function InfantilLessonPage({ params }: LessonRouteProps) {
  const { ano, materia, tema, aula } = await params;
  const theme = getInfantilTheme(ano, materia, tema);
  const lesson = theme ? getInfantilLesson(theme, aula) : undefined;
  const year = getInfantilYear(ano);
  const subject = getInfantilSubject(ano, materia);
  if (!theme || !year || !subject || !lesson || lesson.status !== 'disponivel' || !lesson.moduleSlug) {
    notFound();
  }

  const source = await loadInfantilLessonSource(lesson.moduleSlug);
  if (!source) {
    notFound();
  }

  return (
    <StudyShell
      activeNav="trilhas"
      pageTitle={lesson.title}
      pageSubtitle={source.header.subtitle || theme.description}
      breadcrumb={[
        { label: 'App', href: '/dashboard' },
        { label: 'Infantil', href: '/infantil' },
        { label: `${subject.title} ${year.title}`, href: '/infantil' },
        { label: theme.title, href: `/infantil/${ano}/${materia}/${tema}` },
        { label: lesson.title },
      ]}
      topbarMode="lesson"
      contentMode="flush"
      mainVariant="lesson"
      searchPlaceholder={null}
      course={getCourseOrThrow('infantil')}
      courses={getCourses()}
    >
      <div className="mx-auto w-full max-w-[920px] bg-white px-4 py-8 sm:px-6">
        <InfantilLessonView
          source={source}
          themeHref={`/infantil/${ano}/${materia}/${tema}`}
          themeTitle={theme.title}
        />
      </div>
    </StudyShell>
  );
}
