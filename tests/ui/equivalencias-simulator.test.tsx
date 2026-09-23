/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EquivalenciasSimulator } from '@/components/infantil/simulators/equivalencias-simulator';

/** Fração exibida no contador (".frac-counter"): numerador/denominador. */
function fracaoDoContador(): { n: string; d: string } {
  const counter = document.querySelector('.frac-counter');
  if (!counter) throw new Error('contador de fração não encontrado');
  return {
    n: counter.querySelector('.fn')?.textContent ?? '',
    d: counter.querySelector('.fd')?.textContent ?? '',
  };
}

/** Largura da área pintada — a proporção pintada É a fração (dado, não estilo). */
function larguraPintada(): string {
  return (document.querySelector('svg .frac-fill') as SVGElement | null)?.getAttribute('width') ?? '';
}

/** Linhas de subdivisão desenhadas dentro da barra. */
function linhasDeSubdivisao(): Element[] {
  return Array.from(document.querySelectorAll('svg line'));
}

function clickar(vezes: number): void {
  for (let i = 0; i < vezes; i++) {
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }));
  }
}

describe('EquivalenciasSimulator — frações equivalentes', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('oferece os controles ▶ Executar tudo, ⏮ Anterior, ⏭ Próximo e ↺ Reiniciar', () => {
    render(<EquivalenciasSimulator />);

    expect(screen.getAllByRole('button', { name: /executar tudo/i })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /anterior/i })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /próximo/i })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /reiniciar/i })).toHaveLength(1);
  });

  it('cada passo adiciona uma subdivisão à barra sem mudar a fração de valor', () => {
    render(<EquivalenciasSimulator />);

    // Arrange — barra inicial: 3/4 com nenhuma subdivisão extra.
    expect(fracaoDoContador()).toEqual({ n: '3', d: '4' });
    expect(linhasDeSubdivisao()).toHaveLength(0);
    const pinturaInicial = larguraPintada();

    // Act — 5 passos de subdivisão.
    clickar(5);

    // Assert — a barra ganhou 5 divisões internas, mas a fração continua
    // 3/4 e a área pintada é exatamente a mesma (equivalência, não troca).
    expect(linhasDeSubdivisao()).toHaveLength(5);
    expect(fracaoDoContador()).toEqual({ n: '3', d: '4' });
    expect(larguraPintada()).toBe(pinturaInicial);
  });

  it('no fim da demonstração o contador mostra a fração equivalente (3/4 → 9/12)', () => {
    render(<EquivalenciasSimulator />);

    // Preset inicial 3/4 com fator 3: 11 linhas de subdivisão + renomear + resultado.
    clickar(13);

    expect(fracaoDoContador()).toEqual({ n: '9', d: '12' });
    // ⏭ esgota: não há mais passos.
    expect(screen.getByRole('button', { name: /próximo/i })).toBeDisabled();
  });

  it('⏮ volta um passo (uma subdivisão sai) e ↺ volta ao início', () => {
    render(<EquivalenciasSimulator />);

    clickar(3);
    expect(linhasDeSubdivisao()).toHaveLength(3);

    fireEvent.click(screen.getByRole('button', { name: /anterior/i }));
    expect(linhasDeSubdivisao()).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: /reiniciar/i }));
    expect(linhasDeSubdivisao()).toHaveLength(0);
    expect(fracaoDoContador()).toEqual({ n: '3', d: '4' });
  });

  it('trocar o fator para ×2 muda o alvo da demonstração (3/4 → 6/8)', () => {
    render(<EquivalenciasSimulator />);

    fireEvent.click(screen.getByRole('button', { name: '×2' }));

    // total = 4×2 = 8 fatias; 7 linhas + renomear + resultado = 9 passos.
    clickar(9);

    expect(fracaoDoContador()).toEqual({ n: '6', d: '8' });
  });
});
