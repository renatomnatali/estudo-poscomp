'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { isCourseSlug } from '@/lib/courses/registry';
import {
  ACTIVE_COURSE_COOKIE,
  ACTIVE_COURSE_MAX_AGE_SECONDS,
} from '@/lib/active-course';

export interface SetActiveCourseResult {
  ok: boolean;
}

/**
 * Troca o curso ativo da área logada (cookie de 1 ano, sameSite lax).
 * Slug inválido NUNCA é gravado: a ação recusa e devolve ok=false.
 */
export async function setActiveCourse(slug: string): Promise<SetActiveCourseResult> {
  if (!isCourseSlug(slug)) {
    return { ok: false };
  }

  const store = await cookies();
  store.set(ACTIVE_COURSE_COOKIE, slug, {
    path: '/',
    maxAge: ACTIVE_COURSE_MAX_AGE_SECONDS,
    sameSite: 'lax',
    // HTTPS-only em produção: preferência de curso não deve trafegar em claro.
    secure: process.env.NODE_ENV === 'production',
  });

  revalidatePath('/dashboard');
  return { ok: true };
}
