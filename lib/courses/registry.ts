import type { Course } from '@/lib/courses/types';
import { POSCOMP_COURSE } from '@/lib/courses/poscomp';
import { INFANTIL_COURSE } from '@/lib/courses/infantil';

/**
 * Curso assumido quando nenhum slug é informado — cobre o fluxo atual
 * (100% POSCOMP) e ambientes de preview.
 */
export const DEFAULT_COURSE_SLUG = 'poscomp';

const COURSES: Course[] = [POSCOMP_COURSE, INFANTIL_COURSE];

/** Todos os cursos registrados, na ordem de exibição. */
export function getCourses(): Course[] {
  // Cópia rasa: consumidor não reordena nem muta o array do módulo.
  return [...COURSES];
}

/**
 * Busca curso por slug. Nunca lança para slug desconhecido:
 * retorna undefined e deixa o chamador decidir (fallback, 404, etc.).
 */
export function getCourse(slug: string): Course | undefined {
  return COURSES.find((course) => course.slug === slug);
}

/** Para contextos em que curso ausente é erro de programação. */
export function getCourseOrThrow(slug: string): Course {
  const course = getCourse(slug);
  if (!course) {
    throw new Error(
      `Curso desconhecido: "${slug}". Slugs registrados: ${COURSES.map((entry) => entry.slug).join(', ')}.`,
    );
  }
  return course;
}

export function isCourseSlug(slug: string): boolean {
  return COURSES.some((course) => course.slug === slug);
}
