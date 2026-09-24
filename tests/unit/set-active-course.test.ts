import { beforeEach, describe, expect, it, vi } from 'vitest';

// Fronteiras do framework mockadas: cookies() (escopo de escrita) e
// revalidatePath (cache do App Router). A regra de validação (isCourseSlug)
// e os atributos do cookie rodam reais.
const cookieStore = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => cookieStore),
}));

const revalidatePathSpy = vi.hoisted(() => vi.fn());

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathSpy,
}));

import { setActiveCourse } from '@/app/actions/set-active-course';

describe('server action de troca de curso ativo', () => {
  beforeEach(() => {
    cookieStore.set.mockClear();
    revalidatePathSpy.mockClear();
  });

  it('recusa slug inválido sem gravar cookie nem revalidar', async () => {
    // Arrange — payload malformado na fronteira da action.

    // Act
    const result = await setActiveCourse('enic');

    // Assert — slug inválido NUNCA é gravado.
    expect(result).toEqual({ ok: false });
    expect(cookieStore.set).not.toHaveBeenCalled();
    expect(revalidatePathSpy).not.toHaveBeenCalled();
  });

  it('grava cookie de 1 ano na raiz e revalida o dashboard', async () => {
    const result = await setActiveCourse('infantil');

    expect(result).toEqual({ ok: true });
    // Contrato do cookie: vale no site inteiro, por 1 ano (escolha estável
    // de curso), sameSite lax (dimensão de navegação, não token de CSRF).
    expect(cookieStore.set).toHaveBeenCalledWith('aprovado.curso', 'infantil', {
      path: '/',
      maxAge: 31536000, // 60 * 60 * 24 * 365
      sameSite: 'lax',
    });
    expect(revalidatePathSpy).toHaveBeenCalledWith('/dashboard');
  });
});
