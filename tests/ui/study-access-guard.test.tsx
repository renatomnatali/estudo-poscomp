/** @vitest-environment jsdom */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StudyAccessGuard } from '@/components/auth/study-access-guard';

describe('bloqueio de acesso da rota /estudo', () => {
  it('exibe aviso de acesso restrito com ações de autenticação', () => {
    render(<StudyAccessGuard />);

    expect(screen.getByRole('heading', { name: /acesso restrito/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^entrar$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /criar conta/i })).toBeInTheDocument();
  });
});
