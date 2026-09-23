/** @vitest-environment jsdom */

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MmcSimulator } from '@/components/infantil/simulators/mmc-simulator';

/** Múltiplos listados na fileira "Múltiplos de N:" — o dado que o aluno vê. */
function fileira(label: RegExp): number[] {
  const row = screen.getByText(label).closest('.frac-row') as HTMLElement | null;
  if (!row) throw new Error(`fileira não encontrada: ${String(label)}`);
  return Array.from(row.querySelectorAll('.frac-cell')).map((cell) => Number(cell.textContent));
}

function status(): string {
  return (document.querySelector('.sim-status') as HTMLElement | null)?.textContent ?? '';
}

function clickar(vezes: number, botao: RegExp): void {
  for (let i = 0; i < vezes; i++) {
    fireEvent.click(screen.getByRole('button', { name: botao }));
  }
}

/**
 * Avanço do relógio em atos encadeados: cada salto dá a chance ao React de
 * reagendar o próximo passo do ▶ antes da janela seguinte (um único avanço
 * grande não executa o encadeamento).
 */
function avancarTempo(totalMs: number, saltoMs: number): void {
  let restante = totalMs;
  while (restante > 0) {
    const salto = Math.min(saltoMs, restante);
    act(() => {
      vi.advanceTimersByTime(salto);
    });
    restante -= salto;
  }
}

describe('MmcSimulator — descobrindo o MMC', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('oferece os controles ▶ Executar tudo, ⏮ Anterior, ⏭ Próximo e ↺ Reiniciar', () => {
    render(<MmcSimulator />);

    expect(screen.getAllByRole('button', { name: /executar tudo/i })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /anterior/i })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /próximo/i })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /reiniciar/i })).toHaveLength(1);
  });

  it('⏭ adiciona múltiplos alternando as fileiras até o primeiro comum, que vira o MMC', () => {
    render(<MmcSimulator />);

    expect(fileira(/múltiplos de 4:/i)).toEqual([]);
    expect(fileira(/múltiplos de 6:/i)).toEqual([]);

    clickar(5, /próximo/i);

    // A fileira cresce de quem está atrasada: 4,8,12 contra 6,12 — o 12 é o
    // primeiro múltiplo comum e aparece nas duas fileiras.
    expect(fileira(/múltiplos de 4:/i)).toEqual([4, 8, 12]);
    expect(fileira(/múltiplos de 6:/i)).toEqual([6, 12]);

    // O status confirma o valor do MMC — dado calculado, não microcopy.
    expect(status()).toMatch(/MMC\(4, 6\) = 12/);
  });

  it('▶ Executar tudo encadeia os passos sozinho até o MMC aparecer', () => {
    render(<MmcSimulator />);

    fireEvent.click(screen.getByRole('button', { name: /executar tudo/i }));
    avancarTempo(350 * 8, 350);

    expect(status()).toMatch(/MMC\(4, 6\) = 12/);
    expect(fileira(/múltiplos de 4:/i)).toEqual([4, 8, 12]);
    // Terminou: ▶ fica indisponível (não há mais nada para executar).
    expect(screen.getByRole('button', { name: /executar tudo/i })).toBeDisabled();
  });

  it('⏮ volta exatamente um passo (o último múltiplo adicionado sai da fileira)', () => {
    render(<MmcSimulator />);

    clickar(3, /próximo/i);
    expect(fileira(/múltiplos de 4:/i)).toEqual([4, 8]);
    expect(fileira(/múltiplos de 6:/i)).toEqual([6]);

    fireEvent.click(screen.getByRole('button', { name: /anterior/i }));

    expect(fileira(/múltiplos de 4:/i)).toEqual([4]);
    expect(fileira(/múltiplos de 6:/i)).toEqual([6]);
  });

  it('↺ Reiniciar esvazia as fileiras e volta ao estado inicial', () => {
    render(<MmcSimulator />);

    clickar(3, /próximo/i);
    fireEvent.click(screen.getByRole('button', { name: /reiniciar/i }));

    expect(fileira(/múltiplos de 4:/i)).toEqual([]);
    expect(fileira(/múltiplos de 6:/i)).toEqual([]);
    expect(status()).toMatch(/próximo/i);
  });

  it('preset "6 e 8" troca os números da exploração e o MMC recalcula para 24', () => {
    render(<MmcSimulator />);

    fireEvent.click(screen.getByRole('button', { name: '6 e 8' }));

    // A troca de preset também zera a exploração anterior.
    expect(fileira(/múltiplos de 6:/i)).toEqual([]);
    expect(fileira(/múltiplos de 8:/i)).toEqual([]);

    clickar(7, /próximo/i);

    expect(fileira(/múltiplos de 6:/i)).toEqual([6, 12, 18, 24]);
    expect(fileira(/múltiplos de 8:/i)).toEqual([8, 16, 24]);
    expect(status()).toMatch(/MMC\(6, 8\) = 24/);
  });

  it('denominador digitado (commit no blur) entra na exploração com os limites 2–12', () => {
    render(<MmcSimulator />);

    const campo = screen.getByLabelText(/denominador 1/i);
    fireEvent.change(campo, { target: { value: '10' } });
    fireEvent.blur(campo);

    expect(fileira(/múltiplos de 10:/i)).toEqual([]);
    expect(fileira(/múltiplos de 6:/i)).toEqual([]);

    // Fora da faixa, o commit traz para o limite mais próximo em vez de aceitar.
    fireEvent.change(campo, { target: { value: '99' } });
    fireEvent.blur(campo);
    expect(screen.getByText(/múltiplos de 12:/i)).toBeInTheDocument();
  });
});
