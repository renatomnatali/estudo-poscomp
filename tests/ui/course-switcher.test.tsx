/** @vitest-environment jsdom */

import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { refreshSpy, setActiveCourseSpy } = vi.hoisted(() => ({
  refreshSpy: vi.fn(),
  setActiveCourseSpy: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshSpy }),
}));

// Server action é a fronteira RPC do client (o 'use server' vira stub de
// rede no bundle): o comportamento REAL de setActiveCourse — validação de
// slug, cookie, revalidate — é coberto em tests/unit/set-active-course.test.ts.
vi.mock('@/app/actions/set-active-course', () => ({
  setActiveCourse: setActiveCourseSpy,
}));

import { CourseSwitcher } from '@/components/study/course-switcher';
import { POSCOMP_COURSE } from '@/lib/courses/poscomp';
import { getCourses } from '@/lib/courses/registry';

function renderSwitcher() {
  // Cursos reais do registry — o menu lista o que existe de verdade.
  render(<CourseSwitcher course={POSCOMP_COURSE} courses={getCourses()} />);
}

async function openMenu() {
  await userEvent.click(screen.getByRole('button', { name: /trocar de curso/i }));
  return screen.getByRole('listbox', { name: /seus cursos/i });
}

describe('seletor de curso da sidebar', () => {
  beforeEach(() => {
    setActiveCourseSpy.mockReset();
    setActiveCourseSpy.mockResolvedValue({ ok: true });
    refreshSpy.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('abre a lista de cursos no clique e marca o curso em estudo como selecionado', async () => {
    // Arrange
    renderSwitcher();
    const trigger = screen.getByRole('button', { name: /trocar de curso/i });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    // Act
    await userEvent.click(trigger);

    // Assert — menu de cursos visível, com o ativo marcado para leitor de tela.
    const menu = screen.getByRole('listbox', { name: /seus cursos/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(within(menu).getByRole('option', { name: /poscomp/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(within(menu).getByRole('option', { name: /infantil/i })).toHaveAttribute(
      'aria-selected',
      'false'
    );
  });

  it('fecha o menu com a tecla Escape', async () => {
    // Arrange
    renderSwitcher();
    await openMenu();

    // Act
    await userEvent.keyboard('{Escape}');

    // Assert
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('fecha o menu ao clicar fora do seletor', async () => {
    // Arrange
    renderSwitcher();
    await openMenu();

    // Act — clique em área fora do componente (mousedown, como o handler escuta).
    fireEvent.mouseDown(document.body);

    // Assert
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('troca de curso: chama a action com o slug escolhido e refresca a página ao confirmar', async () => {
    // Arrange
    renderSwitcher();
    const menu = await openMenu();

    // Act — usuário escolhe o curso Infantil.
    await userEvent.click(within(menu).getByRole('option', { name: /infantil/i }));

    // Assert — a troca pede a gravação do slug certo e o refresh re-renderiza
    // a área logada no novo contexto.
    await waitFor(() => expect(setActiveCourseSpy).toHaveBeenCalledWith('infantil'));
    await waitFor(() => expect(refreshSpy).toHaveBeenCalledTimes(1));
  });

  it('clicar no curso já ativo não dispara troca', async () => {
    // Arrange
    renderSwitcher();
    const menu = await openMenu();

    // Act
    await userEvent.click(within(menu).getByRole('option', { name: /poscomp/i }));
    await act(async () => {});

    // Assert — reabrir o menu no curso atual é navegação, não mutação.
    expect(setActiveCourseSpy).not.toHaveBeenCalled();
    expect(refreshSpy).not.toHaveBeenCalled();
  });

  it('troca recusada pela action (ok: false) não refresca a página', async () => {
    // Arrange — a fronteira recusa (ex.: slug que saiu do registry).
    setActiveCourseSpy.mockResolvedValue({ ok: false });
    renderSwitcher();
    const menu = await openMenu();

    // Act
    await userEvent.click(within(menu).getByRole('option', { name: /infantil/i }));

    // Assert — sem confirmação, a página não refresca com estado velho.
    await waitFor(() => expect(setActiveCourseSpy).toHaveBeenCalledWith('infantil'));
    await act(async () => {});
    expect(refreshSpy).not.toHaveBeenCalled();
  });
});
