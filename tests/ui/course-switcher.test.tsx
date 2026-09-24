/** @vitest-environment jsdom */

import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { refreshSpy, pushSpy, setActiveCourseSpy, navigationState } = vi.hoisted(() => ({
  refreshSpy: vi.fn(),
  pushSpy: vi.fn(),
  setActiveCourseSpy: vi.fn(),
  // Rota atual do usuário: decide refresh (já no dashboard) vs push.
  navigationState: { pathname: '/dashboard' },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshSpy, push: pushSpy }),
  usePathname: () => navigationState.pathname,
}));

// Server action é a fronteira RPC do client (o 'use server' vira stub de
// rede no bundle): o comportamento REAL de setActiveCourse — validação de
// slug, cookie, revalidate — é coberto em tests/unit/set-active-course.test.ts.
vi.mock('@/app/actions/set-active-course', () => ({
  setActiveCourse: setActiveCourseSpy,
}));

import { CourseSwitcher } from '@/components/study/course-switcher';
import { getCourses } from '@/lib/courses/registry';

function renderSwitcher(activeSlug: string = 'poscomp') {
  // Cursos reais do registry — o menu lista o que existe de verdade.
  const courses = getCourses();
  const course = courses.find((entry) => entry.slug === activeSlug);
  if (!course) {
    throw new Error(`Curso desconhecido na fixture do seletor: ${activeSlug}`);
  }
  render(<CourseSwitcher course={course} courses={courses} />);
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
    pushSpy.mockClear();
    navigationState.pathname = '/dashboard';
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

  it('troca de curso já no dashboard: action com o slug certo, refresh e sem push', async () => {
    // Arrange — usuário está na home da área logada.
    renderSwitcher();
    const menu = await openMenu();

    // Act — usuário escolhe o curso Infantil.
    await userEvent.click(within(menu).getByRole('option', { name: /infantil/i }));

    // Assert — grava o slug certo e re-renderiza no novo contexto; já está
    // na home do curso, então não há navegação.
    await waitFor(() => expect(setActiveCourseSpy).toHaveBeenCalledWith('infantil'));
    await waitFor(() => expect(refreshSpy).toHaveBeenCalledTimes(1));
    expect(pushSpy).not.toHaveBeenCalled();
  });

  it('troca de curso fora do dashboard: leva à home do curso com push, sem refresh', async () => {
    // Arrange — usuário numa rota pública do infantil.
    navigationState.pathname = '/infantil/5-ano/matematica/fracoes';
    renderSwitcher();
    const menu = await openMenu();

    // Act
    await userEvent.click(within(menu).getByRole('option', { name: /infantil/i }));

    // Assert — confirmada a troca, a home do curso é a próxima parada.
    await waitFor(() => expect(setActiveCourseSpy).toHaveBeenCalledWith('infantil'));
    await waitFor(() => expect(pushSpy).toHaveBeenCalledWith('/dashboard'));
    expect(refreshSpy).not.toHaveBeenCalled();
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
    expect(pushSpy).not.toHaveBeenCalled();
  });

  it('troca recusada pela action (ok: false) não navega nem refresca', async () => {
    // Arrange — a fronteira recusa (ex.: slug que saiu do registry).
    setActiveCourseSpy.mockResolvedValue({ ok: false });
    renderSwitcher();
    const menu = await openMenu();

    // Act
    await userEvent.click(within(menu).getByRole('option', { name: /infantil/i }));

    // Assert — sem confirmação, nada muda na tela.
    await waitFor(() => expect(setActiveCourseSpy).toHaveBeenCalledWith('infantil'));
    await act(async () => {});
    expect(refreshSpy).not.toHaveBeenCalled();
    expect(pushSpy).not.toHaveBeenCalled();
  });
});

