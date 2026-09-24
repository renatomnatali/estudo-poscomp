import { beforeEach, describe, expect, it, vi } from 'vitest';

// cookies() do Next lança fora de escopo de requisição: o store fake é a
// fronteira do framework. O `set` espiado prova o contrato do módulo —
// leitura de curso ativo nunca grava cookie.
const cookieStore = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => cookieStore),
}));

import {
  ACTIVE_COURSE_COOKIE,
  getActiveCourseContext,
  getActiveCourseSlug,
} from '@/lib/active-course';
import { getCourses } from '@/lib/courses/registry';

describe('curso ativo da sessão (cookie aprovado.curso)', () => {
  beforeEach(() => {
    cookieStore.get.mockReset();
    cookieStore.set.mockClear();
  });

  it('assume o curso default quando não há cookie', async () => {
    cookieStore.get.mockReturnValue(undefined);

    // Arrange — usuário sem escolha prévia de curso.
    // Act + Assert — fluxo histórico: área logada 100% POSCOMP.
    await expect(getActiveCourseSlug()).resolves.toBe('poscomp');
  });

  it('devolve o slug válido gravado no cookie', async () => {
    cookieStore.get.mockReturnValue({ value: 'infantil' });

    await expect(getActiveCourseSlug()).resolves.toBe('infantil');
    expect(cookieStore.get).toHaveBeenCalledWith(ACTIVE_COURSE_COOKIE);
  });

  it('nunca propaga slug inválido: cookie lixo cai no curso default', async () => {
    cookieStore.get.mockReturnValue({ value: 'enic' });

    await expect(getActiveCourseSlug()).resolves.toBe('poscomp');
  });

  it('leitura não grava cookie', async () => {
    cookieStore.get.mockReturnValue(undefined);

    await getActiveCourseSlug();

    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it('contexto devolve o curso do cookie junto com todos os cursos do registry', async () => {
    cookieStore.get.mockReturnValue({ value: 'infantil' });

    const context = await getActiveCourseContext();

    expect(context.course.slug).toBe('infantil');
    // O seletor da sidebar precisa da lista inteira, na ordem do registry.
    expect(context.courses.map((course) => course.slug)).toEqual(
      getCourses().map((course) => course.slug),
    );
  });
});
