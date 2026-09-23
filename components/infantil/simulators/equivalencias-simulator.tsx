'use client';

import { useEffect, useState } from 'react';

import { Fraction, SimActionBar, SimGroupLabel, SimStatusBox } from './sim-utils';

/**
 * Simulador 2 — Frações equivalentes (data-simulator="equivalencias").
 * Porte fiel do mockup (S2): as linhas de subdivisão surgem uma a uma, a
 * barra ganha mais fatias e a área pintada permanece idêntica; no fim a
 * fração é renomeada (numerador E denominador × fator).
 *
 * Passos: (total−1) subdivisões + multiplicar + resultado, total = d × f.
 */

const PRESETS = [
  { n: 3, d: 4, f: 3 },
  { n: 1, d: 2, f: 4 },
  { n: 2, d: 3, f: 2 },
] as const;

const FACTORS = [2, 3, 4] as const;

/* Geometria da barra (viewBox 0 0 560 70), igual ao mockup. */
const BAR_X = 2;
const BAR_Y = 9;
const BAR_H = 50;
const BAR_W = 556;

export function EquivalenciasSimulator() {
  const [n, setN] = useState(3);
  const [d, setD] = useState(4);
  const [f, setF] = useState(3);
  const [steps, setSteps] = useState(0);
  const [running, setRunning] = useState(false);
  const [activePreset, setActivePreset] = useState(0);

  const total = d * f;
  const maxSteps = total + 1;
  const finished = steps >= maxSteps;
  const lines = Math.min(steps, total - 1);

  useEffect(() => {
    if (!running) return;
    if (finished) {
      setRunning(false);
      return;
    }
    const timer = setTimeout(() => setSteps((current) => current + 1), 380);
    return () => clearTimeout(timer);
  }, [running, finished, steps]);

  function reset() {
    setSteps(0);
    setRunning(false);
  }

  function applyPreset(index: number) {
    const preset = PRESETS[index];
    if (!preset) return;
    setN(preset.n);
    setD(preset.d);
    setF(preset.f);
    setActivePreset(index);
    reset();
  }

  const fillWidth = BAR_X + (n / d) * BAR_W;

  function renderLine(k: number) {
    const x = BAR_X + (k / total) * BAR_W;
    const original = k % f === 0;
    return (
      <line
        key={k}
        x1={x.toFixed(1)}
        y1={BAR_Y}
        x2={x.toFixed(1)}
        y2={BAR_Y + BAR_H}
        stroke="var(--primary)"
        strokeWidth={original ? 3 : 1.6}
        opacity={original ? 1 : 0.55}
        strokeDasharray={original ? undefined : '5 4'}
      />
    );
  }

  return (
    <div>
      <div className="sim-state-display">
        <div style={{ padding: '.5rem 0 .2rem' }}>
          <span className="frac-counter">
            {steps === maxSteps ? (
              <strong>
                <Fraction n={n * f} d={d * f} />
              </strong>
            ) : steps === total ? (
              <Fraction
                n={
                  <>
                    {n}
                    <span className="fx">×{f}</span>
                  </>
                }
                d={
                  <>
                    {d}
                    <span className="fx">×{f}</span>
                  </>
                }
              />
            ) : (
              <Fraction n={n} d={d} />
            )}
          </span>
        </div>

        <svg
          className="frac-svg"
          viewBox="0 0 560 70"
          width="100%"
          role="img"
          aria-label="Barra da unidade dividida em fatias, com a área da fração pintada"
        >
          <defs>
            <linearGradient id="eqvGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2f7de1" />
              <stop offset="1" stopColor="#1a6bcc" />
            </linearGradient>
          </defs>
          <rect x="1" y="8" width="558" height="52" rx="6" fill="#ffffff" stroke="var(--border)" strokeWidth="2" />
          <rect
            className="frac-fill"
            x={BAR_X}
            y={BAR_Y}
            width={(fillWidth - BAR_X).toFixed(1)}
            height={BAR_H}
            fill="url(#eqvGrad)"
            opacity=".92"
          />
          {Array.from({ length: Math.min(lines, total - 1) }, (_, index) => index + 1).map(renderLine)}
        </svg>

        <SimStatusBox tone={steps === maxSteps ? 'ok' : ''}>
          {steps === 0 ? (
            <>
              Barra pronta: <strong>
                {d} fatias, {n} pintadas
              </strong>
              . Clique em <strong>⏭ Próximo</strong> para subdividir cada fatia em {f}.
            </>
          ) : steps === total - 1 ? (
            <>
              Todas as subdivisões prontas: a barra agora tem <strong>{total} fatias</strong> ({d} ×{' '}
              {f}). A área pintada mudou? Não! Agora vamos renomear a fração. ➡️
            </>
          ) : steps === total ? (
            <>
              Multipliquei numerador E denominador por <strong>{f}</strong>. Confira a conta: {n}×
              {f} = {n * f} e {d}×{f} = {d * f}.
            </>
          ) : steps === maxSteps ? (
            <>
              ✨ <strong>
                <Fraction n={n} d={d} /> = <Fraction n={n * f} d={d * f} />
              </strong>{' '}
              — frações equivalentes! A área pintada continua a mesma, só a fatia ficou menor e mais
              numerosa.
            </>
          ) : (
            <>
              Nova linha de subdivisão ✂️ — a barra ganhou mais uma divisão interna. A área pintada
              continua <strong>exatamente a mesma</strong>!
            </>
          )}
        </SimStatusBox>
      </div>

      <div className="sim-controls">
        <SimGroupLabel>Sugestões:</SimGroupLabel>
        {PRESETS.map((preset, index) => (
          <button
            key={`${preset.n}-${preset.d}-${preset.f}`}
            type="button"
            className={`sim-btn${activePreset === index ? ' active' : ''}`}
            onClick={() => applyPreset(index)}
          >
            <Fraction n={preset.n} d={preset.d} /> com fator {preset.f}
          </button>
        ))}
      </div>

      <div className="sim-controls">
        <SimGroupLabel>Fator (2–4):</SimGroupLabel>
        {FACTORS.map((factor) => (
          <button
            key={factor}
            type="button"
            className={`sim-btn${f === factor ? ' active' : ''}`}
            onClick={() => {
              setF(factor);
              reset();
            }}
          >
            ×{factor}
          </button>
        ))}
      </div>

      <SimActionBar
        onRun={() => setRunning(true)}
        onBack={() => setSteps((current) => Math.max(0, current - 1))}
        onStep={() => setSteps((current) => current + 1)}
        onReset={reset}
        runDisabled={running || finished}
        backDisabled={running || steps === 0}
        stepDisabled={running || finished}
      />
    </div>
  );
}