describe('seletor de curso — teclado do listbox (WAI-ARIA)', () => {
  beforeEach(() => {
    setActiveCourseSpy.mockReset();
    setActiveCourseSpy.mockResolvedValue({ ok: true });
    refreshSpy.mockClear();
    pushSpy.mockClear();
    navigationState.pathname = '/dashboard';
  });

  afterEach(() => {
    cleanup();
  });

  it('abre com Enter no gatilho e a primeira seta foca a option do curso em estudo', async () => {
    // Arrange — curso em estudo é o SEGUNDO da lista: prova que a seta
    // parte do curso em estudo, não da primeira option.
    renderSwitcher('infantil');
    const trigger = screen.getByRole('button', { name: /trocar de curso/i });
    trigger.focus();

    // Act — abrir por teclado (ativação nativa de button) e descer.
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('listbox', { name: /seus cursos/i })).toBeInTheDocument();
    expect(trigger).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');

    // Assert
    const menu = screen.getByRole('listbox', { name: /seus cursos/i });
    expect(within(menu).getByRole('option', { name: /infantil/i })).toHaveFocus();
    expect(within(menu).getByRole('option', { name: /poscomp/i })).not.toHaveFocus();
  });

  it('ArrowDown com o menu fechado abre e foca a option do curso em estudo', async () => {
    // Arrange — ativo na segunda posição: o foco pós-abertura prova que
    // parte do curso em estudo, não da primeira option.
    renderSwitcher('infantil');
    screen.getByRole('button', { name: /trocar de curso/i }).focus();

    // Act — o foco é aplicado em efeito após a montagem das options.
    await userEvent.keyboard('{ArrowDown}');
    const menu = await screen.findByRole('listbox', { name: /seus cursos/i });

    // Assert
    const infantil = within(menu).getByRole('option', { name: /infantil/i });
    await waitFor(() => expect(infantil).toHaveFocus());
  });

  it('ArrowUp com o menu fechado abre e foca a option do curso em estudo', async () => {
    // Arrange
    renderSwitcher('infantil');
    screen.getByRole('button', { name: /trocar de curso/i }).focus();

    // Act
    await userEvent.keyboard('{ArrowUp}');
    const menu = await screen.findByRole('listbox', { name: /seus cursos/i });

    // Assert — padrão do listbox colapsável: ↑ também parte do em estudo.
    const infantil = within(menu).getByRole('option', { name: /infantil/i });
    await waitFor(() => expect(infantil).toHaveFocus());
  });

  it('Home e End com o menu fechado abrem focando a primeira e a última option', async () => {
    // Arrange
    renderSwitcher('infantil');
    const trigger = screen.getByRole('button', { name: /trocar de curso/i });
    trigger.focus();

    // Act — End abre na última option.
    await userEvent.keyboard('{End}');
    let menu = await screen.findByRole('listbox', { name: /seus cursos/i });
    const infantil = within(menu).getByRole('option', { name: /infantil/i });
    await waitFor(() => expect(infantil).toHaveFocus());

    // Act — fecha; o usuário volta ao gatilho (o foco não é restaurado
    // automaticamente) e reabre com Home.
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    trigger.focus();
    await userEvent.keyboard('{Home}');
    menu = screen.getByRole('listbox', { name: /seus cursos/i });

    // Assert — primeira option, distinta do curso em estudo.
    const poscomp = within(menu).getByRole('option', { name: /poscomp/i });
    await waitFor(() => expect(poscomp).toHaveFocus());
  });

  it('Tab com o menu fechado não abre o menu', async () => {
    // Arrange
    renderSwitcher();
    screen.getByRole('button', { name: /trocar de curso/i }).focus();

    // Act
    await userEvent.keyboard('{Tab}');
    await act(async () => {});

    // Assert — Tab segue a ordem natural de tabulação: nada abre, nada troca.
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(setActiveCourseSpy).not.toHaveBeenCalled();
  });

  it('ArrowDown e ArrowUp movem o foco entre as options', async () => {
    // Arrange
    renderSwitcher('infantil');
    await openMenu();
    const menu = screen.getByRole('listbox', { name: /seus cursos/i });
    const poscomp = within(menu).getByRole('option', { name: /poscomp/i });
    const infantil = within(menu).getByRole('option', { name: /infantil/i });

    // Act — o foco parte do gatilho: ↓ vai ao curso em estudo, ↑ sobe uma.
    await userEvent.keyboard('{ArrowDown}');
    expect(infantil).toHaveFocus();

    await userEvent.keyboard('{ArrowUp}');

    // Assert
    expect(poscomp).toHaveFocus();
  });

  it('Home e End levam à primeira e à última option', async () => {
    // Arrange
    renderSwitcher('infantil');
    await openMenu();
    const menu = screen.getByRole('listbox', { name: /seus cursos/i });
    const poscomp = within(menu).getByRole('option', { name: /poscomp/i });
    const infantil = within(menu).getByRole('option', { name: /infantil/i });

    // Act
    await userEvent.keyboard('{End}');
    expect(infantil).toHaveFocus();

    await userEvent.keyboard('{Home}');

    // Assert
    expect(poscomp).toHaveFocus();
  });

  it('setas nas extremidades mantêm o foco na option atual', async () => {
    // Arrange
    renderSwitcher('infantil');
    await openMenu();
    const menu = screen.getByRole('listbox', { name: /seus cursos/i });
    const poscomp = within(menu).getByRole('option', { name: /poscomp/i });
    const infantil = within(menu).getByRole('option', { name: /infantil/i });

    // Act — ↓ na última e ↑ na primeira não escapam da lista.
    await userEvent.keyboard('{End}');
    await userEvent.keyboard('{ArrowDown}');
    expect(infantil).toHaveFocus();

    await userEvent.keyboard('{Home}');
    await userEvent.keyboard('{ArrowUp}');

    // Assert
    expect(poscomp).toHaveFocus();
  });

  it('Enter na option focada seleciona o curso', async () => {
    // Arrange
    renderSwitcher();
    await openMenu();
    await userEvent.keyboard('{End}'); // foca a option do Infantil

    // Act — ativação nativa de button.
    await userEvent.keyboard('{Enter}');

    // Assert
    await waitFor(() => expect(setActiveCourseSpy).toHaveBeenCalledWith('infantil'));
  });

  it('Espaço na option focada seleciona o curso', async () => {
    // Arrange
    renderSwitcher();
    await openMenu();
    await userEvent.keyboard('{End}'); // foca a option do Infantil

    // Act — ativação nativa de button.
    await userEvent.keyboard(' ');

    // Assert
    await waitFor(() => expect(setActiveCourseSpy).toHaveBeenCalledWith('infantil'));
  });

  it('Tab com o menu aberto fecha sem selecionar', async () => {
    // Arrange
    renderSwitcher();
    await openMenu();
    await userEvent.keyboard('{End}'); // foca a option do Infantil

    // Act
    await userEvent.keyboard('{Tab}');
    await act(async () => {});

    // Assert — Tab sai do conjunto apenas fechando o menu: sem seleção.
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(setActiveCourseSpy).not.toHaveBeenCalled();
  });

  it('anuncia a troca em andamento (role=status) e retira o aviso ao concluir', async () => {
    // Arrange — fronteira que demora a responder.
    let resolveAction!: (value: { ok: boolean }) => void;
    setActiveCourseSpy.mockImplementation(
      () =>
        new Promise<{ ok: boolean }>((resolve) => {
          resolveAction = resolve;
        })
    );
    renderSwitcher();
    const menu = await openMenu();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    // Act — usuário escolhe o Infantil; a confirmação ainda não veio.
    await userEvent.click(within(menu).getByRole('option', { name: /infantil/i }));
    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument());

    // Act — a fronteira confirma a troca.
    await act(async () => {
      resolveAction({ ok: true });
    });

    // Assert — refresh disparado e o aviso sai do DOM.
    await waitFor(() => expect(refreshSpy).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  });
});
