/** @vitest-environment jsdom */

import React, { type ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { authSpy } = vi.hoisted(() => ({
  authSpy: vi.fn(async () => ({ userId: 'user-clerk-1' })),
}));

vi.mock('@/lib/auth-config', () => ({
  isClerkEnabledServer: () => true,
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: authSpy,
}));

vi.mock('@/components/auth/study-route-guard', () => ({
  StudyRouteGuard: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/study/study-shell', () => ({
  StudyShell: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/modules/flashcards-panel', () => ({
  FlashcardsPanel: ({ userId }: { userId?: string }) => (
    <div data-testid="flashcards-user-id">{userId ?? 'undefined'}</div>
  ),
}));

import FlashcardsRoutePage from '@/app/flashcards/page';

describe('rota de flashcards autenticada', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('usa o id do usuário do Clerk ao montar o painel', async () => {
    render(await FlashcardsRoutePage());

    expect(authSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('flashcards-user-id')).toHaveTextContent('user-clerk-1');
  });
});
