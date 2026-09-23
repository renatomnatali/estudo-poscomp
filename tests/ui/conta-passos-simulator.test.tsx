/** @vitest-environment jsdom */

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ContaPassosSimulator } from '@/components/infantil/simulators/conta-passos-simulator';

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

function status(): string {
  return (document.querySelector('.sim-status') as HTMLElement | null)?.textContent ?? '';
}

/** Frações exibidas no palco "Passo 3 · O resultado", na ordem. */
function resultados(): string[] {
  return Array.from(document.querySelectorAll('.m3c-done')).map(
    (done) => `${done.querySelector('.fn')?.textContent}/${done.querySelector('.fd')?.textContent}`,
  );
}

/** Setas SVG desenhadas no momento (o desenho é o comportamento do passo). */
function setas(): Element[] {
  return Array.from(document.querySelectorAll('path.m3c-arc'));
}

function clickarProximo(vezes: number): void {
  for (let i = 0; i < vezes; i++) {
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }));
  }
}

/**
 * Avanço do relógio em atos encadeados: cada salto dá a chance ao React de
 * reagendar o próximo passo do ▶ antes da janela seguinte.
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

describe('ContaPassosSimulator — montando a conta passo a passo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('oferece os controles ▶ Executar tudo, ⏮ Anterior, ⏭ Próximo e ↺ Reiniciar', () => {
    render(<ContaPassosSimulator />);

    expect(screen.getAllByRole('button', { name: /executar tudo/i })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /anterior/i })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /próximo/i })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /reiniciar/i })).toHaveLength(1);
  });

  it('a conta padrão (3/4 − 1/6) termina em 7/12 após 12 passos', () => {
    render(<ContaPassosSimulator />);

    clickarProximo(12);

    expect(resultados()).toEqual(['7/12']);
    expect(status()).toMatch(/9 − 2 = 7/);
    // Passos esgotados: ⏭ fica indisponível.
    expect(screen.getByRole('button', { name: /próximo/i })).toBeDisabled();
  });

  it('no passo 5 desenha apenas a seta da divisão 12 → 4, com o fator 3 circulado', () => {
    render(<ContaPassosSimulator />);

    clickarProximo(5);

    // Uma única seta: a da conta dos denominadores da 1ª fração.
    expect(setas()).toHaveLength(1);

    // O rótulo da seta é a própria conta: 12 ÷ 4 = 3 (fator destacado).
    const rotulo = document.querySelector('.m3c-arc-label');
    const fator = document.querySelector('.m3c-arc-hi-t');
    const circulo = document.querySelector('.m3c-arc-hi-c');
    expect(rotulo?.textContent).toMatch(/12 ÷ 4/);
    expect(fator?.textContent).toBe('3');
    expect(circulo).not.toBeNull();

    // O passo seguinte acrescenta a próxima seta da cadeia (o fator sobe).
    clickarProximo(1);
    expect(setas()).toHaveLength(2);
  });

  it('⏮ volta um passo e a seta do passo desenhado sai; ↺ volta ao início', () => {
    render(<ContaPassosSimulator />);

    clickarProximo(5);
    expect(setas()).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: /anterior/i }));
    expect(setas()).toHaveLength(0);

    clickarProximo(12);
    fireEvent.click(screen.getByRole('button', { name: /reiniciar/i }));

    expect(setas()).toHaveLength(0);
    expect(resultados()).toEqual([]);
    expect(status()).toMatch(/pronto!/i);
  });

  it('▶ Executar tudo percorre os 12 passos sozinho até o resultado', () => {
    render(<ContaPassosSimulator />);

    fireEvent.click(screen.getByRole('button', { name: /executar tudo/i }));
    avancarTempo(900 * 14, 150);

    expect(resultados()).toEqual(['7/12']);
    expect(screen.getByRole('button', { name: /executar tudo/i })).toBeDisabled();
  });

  it('preset 5/6 − 1/3 simplifica no último passo: 3/6 = 1/2 (dividi por 3)', () => {
    render(<ContaPassosSimulator />);

    fireEvent.click(preset(5, 6, 1, 3));

    // 12 passos da conta + 1 passo da simplificação.
    clickarProximo(13);

    expect(resultados()).toEqual(['3/6', '1/2']);
    // "(dividi por 3)" é a anotação matemática do divisor aplicado — dado.
    expect(status()).toMatch(/dividi por 3/);
  });

  it('Personalizar habilita as caixas de fração e o valor digitado entra na conta', () => {
    render(<ContaPassosSimulator />);

    const denominador2 = screen.getByLabelText('denominador da 2ª fração');
    expect(denominador2).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /personalizar/i }));
    expect(denominador2).toBeEnabled();

    // Troca o denominador da 2ª fração de 6 para 3 (commit no blur).
    fireEvent.change(denominador2, { target: { value: '3' } });
    fireEvent.blur(denominador2);

    // A conta nova é 3/4 − 1/3: o terreno comum recalcula para MMC(4, 3) = 12.
    clickarProximo(2);
    expect(status()).toMatch(/MMC\(4, 3\) = 12/);
  });

  it('escolher um preset depois de personalizar desliga o modo e tranca as caixas de novo', () => {
    render(<ContaPassosSimulator />);

    fireEvent.click(screen.getByRole('button', { name: /personalizar/i }));
    const numerador1 = screen.getByLabelText('numerador da 1ª fração');
    expect(numerador1).toBeEnabled();

    fireEvent.click(preset(5, 6, 1, 3));

    expect(numerador1).toBeDisabled();
  });
});
