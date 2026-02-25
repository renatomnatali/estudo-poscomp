/** @vitest-environment jsdom */

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

  it('exibe teclado contextual somente após foco e insere símbolo no campo ativo', async () => {
    render(<AfdSimulator />);

    expect(screen.queryByRole('button', { name: 'Σ' })).not.toBeInTheDocument();

    const languageInput = await screen.findByLabelText('Expressão da linguagem');
    await userEvent.click(languageInput);

    fireEvent.change(languageInput, { target: { value: 'L=' } });

    const sigmaButton = await screen.findByRole('button', { name: 'Σ' });
    await userEvent.click(sigmaButton);

    expect(languageInput).toHaveValue('L=Σ');
  });

  it('exibe demos como presets compactos secundários', () => {
    render(<AfdSimulator />);

    const demoC = screen.getByRole('button', { name: /demo-c/i });
    const demoB = screen.getByRole('button', { name: /demo-b/i });
    const demoA = screen.getByRole('button', { name: /demo-a/i });

    expect(demoC).toHaveClass('sim-demo-chip');
    expect(demoB).toHaveClass('sim-demo-chip');
    expect(demoA).toHaveClass('sim-demo-chip');
  });

  it('destaca ação principal e mantém demais ações como secundárias', () => {
    render(<AfdSimulator />);

    const runButton = screen.getByRole('button', { name: 'Executar automático' });
    const stepButton = screen.getByRole('button', { name: 'Próximo passo' });
    const resetButton = screen.getByRole('button', { name: 'Reset' });
    const cancelButton = screen.getByRole('button', { name: 'Cancelar' });

    expect(screen.getAllByRole('button', { name: 'Executar automático' })).toHaveLength(1);

    expect(runButton).toHaveClass('sim-action-btn', 'sim-action-btn-primary');
    expect(stepButton).toHaveClass('sim-action-btn', 'sim-action-btn-secondary');
    expect(resetButton).toHaveClass('sim-action-btn', 'sim-action-btn-tertiary');
    expect(cancelButton).toHaveClass('sim-action-btn', 'sim-action-btn-tertiary');
  });

  it('exibe detalhes técnicos e perguntas didáticas recolhidos por padrão', () => {
    render(<AfdSimulator />);

    const executionSummary = screen.getByText(/detalhes técnicos da execução/i);
    const executionDetails = executionSummary.closest('details');
    expect(executionDetails).not.toBeNull();
    expect(executionDetails).not.toHaveAttribute('open');

    const didacticSummary = screen.getByText(/perguntas didáticas/i);
    const didacticDetails = didacticSummary.closest('details');
    expect(didacticDetails).not.toBeNull();
    expect(didacticDetails).not.toHaveAttribute('open');
  });

  it('exibe stepper mobile e permite trocar etapa ativa', async () => {
    render(<AfdSimulator />);

    const stepper = screen.getByRole('navigation', { name: /etapas do simulador/i });
    const step1 = within(stepper).getByRole('button', { name: /1 configurar/i });
    const step3 = within(stepper).getByRole('button', { name: /3 observar/i });

    expect(step1).toHaveClass('is-active');
    expect(step3).not.toHaveClass('is-active');

    await userEvent.click(step3);

    expect(step3).toHaveClass('is-active');
    expect(step1).not.toHaveClass('is-active');
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
