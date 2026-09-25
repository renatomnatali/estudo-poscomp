/** @vitest-environment jsdom */

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Fronteiras mockadas: o cliente HTTP (@/lib/api — ApiError permanece REAL
// para os instanceof do componente), a navegação (next/navigation) e o
// widget do Turnstile (fronteira Cloudflare — o reset é o observável).
const { apiMock, pushMock, turnstileResetMock } = vi.hoisted(() => ({
  apiMock: vi.fn(),
  pushMock: vi.fn(),
  turnstileResetMock: vi.fn(),
}));

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return { ...actual, api: apiMock };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

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
    // Preparação para o import único do form (hoje ele lê process.env
    // direto): o valor aqui não afeta os asserts.
    siteKeyPresent: true,
  };
});

vi.hoisted(() => {
  // Sem site key o form não bloqueia o submit (comportamento de dev).
  delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
});

import { ApiError } from '@/lib/api';
import { LoginForm } from '@/components/auth/login-form';

function erroDeApi(status: number, body: Record<string, unknown>) {
  return new ApiError(String(body.error ?? 'erro'), status, body.code as string | undefined, body);
}

beforeEach(() => {
  apiMock.mockReset();
  pushMock.mockReset();
  turnstileResetMock.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('LoginForm', () => {
  it('submete e-mail e senha para POST /auth/login', async () => {
    apiMock.mockResolvedValue({ ok: true, user: { id: 'u-1' } });
    const user = userEvent.setup();

    render(<LoginForm />);
    await user.type(screen.getByLabelText(/e-mail/i), 'aluno@exemplo.com');
    await user.type(screen.getByLabelText(/^senha/i), 'SenhaForte123');
    await user.click(screen.getByRole('button', { name: /^entrar$/i }));

    expect(apiMock).toHaveBeenCalledWith(
      '/auth/login',
      expect.objectContaining({ method: 'POST' })
    );
    const corpo = JSON.parse(apiMock.mock.calls[0][1].body);
    expect(corpo).toEqual({ email: 'aluno@exemplo.com', password: 'SenhaForte123', turnstileToken: '' });
  });

  it('mostra erro em role=alert e reseta o Turnstile no 401 (token é single-use)', async () => {
    apiMock.mockRejectedValue(erroDeApi(401, { error: 'Credenciais inválidas' }));
    const user = userEvent.setup();

    render(<LoginForm />);
    await user.type(screen.getByLabelText(/e-mail/i), 'aluno@exemplo.com');
    await user.type(screen.getByLabelText(/^senha/i), 'SenhaErrada1');
    await user.click(screen.getByRole('button', { name: /^entrar$/i }));

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent(/credenciais inválidas/i);
    // Token do Turnstile foi consumido pelo backend: o widget renova para a
    // próxima tentativa não cair em 403 (timeout-or-duplicate).
    expect(turnstileResetMock).toHaveBeenCalledTimes(1);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('no 403 EMAIL_NOT_VERIFIED oferece reenvio que chama POST /auth/resend-verification', async () => {
    apiMock.mockRejectedValueOnce(
      erroDeApi(403, { error: 'Seu e-mail ainda não foi verificado.', code: 'EMAIL_NOT_VERIFIED' })
    );
    apiMock.mockResolvedValueOnce({ message: 'ok' });
    const user = userEvent.setup();

    render(<LoginForm />);
    await user.type(screen.getByLabelText(/e-mail/i), 'aluno@exemplo.com');
    await user.type(screen.getByLabelText(/^senha/i), 'SenhaForte123');
    await user.click(screen.getByRole('button', { name: /^entrar$/i }));

    const reenviar = await screen.findByRole('button', { name: /reenviar e-mail de verificação/i });
    await user.click(reenviar);

    expect(apiMock).toHaveBeenCalledWith(
      '/auth/resend-verification',
      expect.objectContaining({ method: 'POST' })
    );
    const corpo = JSON.parse(apiMock.mock.calls[1][1].body);
    expect(corpo).toEqual({ email: 'aluno@exemplo.com' });
  });

  it('no 429 mostra o estado de limite com a mensagem do backend', async () => {
    apiMock.mockRejectedValue(erroDeApi(429, { error: 'Muitas tentativas. Aguarde um momento.' }));
    const user = userEvent.setup();

    render(<LoginForm />);
    await user.type(screen.getByLabelText(/e-mail/i), 'aluno@exemplo.com');
    await user.type(screen.getByLabelText(/^senha/i), 'SenhaForte123');
    await user.click(screen.getByRole('button', { name: /^entrar$/i }));

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent(/muitas tentativas/i);
    expect(turnstileResetMock).toHaveBeenCalledTimes(1);
  });

  it('no sucesso navega para o dashboard', async () => {
    apiMock.mockResolvedValue({ ok: true, user: { id: 'u-1' } });
    const user = userEvent.setup();

    render(<LoginForm />);
    await user.type(screen.getByLabelText(/e-mail/i), 'aluno@exemplo.com');
    await user.type(screen.getByLabelText(/^senha/i), 'SenhaForte123');
    await user.click(screen.getByRole('button', { name: /^entrar$/i }));

    await screen.findByRole('button', { name: /^entrar$/i });
    expect(pushMock).toHaveBeenCalledWith('/dashboard');
  });
});
