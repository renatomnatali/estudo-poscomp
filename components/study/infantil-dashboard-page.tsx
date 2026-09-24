import Link from 'next/link';

import { getInfantilThemes } from '@/lib/courses/infantil-catalog';
import { ThemeLessons } from '@/components/infantil/theme-lessons';

/**
 * Dashboard do curso Infantil (área logada com curso ativo = infantil).
 *
 * Exibe SOMENTE fatos do catálogo (tema, grade de aulas, BNCC): ainda não
 * existe fonte real de progresso por usuário no Infantil — nenhum número
 * de conclusão, XP ou sequência aparece aqui.
 */
export function InfantilDashboardPage() {
  const { theme, subject, year, ano, materia, tema } = getInfantilThemes()[0];
  const themeHref = `/infantil/${ano}/${materia}/${tema}`;
  const availableLessons = theme.lessons.filter(
    (lesson) => lesson.status === 'disponivel' && Boolean(lesson.moduleSlug),
  );
  const entryLesson = availableLessons[0];

  return (
    <div className="flex flex-col gap-4">
      <section className="section-card border-em bg-em-bg">
        <span className="eyebrow eyebrow-aa">
          Infantil · {subject.title} · {year.title}
        </span>
        <h1 className="font-display mt-1 text-2xl font-bold text-ink">
          Oi! Vamos aprender {theme.title.toLowerCase()}? ✏️
        </h1>
        {entryLesson ? (
          <>
            <p className="mt-2 max-w-2xl leading-relaxed text-n-600">
              A primeira aula do tema já está no ar: “{entryLesson.title}”. É grátis,
              tem simuladores para ver cada fatia se mexer e dá para rever quantas
              vezes quiser.
            </p>
            {/* bg #007a52 (não --em-d): branco sobre em-d dá 3,65:1 — reprova
                AA para texto pequeno; sobre #007a52 atinge ~5,4:1. */}
            <Link
              href={`${themeHref}/${entryLesson.slug}`}
              className="mt-4 inline-flex items-center gap-2 rounded-pill bg-[#007a52] px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sap-l)]"
            >
              Começar: {entryLesson.title} →
            </Link>
          </>
        ) : (
          <p className="mt-2 max-w-2xl leading-relaxed text-n-600">{theme.description}</p>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="section-card">
          <span className="text-xs font-bold text-n-500">Tema atual</span>
          <span className="mt-1 block font-display text-xl font-bold text-ink">
            {theme.title}
          </span>
          <span className="mt-1 block text-sm text-n-500">
            {subject.title} · {year.title} · BNCC {theme.bnccCode}
          </span>
        </section>
        <section className="section-card">
          <span className="text-xs font-bold text-n-500">Aulas do tema</span>
          <span className="mt-1 block font-display text-xl font-bold text-ink">
            {theme.lessons.length} no total
          </span>
          <span className="mt-1 block text-sm text-n-500">
            {availableLessons.length > 0
              ? `${availableLessons.length} ${
                  availableLessons.length === 1 ? 'disponível agora' : 'disponíveis agora'
                } · as demais chegam em breve`
              : 'a primeira chega em breve'}
          </span>
        </section>
      </div>

      <section className="section-card">
        <h2 className="font-display text-xl font-bold text-ink">
          Trilha {subject.title} · {year.title} · tema {theme.title}
        </h2>
        <div className="mt-4">
          <ThemeLessons theme={theme} themeHref={themeHref} />
        </div>
      </section>

      <section className="section-card">
        <h2 className="font-display text-xl font-bold text-ink">Para o responsável</h2>
        <p className="mt-2 leading-relaxed text-n-600">
          As aulas deste tema desenvolvem a habilidade <strong>{theme.bnccCode}</strong> da
          BNCC, na trilha de {subject.title} do {year.title}.
        </p>
        <p className="mt-2 leading-relaxed text-n-600">{theme.description}</p>
        {/* #007a52 (em-d escurecido): texto pequeno sobre branco precisa de
            AA ≥4,5:1 — em-d sobre branco dá 3,65:1. */}
        <p className="mt-3 text-sm font-semibold text-[#007a52]">
          Tudo grátis — sem cartão, sem assinatura.
        </p>
      </section>
    </div>
  );
}
