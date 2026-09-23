/** @vitest-environment jsdom */

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SubtracaoBarrasSimulator } from '@/components/infantil/simulators/subtracao-barras-simulator';

const LARGURA_BARRA = 556;
/** Sinal de menos usado nos presets (U+2212, o mesmo do mockup). */
const MENOS = '−';

/** Botão de preset "n1/d1 − n2/d2" (frações renderizam num/den colados no DOM). */
function preset(n1: number, d1: number, n2: number, d2: number): HTMLElement {
  const alvo = `${n1}${d1}${MENOS}${n2}${d2}`;
  const botao = screen
    .getAllByRole('button')
    .find((b) => (b.textContent ?? '').replace(/\s+/g, '') === alvo);
  if (!botao) throw new Error(`preset não encontrado: ${alvo}`);
  return botao;
}

/**
 * Fração exibida em um contador de cima ("Fração 1:", "Fração 2:",
 * "Resultado:"): devolve a renomeada quando já existe (10/12), a original
 * (5/6) enquanto não, ou o traço quando o resultado ainda não foi revelado.
 * Localiza pelo texto inicial do cartão — o status da animação também cita
 * "Resultado", mas não é um contador.
 */
function contador(label: string): string {
  const fc = Array.from(document.querySelectorAll('.frac-counters .fc')).find((elemento) =>
    (elemento.textContent ?? '').trim().startsWith(label),
  );
  if (!fc) throw new Error(`contador não encontrado: ${label}`);
  const counter = fc.querySelector('.frac-counter');
  if (!counter) throw new Error(`contador sem .frac-counter: ${label}`);

  const fracao = counter.querySelector('strong .fracv') ?? counter.querySelector('.fracv');
  if (fracao) {
    return `${fracao.querySelector('.fn')?.textContent}/${fracao.querySelector('.fd')?.textContent}`;
  }
  return counter.textContent?.trim() ?? '';
}

function status(): string {
  return (document.querySelector('.sim-status') as HTMLElement | null)?.textContent ?? '';
}

/** Frações do painel de igualdade (10/12 − 9/12 = 1/12), na ordem. */
function painelIgualdade(): string[] {
  return Array.from(document.querySelectorAll('.frac-eq-panel .frac-stack')).map(
    (stack) => `${stack.querySelector('.fn')?.textContent}/${stack.querySelector('.fd')?.textContent}`,
  );
}

function clickarProximo(vezes: number): void {
  for (let i = 0; i < vezes; i++) {
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }));
  }
}

