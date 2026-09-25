/** @vitest-environment jsdom */

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PasswordInput } from '@/components/auth/password-input';

afterEach(() => {
  cleanup();
});

describe('PasswordInput', () => {
  it('oculta a senha por padrão e o toggle alterna type + aria-pressed', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <PasswordInput id="senha-teste" label="Senha" value="SenhaForte123" onChange={onChange} />
    );
    const input = screen.getByLabelText(/^senha$/i) as HTMLInputElement;

    // Padrão: oculta, botão marcado como não-acionado.
    expect(input.type).toBe('password');

    const toggle = screen.getByRole('button', { name: /mostrar senha/i });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    // Primeiro clique: revela.
    await user.click(toggle);
    expect(input.type).toBe('text');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    // O nome acessível espelha a nova ação (ocultar).
    expect(screen.getByRole('button', { name: /ocultar senha/i })).toBeInTheDocument();

    // Segundo clique: volta a ocultar.
    await user.click(screen.getByRole('button', { name: /ocultar senha/i }));
    expect(input.type).toBe('password');
    expect(screen.getByRole('button', { name: /mostrar senha/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('repassa digitação ao controller via onChange (campo controlado de verdade)', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    // Wrapper controlado: o PasswordInput é controlado — com value fixo em ''
    // cada tecla reportaria só o último caractere. O controller guarda o valor.
    function CampoControlado() {
      const [valor, setValor] = React.useState('');
      return (
        <PasswordInput
          id="senha-teste"
          label="Senha"
          value={valor}
          onChange={(v) => {
            setValor(v);
            onChange(v);
          }}
        />
      );
    }

    render(<CampoControlado />);
    await user.type(screen.getByLabelText(/^senha$/i), 'A1');

    expect(onChange).toHaveBeenLastCalledWith('A1');
    expect((screen.getByLabelText(/^senha$/i) as HTMLInputElement).value).toBe('A1');
  });
});
