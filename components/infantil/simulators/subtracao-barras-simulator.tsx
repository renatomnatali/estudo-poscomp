'use client';

import { useEffect, useRef, useState } from 'react';

import {
  Fraction,
  FractionStack,
  NumberField,
  SimActionBar,
  SimGroupLabel,
  SimStatusBox,
  clamp,
  gcd,
  lcm,
} from './sim-utils';

/**
 * Simulador 3 — Subtração passo a passo (data-simulator="subtracao-barras").
 * Porte fiel do mockup (S3): as 3 barras (fração 1, fração 2, resultado).
 * Fases: 1 MMC → 2 subdividir barra de cima → 3 subdividir barra de baixo →
 * 4 subtrair (hachura + resultado) → 5 conta completa → 6 simplificar (7 = fim).
 */

const PRESETS = [
  { n1: 5, d1: 6, n2: 3, d2: 4 },
  { n1: 3, d1: 4, n2: 1, d2: 6 },
  { n1: 5, d1: 6, n2: 1, d2: 3 },
] as const;

/* Geometria das barras (viewBox 0 0 560 246), igual ao mockup. */
const BAR_X = 2;
const BAR_W = 556;
const BAR_H = 50;
const Y_A = 14;
const Y_B = 98;
const Y_C = 182;

type FracConfig = { n1: number; d1: number; n2: number; d2: number };

/** Avança uma fase; sem divisor comum, a fase 6 já é o fim (pula direto pra 7). */
function nextPhaseFrom(current: number, canSimplify: boolean): number {
  const next = current + 1;
  return next === 6 && !canSimplify ? 7 : next;
}

