import type { Metadata } from 'next';
import Link from 'next/link';

import { INFANTIL_CATALOG } from '@/lib/courses/infantil-catalog';
import { getCourseOrThrow, getCourses } from '@/lib/courses/registry';
import { StudyShell } from '@/components/study/study-shell';

export const metadata: Metadata = {
  alternates: { canonical: '/infantil' },
  title: 'Infantil · matemática do 5º ano — aprovado.xyz',
  description:
    'Aulas gratuitas de matemática para o 5º ano do ensino fundamental, com simuladores interativos para ver cada fração se mexer. Sem cadastro, sem cartão.',
};

/**
 * Índice do curso infantil: ano → matéria → tema (porta de navegação/SEO).
 * Monta o StudyShell — o padrão do site — com o curso FIXO DA ROTA
 * (sem cookie: página estática, porta de busca do Google).
 */
export default function InfantilIndexPage() {
  const course = getCourseOrThrow('infantil');

  return (
    <StudyShell
      activeNav="trilhas"
      pageTitle="Infantil"
      pageSubtitle="Índice do curso: ano, matéria e temas"
      breadcrumb={['App', 'Infantil']}
      searchPlaceholder="Buscar aula ou tema..."
      course={course}
      courses={getCourses()}
    >
      <div className="mx-auto w-full max-w-[920px] px-4 py-10 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-widest text-em">Curso gratuito</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">{course.name}</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-n-600">{course.description}</p>

      {INFANTIL_CATALOG.map((year) => (
        <section key={year.slug} aria-labelledby={`ano-${year.slug}`} className="mt-10">
          <h2 id={`ano-${year.slug}`} className="font-display text-xl font-bold text-ink">
            {year.title}
          </h2>

          {year.subjects.map((subject) => (
            <div key={subject.slug} className="mt-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-n-500">
                {subject.title}
              </h3>

              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {subject.themes.map((theme) => {
                  const available = theme.lessons.filter(
                    (lesson) => lesson.status === 'disponivel',
                  ).length;
                  return (
                    <Link
                      key={theme.slug}
                      href={`/infantil/${year.slug}/${subject.slug}/${theme.slug}`}
                      className="section-card block transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <h4 className="font-display text-lg font-bold text-ink">{theme.title}</h4>
                      <p className="mt-1 text-sm leading-relaxed text-n-600">{theme.description}</p>
                      <p className="mt-3 text-sm font-semibold text-sap">
                        {available} de {theme.lessons.length} aulas disponíveis →
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      ))}
      </div>
    </StudyShell>
  );
}
