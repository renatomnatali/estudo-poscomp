/** @vitest-environment jsdom */

import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Fronteiras: cliente HTTP (ApiError real) e navegação (router + query string).
const { apiMock, pushMock, navState } = vi.hoisted(() => ({
  apiMock: vi.fn(),
  pushMock: vi.fn(),
  navState: { query: '' },
}));

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return { ...actual, api: apiMock };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(navState.query),
}));

import { ApiError } from '@/lib/api';
import { VerifyEmailClient } from '@/components/auth/verify-email-client';

const TOKEN = 'c'.repeat(64);

beforeEach(() => {
  apiMock.mockReset();
  pushMock.mockReset();
  navState.query = '';
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/** Drena as promises dos efeitos de montagem (consumo do token na abertura). */
async function drenarEfeitos() {
  await act(async () => {});
}

describe('VerifyEmailClient', () => {
  it('com ?token= na URL consome o token via POST /auth/verify-email na abertura', async () => {
    navState.query = `token=${TOKEN}`;
    apiMock.mockResolvedValue({ verified: true });

    render(<VerifyEmailClient />);
    await drenarEfeitos();

    expect(apiMock).toHaveBeenCalledWith(
      '/auth/verify-email',
      expect.objectContaining({ method: 'POST' })
    );
    expect(JSON.parse(apiMock.mock.calls[0][1].body)).toEqual({ token: TOKEN });
  });

  it('token confirmado mostra o estado de sucesso e redireciona para /entrar', async () => {
    vi.useFakeTimers();
    navState.query = `token=${TOKEN}`;
    apiMock.mockResolvedValue({ verified: true });

    render(<VerifyEmailClient />);
    await drenarEfeitos();

    // Card de confirmado com o caminho manual para o login (assert síncrono —
    // os efeitos já drenaram e fake timers congelam o polling do findBy*).
    expect(screen.getByRole('link', { name: /ir para o login/i })).toHaveAttribute(
      'href',
      '/entrar'
    );

    // Redirecionamento automático após 3s.
    expect(pushMock).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(pushMock).toHaveBeenCalledWith('/entrar');
  });

  it('token inválido mostra o estado unificado e oferece reenvio com resposta genérica', async () => {
    navState.query = `token=${TOKEN}`;
    apiMock.mockRejectedValueOnce(new ApiError('Token inválido', 400, undefined, {}));
    apiMock.mockResolvedValueOnce({ message: 'ok' });

    render(<VerifyEmailClient />);
    await drenarEfeitos();

    // Estado unificado (não distingue inválido/expirado/usado) + reenvio.
    const reenvio = await screen.findByRole('button', { name: /reenviar link de verificação/i });

    const user = userEvent.setup({ delay: null });
    await user.type(screen.getByLabelText(/reenviar verificação/i), 'novato@exemplo.com');
    await user.click(reenvio);

    await screen.findByRole('status');
    expect(apiMock).toHaveBeenCalledWith(
      '/auth/resend-verification',
      expect.objectContaining({ method: 'POST' })
    );
    expect(JSON.parse(apiMock.mock.calls[1][1].body)).toEqual({ email: 'novato@exemplo.com' });
  });

  it('sem token na URL nasce direto no estado unificado, sem chamar a API', async () => {
    render(<VerifyEmailClient />);
    await drenarEfeitos();

    expect(
      await screen.findByRole('button', { name: /reenviar link de verificação/i })
    ).toBeInTheDocument();
    expect(apiMock).not.toHaveBeenCalled();
  });
});
