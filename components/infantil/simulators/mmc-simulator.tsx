'use client';

import { useEffect, useState } from 'react';

import { NumberField, SimActionBar, SimGroupLabel, SimStatusBox, clamp } from './sim-utils';

/**
 * Simulador 1 — Descobrindo o MMC (data-simulator="mmc").
 * Porte fiel do mockup fracoes-subtracao-mmc.html (S1): duas fileiras de
 * múltiplos crescem passo a passo; o primeiro número comum pulsa em verde.
 * O passo adiciona sempre à fileira cujo último valor é o menor.
 */

const PRESETS = [
  { a: 4, b: 6 },
  { a: 6, b: 8 },
  { a: 5, b: 10 },
] as const;

interface MmcRows {
  valsA: number[];
  valsB: number[];
  match: number | null;
  lastAdded: { row: 'A' | 'B'; value: number; index: number } | null;
}

/** Estado completo das fileiras derivado do número de passos executados. */
function buildRows(a: number, b: number, steps: number): MmcRows {
  const valsA: number[] = [];
  const valsB: number[] = [];
  let iA = 0;
  let iB = 0;
  let match: number | null = null;
  let lastAdded: MmcRows['lastAdded'] = null;

  for (let step = 0; step < steps; step++) {
    if (match !== null) break;
    const lastA = iA ? a * iA : 0;
    const lastB = iB ? b * iB : 0;
    if (lastA <= lastB) {
      iA++;
      const value = a * iA;
      valsA.push(value);
      lastAdded = { row: 'A', value, index: iA };
      if (valsB.includes(value)) match = value;
    } else {
      iB++;
      const value = b * iB;
      valsB.push(value);
      lastAdded = { row: 'B', value, index: iB };
      if (valsA.includes(value)) match = value;
    }
  }

  return { valsA, valsB, match, lastAdded };
}

export function MmcSimulator() {
  const [a, setA] = useState(4);
  const [b, setB] = useState(6);
  const [steps, setSteps] = useState(0);
  const [running, setRunning] = useState(false);
  const [activePreset, setActivePreset] = useState(0);

  const { valsA, valsB, match, lastAdded } = buildRows(a, b, steps);
  const done = match !== null;

  /* ▶ Executar tudo: encadeia passos de 350ms até o MMC aparecer. */
  useEffect(() => {
    if (!running) return;
    if (done) {
      setRunning(false);
      return;
    }
    const timer = setTimeout(() => setSteps((current) => current + 1), 350);
    return () => clearTimeout(timer);
  }, [running, done, steps]);

  function reset() {
    setSteps(0);
    setRunning(false);
  }

  function applyPreset(index: number) {
    const preset = PRESETS[index];
    if (!preset) return;
    setA(preset.a);
    setB(preset.b);
    setActivePreset(index);
    reset();
  }

  function commitDenominator(which: 'a' | 'b', value: number) {
    const clamped = clamp(value, 2, 12);
    if (which === 'a') setA(clamped);
    else setB(clamped);
    setActivePreset(-1);
    reset();
  }

  const lastRowDenominator = lastAdded?.row === 'B' ? b : a;

  return (
    <div>
      <div className="sim-state-display">
        <div className="frac-rows">
          <div className="frac-row">
            <span className="frac-row-label">Múltiplos de {a}:</span>
            {valsA.map((value, index) => (
              <span
                key={`a-${index}`}
                className={`frac-cell${match !== null && value === match ? ' match' : ''}`}
              >
                {value}
              </span>
            ))}
          </div>
          <div className="frac-row">
            <span className="frac-row-label">Múltiplos de {b}:</span>
            {valsB.map((value, index) => (
              <span
                key={`b-${index}`}
                className={`frac-cell${match !== null && value === match ? ' match' : ''}`}
              >
                {value}
              </span>
            ))}
          </div>
        </div>
        <SimStatusBox tone={done ? 'ok' : ''}>
          {steps === 0 ? (
            <>
              Pronto! Clique em <strong>⏭ Próximo</strong> para listar os múltiplos de {a} e de{' '}
              {b} — ou em <strong>▶ Executar tudo</strong>.
            </>
          ) : done && match !== null ? (
            <>
              🎉 <strong>{match}</strong> é múltiplo de {a} e de {b} → MMC({a}, {b}) = {match}!
            </>
          ) : (
            <>
              Somei <strong>
                {lastRowDenominator}×{lastAdded?.index} = {lastAdded?.value}
              </strong>{' '}
              na fileira de {lastRowDenominator}.
            </>
          )}
        </SimStatusBox>
      </div>

      <div className="sim-controls">
        <SimGroupLabel>Sugestões:</SimGroupLabel>
        {PRESETS.map((preset, index) => (
          <button
            key={`${preset.a}-${preset.b}`}
            type="button"
            className={`sim-btn${activePreset === index ? ' active' : ''}`}
            onClick={() => applyPreset(index)}
          >
            {preset.a} e {preset.b}
          </button>
        ))}
      </div>

      <div className="sim-input-row">
        <NumberField
          id="mmc-a"
          label="Denominador 1 (2–12):"
          value={a}
          min={2}
          max={12}
          onCommit={(value) => commitDenominator('a', value)}
        />
        <NumberField
          id="mmc-b"
          label="Denominador 2 (2–12):"
          value={b}
          min={2}
          max={12}
          onCommit={(value) => commitDenominator('b', value)}
        />
      </div>

      <SimActionBar
        onRun={() => setRunning(true)}
        onBack={() => setSteps((current) => Math.max(0, current - 1))}
        onStep={() => setSteps((current) => current + 1)}
        onReset={reset}
        runDisabled={running || done}
        backDisabled={running || steps === 0}
        stepDisabled={running || done}
      />
    </div>
  );
}
