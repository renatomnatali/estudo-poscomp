/** @vitest-environment jsdom */

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { apiMock, turnstileResetMock } = vi.hoisted(() => ({
  apiMock: vi.fn(),
  turnstileResetMock: vi.fn(),
}));

// Fronteiras: cliente HTTP (ApiError real), widget Turnstile (Cloudflare).
// O componente não usa router — os desfechos trocam o formulário por cards.
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
    // Preparação para o import único do form (hoje ele lê process.env
    // direto): o valor aqui não afeta os asserts.
    siteKeyPresent: true,
  };
});

vi.hoisted(() => {
  delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
});

import { ApiError } from '@/lib/api';
import { RegisterForm } from '@/components/auth/register-form';

beforeEach(() => {
  apiMock.mockReset();
  turnstileResetMock.mockReset();
});

afterEach(() => {
  cleanup();
});

async function preencherCadastro(user: ReturnType<typeof userEvent.setup>, senha: string) {
  await user.type(screen.getByLabelText(/e-mail/i), 'novato@exemplo.com');
  await user.type(screen.getByLabelText(/^senha/i), senha);
}

describe('RegisterForm', () => {
  it('senha fora da política é barrada no cliente, sem chamar a API', async () => {
    const user = userEvent.setup();

    render(<RegisterForm />);
    await preencherCadastro(user, 'curta');
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    const alerta = await screen.findByRole('alert');
    // Mensagem unificada da lib de política — contrato funcional pinado.
    expect(alerta).toHaveTextContent(/entre 8 e 128 caracteres/i);
    expect(apiMock).not.toHaveBeenCalled();
  });

  it('sucesso verify_email troca o form pelo card de confirmação com o e-mail digitado', async () => {
    apiMock.mockResolvedValue({ outcome: 'verify_email' });
    const user = userEvent.setup();

    render(<RegisterForm />);
    await preencherCadastro(user, 'SenhaForte123');
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    const card = await screen.findByRole('status');
    // O dado que importa pro usuário: para ONDE o link foi enviado.
    expect(card).toHaveTextContent('novato@exemplo.com');
    // E o caminho para o login (o cadastro não loga sozinho).
    expect(screen.getByRole('link', { name: /ir para o login/i })).toHaveAttribute('href', '/entrar');
    expect(screen.queryByRole('button', { name: /criar conta/i })).not.toBeInTheDocument();
  });

  it('already_registered troca o form pelo card de conta existente com caminho pro login', async () => {
    apiMock.mockResolvedValue({ outcome: 'already_registered' });
    const user = userEvent.setup();

    render(<RegisterForm />);
    await preencherCadastro(user, 'SenhaForte123');
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    const card = await screen.findByRole('status');
    expect(card).toHaveTextContent('novato@exemplo.com');
    expect(screen.getByRole('link', { name: /^entrar$/i })).toHaveAttribute('href', '/entrar');
    // Quem esqueceu a senha tem caminho direto na tela.
    expect(screen.getByRole('link', { name: /esqueci minha senha/i })).toHaveAttribute(
      'href',
      '/esqueci-senha'
    );
  });

  it('erro de API reseta o Turnstile para a próxima tentativa', async () => {
    apiMock.mockRejectedValue(
      new ApiError('Verificação de segurança falhou. Recarregue a página.', 403, undefined, {})
    );
    const user = userEvent.setup();

    render(<RegisterForm />);
    await preencherCadastro(user, 'SenhaForte123');
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    await screen.findByRole('alert');
    expect(turnstileResetMock).toHaveBeenCalledTimes(1);
    // O form continua na tela para nova tentativa.
    expect(screen.getByRole('button', { name: /criar conta/i })).toBeInTheDocument();
  });

  it('os chips de requisitos acendem conforme a senha satisfaz a política', async () => {
    const user = userEvent.setup();

    render(<RegisterForm />);
    const chips = () => screen.getAllByRole('listitem');

    await user.type(screen.getByLabelText(/^senha/i), 'a');
    expect(chips().every((chip) => chip.className.includes('ok'))).toBe(false);

    await user.type(screen.getByLabelText(/^senha/i), 'B1');
    // 'aB1' satisfaz comprimento mínimo? Não (3 chars). Chips ainda apagados.
    expect(chips().every((chip) => chip.className.includes('ok'))).toBe(false);

    await user.type(screen.getByLabelText(/^senha/i), 'cdefghij');
    // 'aB1cdefghij' (10 chars) satisfaz as 4 regras.
    expect(chips().every((chip) => chip.className.includes('ok'))).toBe(true);
  });
});
