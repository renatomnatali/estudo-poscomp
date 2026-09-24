/** @vitest-environment jsdom */

import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { apiMock, pushMock } = vi.hoisted(() => ({
  apiMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return { ...actual, api: apiMock };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

import { ApiError } from '@/lib/api';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

const SENHA = 'NovaSenhaForte1';

async function preencherSenhas(
  user: ReturnType<typeof userEvent.setup>,
  senha: string,
  confirmacao: string
) {
  await user.type(screen.getByLabelText(/^nova senha/i), senha);
  await user.type(screen.getByLabelText(/^confirmar nova senha/i), confirmacao);
}

beforeEach(() => {
  apiMock.mockReset();
  pushMock.mockReset();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('ResetPasswordForm', () => {
  it('senhas que não coincidem mostram alerta vivo SEM chamar a API', async () => {
    const user = userEvent.setup();

    render(<ResetPasswordForm token={'d'.repeat(64)} />);
    await preencherSenhas(user, SENHA, 'Diferente123');

    // O alerta de coincidência aparece ao digitar (feedback vivo).
    expect(await screen.findByRole('alert')).toHaveTextContent(/não coincidem/i);

    await user.click(screen.getByRole('button', { name: /criar nova senha/i }));
    expect(apiMock).not.toHaveBeenCalled();
  });

  it('sucesso troca o form pelo card e redireciona para /entrar', async () => {
    // fireEvent em vez de user-event: o delay interno do user-event trava
    // sob fake timers, e o redirecionamento de 3s precisa deles para não
    // esperar tempo real. O fluxo observado é o mesmo: valores + submit.
    vi.useFakeTimers();
    apiMock.mockResolvedValue({ ok: true });

    render(<ResetPasswordForm token={'d'.repeat(64)} />);
    fireEvent.change(screen.getByLabelText(/^nova senha/i), { target: { value: SENHA } });
    fireEvent.change(screen.getByLabelText(/^confirmar nova senha/i), { target: { value: SENHA } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /criar nova senha/i }));
    });

    // Card de sucesso (o token virou senha nova; sessões antigas morreram).
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /criar nova senha/i })).not.toBeInTheDocument();

    expect(pushMock).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(pushMock).toHaveBeenCalledWith('/entrar');
  });

  it('400 de token mostra o estado de link inválido do mockup', async () => {
    apiMock.mockRejectedValue(new ApiError('Token expirado. Solicite um novo link.', 400, undefined, {}));
    const user = userEvent.setup();

    render(<ResetPasswordForm token={'d'.repeat(64)} />);
    await preencherSenhas(user, SENHA, SENHA);
    await user.click(screen.getByRole('button', { name: /criar nova senha/i }));

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent(/não é mais válido/i);
    // Form permanece para copiar/abrir um novo link.
    expect(screen.getByRole('button', { name: /criar nova senha/i })).toBeInTheDocument();
  });

  it('senha fora da política é barrada no cliente, sem chamar a API', async () => {
    const user = userEvent.setup();

    render(<ResetPasswordForm token={'d'.repeat(64)} />);
    await preencherSenhas(user, 'curta', 'curta');
    await user.click(screen.getByRole('button', { name: /criar nova senha/i }));

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent(/entre 8 e 128 caracteres/i);
    expect(apiMock).not.toHaveBeenCalled();
  });
});