export function SubtracaoBarrasSimulator() {
  const [config, setConfig] = useState<FracConfig>({ n1: 5, d1: 6, n2: 3, d2: 4 });
  const [phase, setPhase] = useState(0);
  const [running, setRunning] = useState(false);
  const [linesA, setLinesA] = useState(0);
  const [linesB, setLinesB] = useState(0);
  const [hatch, setHatch] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [activePreset, setActivePreset] = useState(0);
  /* ▶ terminou com simplificação disponível: a demonstração completa sozinha */
  const [autoSimplifyPending, setAutoSimplifyPending] = useState(false);
  const wentBackRef = useRef(false);

  const { n1, d1, n2, d2 } = config;
  const L = lcm(d1, d2);
  const f1 = L / d1;
  const f2 = L / d2;
  const resultNumerator = n1 * f1 - n2 * f2;
  /* mesma régua do simulador da conta passo a passo: frações próprias
     (n ≤ d — senão a barra pintaria além da unidade) e resultado não-negativo */
  const proper = n1 <= d1 && n2 <= d2;
  const nonNegative = n1 * d2 >= n2 * d1;
  const valid = proper && nonNegative;
  const g = gcd(resultNumerator, L);
  const canSimplify = g > 1;

  /* Linhas novas de cada barra (k não múltiplo do fator). */
  const newLinesA: number[] = [];
  for (let k = 1; k < L; k++) {
    if (k % f1 !== 0) newLinesA.push(k);
  }
  const newLinesB: number[] = [];
  for (let k = 1; k < L; k++) {
    if (k % f2 !== 0) newLinesB.push(k);
  }

  const c1Done = phase > 2 || (phase === 2 && linesA >= newLinesA.length);
  const c2Done = phase > 3 || (phase === 3 && linesB >= newLinesB.length);

  /* Fase 2: linhas da barra de cima surgem uma a uma (90ms cada). */
  useEffect(() => {
    if (phase < 2) {
      if (linesA !== 0) setLinesA(0);
      return;
    }
    if (phase > 2 || linesA >= newLinesA.length) {
      if (linesA < newLinesA.length) setLinesA(newLinesA.length);
      return;
    }
    const timer = setTimeout(() => setLinesA((current) => current + 1), 90);
    return () => clearTimeout(timer);
  }, [phase, linesA, newLinesA.length]);

  /* Fase 3: idem para a barra de baixo. */
  useEffect(() => {
    if (phase < 3) {
      if (linesB !== 0) setLinesB(0);
      return;
    }
    if (phase > 3 || linesB >= newLinesB.length) {
      if (linesB < newLinesB.length) setLinesB(newLinesB.length);
      return;
    }
    const timer = setTimeout(() => setLinesB((current) => current + 1), 90);
    return () => clearTimeout(timer);
  }, [phase, linesB, newLinesB.length]);

  /* Fase 4: hachura aos 60ms; barra do resultado acorda aos 750ms.
     Voltar (Anterior) pula a espera — o "replay fast" do mockup. */
  useEffect(() => {
    if (phase < 4) {
      setHatch(false);
      setRevealed(false);
      return;
    }
    if (phase > 4 || wentBackRef.current) {
      if (wentBackRef.current) wentBackRef.current = false;
      setHatch(true);
      setRevealed(true);
      return;
    }
    const t1 = setTimeout(() => setHatch(true), 60);
    const t2 = setTimeout(() => setRevealed(true), 750);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [phase]);

  function reset(nextConfig: FracConfig = config) {
    setConfig(nextConfig);
    setPhase(0);
    setRunning(false);
    setAutoSimplifyPending(false);
    setLinesA(0);
    setLinesB(0);
    setHatch(false);
    setRevealed(false);
  }

  function applyPreset(index: number) {
    const preset = PRESETS[index];
    if (!preset) return;
    setActivePreset(index);
    reset({ ...preset });
  }

  function commitField(field: keyof FracConfig, value: number) {
    setActivePreset(-1);
    reset({ ...config, [field]: clamp(value, 1, 12) });
  }

  function step() {
    if (running || phase >= 6) return;
    wentBackRef.current = false;
    setPhase((current) => nextPhaseFrom(current, canSimplify));
  }

  function back() {
    if (running || phase <= 0) return;
    wentBackRef.current = true;
    setPhase((current) => Math.max(0, current - 1));
  }

  /* ▶ Executar tudo: encadeia as fases respeitando a duração de cada uma. */
  useEffect(() => {
    if (!running) return;
    wentBackRef.current = false;
    if (phase >= 6) {
      /* simplificação disponível: a demonstração completa sozinha (1,1s),
         após os botões voltarem — por isso o agendamento é um efeito à parte */
      if (canSimplify && phase < 7) {
        setAutoSimplifyPending(true);
      }
      setRunning(false);
      return;
    }
    const duration =
      phase === 1 ? 300 : phase === 2 ? newLinesA.length * 90 + 350 : phase === 3 ? newLinesB.length * 90 + 350 : phase === 4 ? 1600 : phase === 5 ? 600 : 300;
    const timer = setTimeout(
      () => setPhase((current) => nextPhaseFrom(current, canSimplify)),
      duration + 750,
    );
    return () => clearTimeout(timer);
  }, [running, phase, canSimplify, newLinesA.length, newLinesB.length]);

  /* auto-simplificação: só dispara quando ▶ terminou com o botão disponível */
  useEffect(() => {
    if (!autoSimplifyPending) return;
    const timer = setTimeout(() => {
      setAutoSimplifyPending(false);
      setPhase(7);
    }, 1100);
    return () => clearTimeout(timer);
  }, [autoSimplifyPending]);

  /* — render helpers — */

  function renderBarLines(denominator: number, y: number, newLines: number[], shown: number) {
    const elements = [];
    for (let k = 1; k < denominator; k++) {
      elements.push(
        <line
          key={`orig-${k}`}
          x1={(BAR_X + (k / denominator) * BAR_W).toFixed(1)}
          y1={y}
          x2={(BAR_X + (k / denominator) * BAR_W).toFixed(1)}
          y2={y + BAR_H}
          stroke="var(--primary)"
          strokeWidth={3}
          opacity={1}
        />,
      );
    }
    for (let i = 0; i < shown; i++) {
      const k = newLines[i];
      elements.push(
        <line
          key={`new-${k}`}
          x1={(BAR_X + (k / L) * BAR_W).toFixed(1)}
          y1={y}
          x2={(BAR_X + (k / L) * BAR_W).toFixed(1)}
          y2={y + BAR_H}
          stroke="var(--primary)"
          strokeWidth={1.4}
          opacity={1}
        />,
      );
    }
    return elements;
  }

  const widthA = (n1 / d1) * BAR_W;
  const widthB = (n2 / d2) * BAR_W;
  const hatchX = BAR_X + (resultNumerator / L) * BAR_W;
  const hatchWidth = Math.max(0, ((n2 * f2) / L) * BAR_W);
  const isMultiple = d1 % d2 === 0 || d2 % d1 === 0;
  const showSimplifyButton = phase >= 6 && phase < 7 && canSimplify;

  return (
    <div>
      <div className="sim-state-display">
        <div className="frac-counters">
          <span className="fc">
            <span className="dot" style={{ background: 'var(--accent)' }} />
            Fração 1:{' '}
            <span className="frac-counter">
              {c1Done ? (
                <>
                  <Fraction n={n1} d={d1} /> → <strong><Fraction n={n1 * f1} d={L} /></strong>
                </>
              ) : (
                <Fraction n={n1} d={d1} />
              )}
            </span>
          </span>
          <span className="fc">
            <span className="dot" style={{ background: 'var(--accent2)' }} />
            Fração 2:{' '}
            <span className="frac-counter">
              {c2Done ? (
                <>
                  <Fraction n={n2} d={d2} /> → <strong><Fraction n={n2 * f2} d={L} /></strong>
                </>
              ) : (
                <Fraction n={n2} d={d2} />
              )}
            </span>
          </span>
          <span className="fc">
            <span className="dot" style={{ background: 'var(--green)' }} />
            Resultado:{' '}
            <span className="frac-counter">
              {revealed ? (
                <strong>
                  <Fraction n={resultNumerator} d={L} />
                </strong>
              ) : (
                '—'
              )}
            </span>
          </span>
        </div>

        <svg
          className="frac-svg"
          viewBox="0 0 560 246"
          width="100%"
          role="img"
          aria-label="Três barras empilhadas: a 1ª fração, a 2ª fração e o resultado da subtração"
        >
          <defs>
            <linearGradient id="subGA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2f7de1" />
              <stop offset="1" stopColor="#1a6bcc" />
            </linearGradient>
            <linearGradient id="subGB" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f0820f" />
              <stop offset="1" stopColor="#e8700a" />
            </linearGradient>
            <linearGradient id="subGC" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#34b368" />
              <stop offset="1" stopColor="#1a8c4e" />
            </linearGradient>
            <pattern
              id="subHatchPat"
              width="9"
              height="9"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line x1="0" y1="0" x2="0" y2="9" stroke="#c0392b" strokeWidth="2.6" />
            </pattern>
          </defs>

          <text x="280" y="88" textAnchor="middle" fontSize="20" fill="var(--n400)">
            −
          </text>

          <rect x="1" y={Y_A - 1} width="558" height="52" rx="6" fill="#ffffff" stroke="var(--border)" strokeWidth="2" />
          <rect
            className="frac-fill"
            x={BAR_X}
            y={Y_A}
            width={widthA.toFixed(1)}
            height={BAR_H}
            fill="url(#subGA)"
            opacity=".92"
          />
          <g>{renderBarLines(d1, Y_A, newLinesA, phase >= 2 ? linesA : 0)}</g>
          <rect
            className="frac-hatch"
            x={hatchX.toFixed(1)}
            y={Y_A}
            width={hatchWidth.toFixed(1)}
            height={BAR_H}
            fill="url(#subHatchPat)"
            opacity={hatch ? 0.8 : 0}
          />

          <rect x="1" y={Y_B - 1} width="558" height="52" rx="6" fill="#ffffff" stroke="var(--border)" strokeWidth="2" />
          <rect
            className="frac-fill"
            x={BAR_X}
            y={Y_B}
            width={widthB.toFixed(1)}
            height={BAR_H}
            fill="url(#subGB)"
            opacity=".92"
          />
          <g>{renderBarLines(d2, Y_B, newLinesB, phase >= 3 ? linesB : 0)}</g>

          <text x="280" y="172" textAnchor="middle" fontSize="20" fill="var(--n400)">
            =
          </text>

          <rect
            x="1"
            y={Y_C - 1}
            width="558"
            height="52"
            rx="6"
            fill="#ffffff"
            stroke="var(--n300)"
            strokeWidth="2"
            strokeDasharray={revealed ? undefined : '7 5'}
          />
          <g style={{ opacity: revealed ? 1 : 0, transition: 'opacity .5s' }}>
            {Array.from({ length: Math.max(0, L - 1) }, (_, index) => index + 1).map((k) => (
              <line
                key={k}
                x1={(BAR_X + (k / L) * BAR_W).toFixed(1)}
                y1={Y_C}
                x2={(BAR_X + (k / L) * BAR_W).toFixed(1)}
                y2={Y_C + BAR_H}
                stroke="var(--primary)"
                strokeWidth={1.4}
                opacity={1}
              />
            ))}
          </g>
          <rect
            className="frac-fill"
            x={BAR_X}
            y={Y_C}
            width={revealed ? ((resultNumerator / L) * BAR_W).toFixed(1) : 0}
            height={BAR_H}
            fill="url(#subGC)"
            opacity={revealed ? 0.95 : 0}
          />
        </svg>

        <div className={`frac-eq-panel${phase >= 5 ? ' show' : ''}`}>
          {phase >= 5 ? (
            <>
              <FractionStack n={n1 * f1} d={L} />
              <span>−</span>
              <FractionStack n={n2 * f2} d={L} />
              <span>=</span>
              <FractionStack n={resultNumerator} d={L} />
              {phase === 7 && canSimplify ? (
                <>
                  <span>=</span>
                  <FractionStack n={resultNumerator / g} d={L / g} className="simplified" />
                  <span className="simplified" style={{ fontSize: '.62em' }}>
                    ÷{g}
                  </span>
                </>
              ) : null}
            </>
          ) : null}
        </div>

        <SimStatusBox
          tone={
            !valid
              ? 'fail'
              : phase === 5 || phase === 6 || phase === 7
                ? 'ok'
                : ''
          }
        >
          {!valid ? (
            !proper ? (
              <>
                ⚠️ Este simulador trabalha com frações próprias: numerador ≤ denominador. Ajuste
                os números e tente de novo.
              </>
            ) : (
              <>
                ⚠️ Aqui a segunda fração (<Fraction n={n2} d={d2} />) é maior que a primeira (
                <Fraction n={n1} d={d1} />) — o resultado seria negativo. Ajuste os valores: este
                módulo trabalha com resultados não-negativos.
              </>
            )
          ) : phase === 0 ? (
            <>
              Pronto! <strong>
                <Fraction n={n1} d={d1} /> − <Fraction n={n2} d={d2} />
              </strong>
              . Clique em <strong>⏭ Próximo</strong> para começar pelo MMC — ou{' '}
              <strong>▶ Executar tudo</strong>.
            </>
          ) : phase === 1 ? (
            <>
              🧮 <strong>Passo 1 — MMC:</strong> MMC({d1}, {d2}) = <strong>{L}</strong>
              {isMultiple ? ` (o próprio ${Math.max(d1, d2)} já serve — um é múltiplo do outro!)` : null}
            </>
          ) : phase === 2 ? (
            newLinesA.length === 0 ? (
              <>A barra já está dividida em {L} fatias — nada a subdividir (o próprio denominador já é o MMC). 🙂</>
            ) : (
              <>
                ✂️ <strong>Passo 2 — subdividir a barra de cima:</strong> cada fatia vira {f1}.{' '}
                <Fraction n={n1} d={d1} /> = <Fraction n={n1 * f1} d={L} />.
              </>
            )
          ) : phase === 3 ? (
            newLinesB.length === 0 ? (
              <>A barra já está dividida em {L} fatias — nada a subdividir (o próprio denominador já é o MMC). 🙂</>
            ) : (
              <>
                ✂️ <strong>Passo 3 — subdividir a barra de baixo:</strong> cada fatia vira {f2}.{' '}
                <Fraction n={n2} d={d2} /> = <Fraction n={n2 * f2} d={L} />.
              </>
            )
          ) : phase === 4 ? (
            <>
              🗑️ <strong>Passo 4 — subtrair:</strong> as <strong>{n2 * f2} fatias</strong> da barra
              de baixo são arrancadas do fim da barra de cima (hachura vermelha). O que sobra ganha a
              própria barra, em verde: <strong><Fraction n={resultNumerator} d={L} /></strong>.
            </>
          ) : phase === 5 ? (
            <>
              🎉 <strong>
                Resultado: <Fraction n={resultNumerator} d={L} />
              </strong>
              . Agora falta só a última olhada — dá para simplificar?
            </>
          ) : phase === 7 && canSimplify ? (
            <>
              ✨ Simplifiquei dividindo numerador e denominador por {g}: <strong>
                <Fraction n={resultNumerator} d={L} /> ={' '}
                <Fraction n={resultNumerator / g} d={L / g} />
              </strong>{' '}
              — forma mais simples! Fim! ↺ Reiniciar para testar outras frações.
            </>
          ) : canSimplify ? (
            <>
              ✨ {resultNumerator} e {L} têm o divisor comum <strong>{g}</strong> → clique em{' '}
              <strong>✨ Simplificar</strong> para a forma mais enxuta!
            </>
          ) : (
            <>
              🔒 <strong>
                <Fraction n={resultNumerator} d={L} /> já está na forma mais simples
              </strong>{' '}
              ({resultNumerator} e {L} só têm o divisor 1 em comum). Fim! ↺ Reiniciar para testar
              outras frações.
            </>
          )}
        </SimStatusBox>
      </div>

      <div className="sim-controls">
        <SimGroupLabel>Sugestões:</SimGroupLabel>
        {PRESETS.map((preset, index) => (
          <button
            key={`${preset.n1}-${preset.d1}-${preset.n2}-${preset.d2}`}
            type="button"
            className={`sim-btn${activePreset === index ? ' active' : ''}`}
            onClick={() => applyPreset(index)}
          >
            <Fraction n={preset.n1} d={preset.d1} /> − <Fraction n={preset.n2} d={preset.d2} />
          </button>
        ))}
      </div>

      <div className="sim-input-row">
        <NumberField id="sub-n1" label="1ª numerador" value={n1} min={1} max={12} onCommit={(v) => commitField('n1', v)} />
        <NumberField id="sub-d1" label="1ª denominador" value={d1} min={1} max={12} onCommit={(v) => commitField('d1', v)} />
        <NumberField id="sub-n2" label="2ª numerador" value={n2} min={1} max={12} onCommit={(v) => commitField('n2', v)} />
        <NumberField id="sub-d2" label="2ª denominador" value={d2} min={1} max={12} onCommit={(v) => commitField('d2', v)} />
      </div>

      <SimActionBar
        onRun={() => setRunning(true)}
        onBack={back}
        onStep={step}
        onReset={() => reset()}
        runDisabled={running || phase >= 6 || !valid}
        backDisabled={running || phase === 0}
        stepDisabled={running || phase >= 6 || !valid}
      >
        {showSimplifyButton ? (
          <button
            type="button"
            className="sim-action-btn sim-action-btn-primary"
            onClick={() => {
              setAutoSimplifyPending(false);
              setPhase(7);
            }}
          >
            ✨ Simplificar
          </button>
        ) : null}
      </SimActionBar>
    </div>
  );
}
