/** @vitest-environment jsdom */

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AfdSimulator } from '@/components/modules/afd-simulator';

describe('AfdSimulator', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      return setTimeout(() => callback(0), 0) as unknown as number;
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('insere símbolo no campo ativo via teclado clicável', async () => {
    render(<AfdSimulator />);

    const languageInput = await screen.findByLabelText('Expressão da linguagem');
    await userEvent.click(languageInput);
    fireEvent.change(languageInput, { target: { value: 'L=' } });

    const sigmaButton = screen.getByRole('button', { name: 'Σ' });
    await userEvent.click(sigmaButton);

    expect(languageInput).toHaveValue('L=Σ');
  });

  it('não exibe bloco de registro de execução', () => {
    render(<AfdSimulator />);

    expect(screen.queryByRole('heading', { name: /registro de execução/i })).not.toBeInTheDocument();
  });

  it('troca demos e volta status para queued', async () => {
    render(<AfdSimulator />);

    const languageInput = await screen.findByLabelText('Expressão da linguagem');
    const wordInput = await screen.findByLabelText('Palavra de entrada');

    const demoBTitle = screen.getByText('demo-b');
    await userEvent.click(demoBTitle.closest('button')!);

    await waitFor(() => {
      expect(languageInput).toHaveValue('L={a,c}*{b}');
    });
    expect(wordInput).toHaveValue('acccb');
    expect(screen.getAllByText('queued').length).toBeGreaterThan(0);
  });

  it('destaca aresta e célula delta no passo ativo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'completed',
          result: 'ACEITA',
          finalState: 'e2',
          trace: [
            { stepIndex: 1, fromState: 'e1', symbol: 'a', toState: 'e1' },
            { stepIndex: 2, fromState: 'e1', symbol: 'b', toState: 'e1' },
          ],
        }),
      })
    );

    const { container } = render(<AfdSimulator />);

    await screen.findByLabelText('Palavra de entrada');
    await userEvent.click(screen.getAllByRole('button', { name: 'Próximo passo' })[0]);

    await waitFor(() => {
      expect(container.querySelector('[data-afd-edge="e1-loop"]')).toHaveClass('is-active');
      expect(container.querySelector('[data-afd-state="e1"]')).toHaveClass('is-active');
      expect(container.querySelector('[data-afd-cell="e1-a"]')).toHaveClass('is-active');
    });
  });
});
