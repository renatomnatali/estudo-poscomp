/** @vitest-environment jsdom */

import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import { StudyShell } from '@/components/study/study-shell';
import { INFANTIL_COURSE } from '@/lib/courses/infantil';
import { POSCOMP_COURSE } from '@/lib/courses/poscomp';
import { getCourses } from '@/lib/courses/registry';

// A nav é derivada de features/studyEntry do curso: renderizamos com os
// cursos REAIS do registry — nada de curso inventado na fixture.
function renderShell(course: typeof POSCOMP_COURSE) {
  render(
    <StudyShell
      activeNav="dashboard"
      pageTitle="Dashboard"
      breadcrumb={['App', 'Dashboard']}
      course={course}
      courses={getCourses()}
    >
      <div>conteudo</div>
    </StudyShell>
  );
}

describe('navegação lateral derivada do curso ativo', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it('POSCOMP expõe a suíte completa com os destinos de cada item', () => {
    // Arrange
    renderShell(POSCOMP_COURSE);

    // Act
    const nav = screen.getByRole('navigation', { name: /menu principal/i });

    // Assert — itens que dependem das features do curso, com as rotas reais.
    expect(within(nav).getByRole('link', { name: /trilhas de estudo/i })).toHaveAttribute(
      'href',
      '/trilhas'
    );
    expect(within(nav).getByRole('link', { name: /flashcards/i })).toHaveAttribute(
      'href',
      '/flashcards'
    );
    expect(within(nav).getByRole('link', { name: /simulado poscomp/i })).toHaveAttribute(
      'href',
      '/simulado'
    );
    expect(within(nav).getByRole('link', { name: /meu progresso/i })).toHaveAttribute(
      'href',
      '/premium'
    );
    expect(within(nav).getByRole('link', { name: /seja premium/i })).toHaveAttribute(
      'href',
      '/premium'
    );
  });

  it('POSCOMP carrega o badge de 25 trilhas do edital e o bloco de progresso geral', () => {
    // Arrange
    renderShell(POSCOMP_COURSE);

    // Act
    const nav = screen.getByRole('navigation', { name: /menu principal/i });
    const trilhas = within(nav).getByRole('link', { name: /trilhas de estudo/i });

    // Assert — dado do catálogo study-data (25 trilhas), não rótulo de layout.
    expect(within(trilhas).getByText('25')).toBeInTheDocument();
    expect(screen.getByText(/progresso geral/i)).toBeInTheDocument();
  });

  it('Infantil oculta os itens da suíte que o curso não tem', () => {
    // Arrange — features.simulado=false e features.flashcards=false.
    renderShell(INFANTIL_COURSE);

    // Act + Assert — sem flashcards/simulado/exercícios/progresso/premium,
    // e sem o bloco de progresso geral (número do catálogo POSCOMP não pode
    // vazar para outro curso).
    expect(screen.queryByRole('link', { name: /flashcards/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /simulado/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /exercícios/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /meu progresso/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /seja premium/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/progresso geral/i)).not.toBeInTheDocument();
  });

  it('Infantil aponta o item de trilhas para a porta de entrada do catálogo infantil', () => {
    // Arrange
    renderShell(INFANTIL_COURSE);

    // Act
    const nav = screen.getByRole('navigation', { name: /menu principal/i });
    const trilhas = within(nav).getByRole('link', { name: /trilha matemática/i });

    // Assert — studyEntry derivado do catálogo (primeiro tema), e o dashboard
    // continua disponível nos dois cursos.
    expect(trilhas).toHaveAttribute('href', '/infantil/5-ano/matematica/fracoes');
    expect(within(nav).getByRole('link', { name: /dashboard/i })).toHaveAttribute(
      'href',
      '/dashboard'
    );
  });
});
