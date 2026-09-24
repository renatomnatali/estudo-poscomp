/** @vitest-environment jsdom */

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { apiMock, turnstileResetMock } = vi.hoisted(() => ({
  apiMock: vi.fn(),
  turnstileResetMock: vi.fn(),
}));

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return { ...actual, api: apiMock };
});

vi.mock('@/components/auth/turnstile-widget', async () => {
  const React = await import('react');
  return {
    TurnstileWidget: React.forwardRef(function TurnstileStub(
      _props: unknown,
      ref: React.Ref<unknown>,
    ) {
      React.useImperativeHandle(ref, () => ({ reset: turnstileResetMock }), []);
      return null;
    }),
  };
});

vi.hoisted(() => {
  delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
});

import { ApiError } from '@/lib/api';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

beforeEach(() => {
  apiMock.mockReset();
  turnstileResetMock.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('ForgotPasswordForm', () => {
  it('submete o e-mail para POST /auth/forgot-password e troca o form pelo card genérico', async () => {
    // A resposta é genérica por desenho (anti-enumeração): qualquer 200 leva
    // ao mesmo card — o que se prova aqui é o envio e o desfecho único.
    apiMock.mockResolvedValue({ message: 'Se o e-mail estiver cadastrado, enviaremos um link.' });
    const user = userEvent.setup();

    render(<ForgotPasswordForm />);
    await user.type(screen.getByLabelText(/e-mail/i), 'aluno@exemplo.com');
    await user.click(screen.getByRole('button', { name: /enviar link de redefinição/i }));

    expect(apiMock).toHaveBeenCalledWith(
      '/auth/forgot-password',
      expect.objectContaining({ method: 'POST' })
    );
    const corpo = JSON.parse(apiMock.mock.calls[0][1].body);
    expect(corpo).toMatchObject({ email: 'aluno@exemplo.com' });

    // Card de resultado substitui o formulário — com o e-mail como dado.
    const card = await screen.findByRole('status');
    expect(card).toHaveTextContent('aluno@exemplo.com');
    expect(
      screen.queryByRole('button', { name: /enviar link de redefinição/i })
    ).not.toBeInTheDocument();
  });

  it('erro de API mantém o formulário e reseta o Turnstile', async () => {
    apiMock.mockRejectedValue(
      new ApiError('Muitas tentativas. Aguarde um momento.', 429, undefined, {})
    );
    const user = userEvent.setup();

    render(<ForgotPasswordForm />);
    await user.type(screen.getByLabelText(/e-mail/i), 'aluno@exemplo.com');
    await user.click(screen.getByRole('button', { name: /enviar link de redefinição/i }));

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent(/muitas tentativas/i);
    expect(turnstileResetMock).toHaveBeenCalledTimes(1);
    // O form segue disponível para quando a janela de limite abrir.
    expect(
      screen.getByRole('button', { name: /enviar link de redefinição/i })
    ).toBeInTheDocument();
  });
});
