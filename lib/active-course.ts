import { cookies } from 'next/headers';

import type { Course } from '@/lib/courses/types';
import {
  DEFAULT_COURSE_SLUG,
  getCourseOrThrow,
  getCourses,
  isCourseSlug,
} from '@/lib/courses/registry';

/**
 * Curso ativo da sessão logada — dimensão que decide qual catálogo a área
 * logada renderiza (nav, dashboard, progresso). Vive em cookie porque é
 * escolha do usuário por navegador, não dado de conta.
 *
 * Server-only na prática: consumido por Server Components e pela server
 * action de troca de curso ('use server' já vira stub RPC no client); o
 * `cookies()` do Next lança fora de escopo de requisição.
 */
export const ACTIVE_COURSE_COOKIE = 'aprovado.curso';

/** Um ano: a escolha de curso é estável, não precisa de sessão curta. */
export const ACTIVE_COURSE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/**
 * Slug do curso ativo. Ausente ou inválido resolve para o curso default
 * (fluxo histórico 100% POSCOMP) — só leitura, nunca grava cookie.
 */
export async function getActiveCourseSlug(): Promise<string> {
  const store = await cookies();
  const slug = store.get(ACTIVE_COURSE_COOKIE)?.value;
  if (!slug || !isCourseSlug(slug)) {
    return DEFAULT_COURSE_SLUG;
  }
  return slug;
}

/**
 * Contexto completo para montar a área logada: curso ativo + todos os
 * cursos (o seletor da sidebar precisa da lista inteira).
 */
export async function getActiveCourseContext(): Promise<{
  course: Course;
  courses: Course[];
}> {
  const course = getCourseOrThrow(await getActiveCourseSlug());
  return { course, courses: getCourses() };
}
