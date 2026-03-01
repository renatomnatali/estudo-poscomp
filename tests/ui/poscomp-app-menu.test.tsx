/** @vitest-environment jsdom */

import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { StudyShell } from '@/components/study/study-shell';

describe('shell de estudo com navegação por rotas', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it('exibe menu lateral na ordem canônica do mockup', () => {
    render(
      <StudyShell
        activeNav="dashboard"
        pageTitle="Dashboard"
        pageSubtitle="Resumo"
        breadcrumb={['App', 'Dashboard']}
      >
        <div>conteudo</div>
      </StudyShell>
    );

    const desktopMenu = screen.getByRole('navigation', { name: /menu principal/i });
    const links = within(desktopMenu).getAllByRole('link');
    const labels = links.map((link) => {
      const mainLabel = link.querySelector('.sb-item-text')?.textContent?.trim();
      return mainLabel || link.textContent?.trim();
    });

    expect(labels).toEqual([
      'Dashboard',
      'Trilhas de Estudo',
      'Flashcards',
      'Exercícios',
      'Simulado POSCOMP',
      'Meu Progresso',
      'Seja Premium',
    ]);
  });

  it('destaca item ativo e renderiza breadcrumb clicável com nome completo de trilha e módulo', () => {
    render(
      <StudyShell
        activeNav="trilhas"
        pageTitle="Trilhas"
        pageSubtitle="25 tópicos"
        breadcrumb={[
          { label: 'Trilhas de Estudo', href: '/trilhas' },
          { label: 'Linguagens Formais e Autômatos', href: '/trilhas' },
          { label: 'Módulo 03 — AFN e epsilon-Transicoes' },
        ]}
      >
        <div>conteudo</div>
      </StudyShell>
    );

    const desktopMenu = screen.getByRole('navigation', { name: /menu principal/i });
    const active = within(desktopMenu).getByRole('link', { name: /trilhas de estudo/i });
    const breadcrumb = screen.getByLabelText(/breadcrumb/i);

    expect(active).toHaveClass('active');
    expect(within(breadcrumb).getByRole('link', { name: /trilhas de estudo/i })).toHaveAttribute(
      'href',
      '/trilhas'
    );
    expect(within(breadcrumb).getByRole('link', { name: /linguagens formais e autômatos/i })).toHaveAttribute(
      'href',
      '/trilhas'
    );
    expect(within(breadcrumb).getByText(/módulo 03 — afn e epsilon-transicoes/i)).toBeInTheDocument();
  });

  it('colapsa sidebar no desktop e persiste preferência', async () => {
    render(
      <StudyShell
        activeNav="dashboard"
        pageTitle="Dashboard"
        pageSubtitle="Resumo"
        breadcrumb={['App', 'Dashboard']}
      >
        <div>conteudo</div>
      </StudyShell>
    );

    const sidebar = screen.getByTestId('study-sidebar');
    const toggle = screen.getByRole('button', { name: /alternar menu lateral/i });

    expect(sidebar).not.toHaveClass('collapsed');
    await userEvent.click(toggle);
    expect(sidebar).toHaveClass('collapsed');
    expect(window.localStorage.getItem('study:sidebar')).toBe('collapsed');
  });

  it('abre menu do usuário e aciona sair (logoff)', async () => {
    const onSignOut = vi.fn();

    render(
      <StudyShell
        activeNav="dashboard"
        pageTitle="Dashboard"
        pageSubtitle="Resumo"
        breadcrumb={['App', 'Dashboard']}
        onSignOut={onSignOut}
      >
        <div>conteudo</div>
      </StudyShell>
    );

    const userTrigger = screen.getByRole('button', { name: /menu do usuário/i });
    await userEvent.click(userTrigger);

    expect(screen.getByRole('menuitem', { name: /^perfil$/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /^opções$/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('menuitem', { name: /^sair$/i }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });
});
