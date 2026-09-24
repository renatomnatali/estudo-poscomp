/** @vitest-environment jsdom */

import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => '/dashboard',
}));

import { StudyShell } from '@/components/study/study-shell';
import { INFANTIL_COURSE } from '@/lib/courses/infantil';
import { POSCOMP_COURSE } from '@/lib/courses/poscomp';
import { getCourses } from '@/lib/courses/registry';

// A nav varia pelo studyEntry/trackSource do curso: renderizamos com os
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

describe('navegação lateral por curso ativo', () => {
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

    // Assert — itens da suíte com as rotas reais.
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

  it('Infantil mantém o menu completo — é o mesmo site, trocar de curso não esconde seções', () => {
    // Arrange
    renderShell(INFANTIL_COURSE);

    // Act
    const nav = screen.getByRole('navigation', { name: /menu principal/i });

    // Assert — suíte inteira presente também no Infantil, com as rotas reais.
    expect(within(nav).getByRole('link', { name: /flashcards/i })).toHaveAttribute(
      'href',
      '/flashcards'
    );
    expect(within(nav).getByRole('link', { name: /exercícios/i })).toHaveAttribute(
      'href',
      '/premium'
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

  it('Infantil não carrega o badge do edital nem o bloco de progresso geral do POSCOMP', () => {
    // Arrange — catálogo próprio (trackSource future-registry): números do
    // study-data não podem vazar para outro curso.
    renderShell(INFANTIL_COURSE);

    // Act
    const nav = screen.getByRole('navigation', { name: /menu principal/i });
    const trilhas = within(nav).getByRole('link', { name: /trilha matemática/i });

    // Assert
    expect(within(trilhas).queryByText('25')).not.toBeInTheDocument();
    expect(screen.queryByText(/progresso geral/i)).not.toBeInTheDocument();
  });
});
