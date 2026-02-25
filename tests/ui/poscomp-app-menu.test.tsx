/** @vitest-environment jsdom */

import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PoscompApp } from '@/components/poscomp-app';

describe('menu principal da aplicação', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] }),
      })
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('exibe menu lateral com ordem canônica do mockup', () => {
    render(<PoscompApp />);

    const desktopMenu = screen.getByRole('navigation', { name: /menu principal/i });
    const dashboard = within(desktopMenu).getByRole('button', { name: /^dashboard$/i });
    const topics = within(desktopMenu).getByRole('button', { name: /^tópicos$/i });
    const simulator = within(desktopMenu).getByRole('button', { name: /^simulador$/i });
    const flashcards = within(desktopMenu).getByRole('button', { name: /^flashcards$/i });
    const exercises = within(desktopMenu).getByRole('button', { name: /^exercícios$/i });
    const premium = within(desktopMenu).getByRole('button', { name: /^premium$/i });

    const order = [dashboard, topics, simulator, flashcards, exercises, premium].map((item) =>
      item.textContent?.trim()
    );

    expect(order).toEqual(['Dashboard', 'Tópicos', 'Simulador', 'Flashcards', 'Exercícios', 'Premium']);
  });

  it('marca somente um item ativo por vez e troca para exercícios no clique', async () => {
    render(<PoscompApp />);

    const desktopMenu = screen.getByRole('navigation', { name: /menu principal/i });
    const simulator = within(desktopMenu).getByRole('button', { name: /^simulador$/i });
    const exercises = within(desktopMenu).getByRole('button', { name: /^exercícios$/i });

    expect(simulator).toHaveClass('active');
    expect(exercises).not.toHaveClass('active');

    await userEvent.click(exercises);

    expect(exercises).toHaveClass('active');
    expect(simulator).not.toHaveClass('active');
    expect(screen.getByLabelText('Ano')).toBeInTheDocument();
  });

  it('exibe atalhos de menu no mobile', () => {
    render(<PoscompApp />);

    const mobileMenu = screen.getByRole('navigation', { name: /menu mobile/i });

    expect(mobileMenu).toBeInTheDocument();
    expect(within(mobileMenu).getByRole('button', { name: /^dashboard$/i })).toBeInTheDocument();
    expect(within(mobileMenu).getByRole('button', { name: /^tópicos$/i })).toBeInTheDocument();
    expect(within(mobileMenu).getByRole('button', { name: /^simulador$/i })).toBeInTheDocument();
    expect(within(mobileMenu).getByRole('button', { name: /^exercícios$/i })).toBeInTheDocument();
    expect(within(mobileMenu).getByRole('button', { name: /^premium$/i })).toBeInTheDocument();
  });

  it('exibe botões do simulador no primeiro bloco e sem breadcrumb', () => {
    const { container } = render(<PoscompApp />);

    const header = container.querySelector('.page-header');
    expect(header).not.toBeNull();
    expect(header?.querySelector('.breadcrumb')).not.toBeInTheDocument();

    const scoped = within(header as HTMLElement);
    const modeSwitch = header?.querySelector('.sim-mode-switch');

    expect(modeSwitch).toBeInTheDocument();
    expect(scoped.getByRole('button', { name: /^simulador afd$/i })).toBeInTheDocument();
    expect(scoped.getByRole('button', { name: /^minimização$/i })).toBeInTheDocument();
    expect(scoped.getByRole('button', { name: /^afn→afd$/i })).toBeInTheDocument();
    expect(scoped.getByRole('button', { name: /^simulador afd$/i })).toHaveClass('sim-mode-pill', 'is-active');
  });

  it('exibe menu de perfil com ações de configurações e sair', async () => {
    const onSignOut = vi.fn();
    render(
      <PoscompApp
        auth={{
          mode: 'authenticated',
          displayName: 'Renato',
          email: 'renato@example.com',
          onSignOut,
        }}
      />
    );

    const profileButton = screen.getByRole('button', { name: /menu do usuário/i });
    await userEvent.click(profileButton);

    expect(screen.getByRole('menuitem', { name: /configurações/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('menuitem', { name: /sair/i }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });
});