/**
 * Avanço do relógio em atos encadeados: cada salto dá a chance ao React de
 * reagendar a próxima fase do ▶ (e as linhas de 90ms) antes da janela seguinte.
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

describe('SubtracaoBarrasSimulator — subtração com as 3 barras', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('oferece os controles ▶ Executar tudo, ⏮ Anterior, ⏭ Próximo e ↺ Reiniciar', () => {
    render(<SubtracaoBarrasSimulator />);

    expect(screen.getAllByRole('button', { name: /executar tudo/i })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /anterior/i })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /próximo/i })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /reiniciar/i })).toHaveLength(1);
  });

  it('passo 1 mostra o MMC e a fase de subtração revela a 3ª barra preenchida com 5/6 − 3/4 = 1/12', () => {
    render(<SubtracaoBarrasSimulator />);

    // Passo 1 — o terreno comum é o MMC(6, 4) = 12.
    clickarProximo(1);
    expect(status()).toMatch(/MMC\(6, 4\) = 12/);

    // Antes da subtração, o resultado é um traço (a 3ª barra está muda).
    expect(contador('Resultado:')).toBe('—');

    // Fases 2 e 3 (subdivisões) e 4 (subtrair).
    clickarProximo(3);
    act(() => {
      vi.advanceTimersByTime(60 + 750 + 100);
    });

    // A 3ª barra acorda preenchida com o resultado correto: 10/12 − 9/12 = 1/12.
    expect(contador('Resultado:')).toBe('1/12');

    // A área pintada da 3ª barra é 1/12 da barra — a proporção É o dado.
    const barras = document.querySelectorAll('svg .frac-fill');
    expect(barras.length).toBe(3);
    const larguraC = Number(barras[2].getAttribute('width'));
    expect(larguraC).toBeCloseTo((1 / 12) * LARGURA_BARRA, 1);
  });

  it('as frações são renomeadas para o denominador comum conforme as fases passam', () => {
    render(<SubtracaoBarrasSimulator />);

    clickarProximo(2);
    // As linhas surgem uma a uma (90ms cada), reagendadas a cada render.
    avancarTempo(90 * 10, 90);

    // Fase 2 completa: a 1ª fração vira 5/6 → 10/12 (a 2ª ainda está crua).
    expect(contador('Fração 1:')).toBe('10/12');
    expect(contador('Fração 2:')).toBe('3/4');

    clickarProximo(1);
    avancarTempo(90 * 10, 90);

    // Fase 3 completa: a 2ª fração vira 3/4 → 9/12.
    expect(contador('Fração 2:')).toBe('9/12');
  });

  it('fase 5 mostra a conta completa no painel de igualdade (10/12 − 9/12 = 1/12)', () => {
    render(<SubtracaoBarrasSimulator />);

    clickarProximo(5);
    act(() => {
      vi.advanceTimersByTime(60 + 750 + 100);
    });

    expect(painelIgualdade()).toEqual(['10/12', '9/12', '1/12']);
  });

  it('⏮ volta uma fase e o resultado volta a ser um traço; ↺ reinicia a exploração', () => {
    render(<SubtracaoBarrasSimulator />);

    clickarProximo(4);
    act(() => {
      vi.advanceTimersByTime(60 + 750 + 100);
    });
    expect(contador('Resultado:')).toBe('1/12');

    fireEvent.click(screen.getByRole('button', { name: /anterior/i }));
    expect(contador('Resultado:')).toBe('—');

    fireEvent.click(screen.getByRole('button', { name: /reiniciar/i }));
    expect(contador('Fração 1:')).toBe('5/6');
    expect(status()).toMatch(/próximo/i);
  });

  it('▶ Executar tudo percorre as fases sozinhas até o resultado final', () => {
    render(<SubtracaoBarrasSimulator />);

    fireEvent.click(screen.getByRole('button', { name: /executar tudo/i }));
    // Duração das fases (350ms–2.35s cada) + linhas de 90ms encadeadas.
    avancarTempo(12_000, 90);

    // 1/12 já está na forma mais simples: a demonstração termina sozinha nisso.
    expect(contador('Resultado:')).toBe('1/12');
    expect(painelIgualdade()).toEqual(['10/12', '9/12', '1/12']);
    expect(status()).toMatch(/forma mais simples/);
    expect(screen.getByRole('button', { name: /executar tudo/i })).toBeDisabled();
  });

  it('preset 3/4 − 1/6 recalcula tudo para resultado 7/12', () => {
    render(<SubtracaoBarrasSimulator />);

    fireEvent.click(preset(3, 4, 1, 6));
    clickarProximo(5);
    act(() => {
      vi.advanceTimersByTime(60 + 750 + 100);
    });

    expect(contador('Resultado:')).toBe('7/12');
  });

  it('bloqueia a exploração e avisa quando a 2ª fração seria maior que a 1ª', () => {
    render(<SubtracaoBarrasSimulator />);

    // 1/4 − 3/4 daria negativo: o módulo trabalha com resultados não-negativos.
    const n1 = screen.getByLabelText(/1ª numerador/i);
    fireEvent.change(n1, { target: { value: '1' } });
    fireEvent.blur(n1);

    expect(screen.getByRole('button', { name: /próximo/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /executar tudo/i })).toBeDisabled();
    // Aviso obrigatório para o aluno entender por que está travado.
    expect(status()).toMatch(/resultado seria negativo/i);
  });
});
