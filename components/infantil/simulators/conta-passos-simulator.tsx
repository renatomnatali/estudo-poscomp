'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

import { Fraction, SimActionBar, SimStatusBox, clamp, gcd, lcm } from './sim-utils';

/**
 * Simulador 4 — Montando a conta passo a passo (data-simulator="conta-passo-a-passo").
 * Porte fiel do mockup (M3): o grid Passo 1/2/3 com as setas SVG em cadeia —
 * divisão (12→4), fator subindo (4→numerador), transporte do resultado — e o
 * modo Personalizar (sugestões esmaecem, caixas-fração habilitadas).
 *
 * A geometria das setas é a MESMA do mockup: posições via getBoundingClientRect
 * relativas ao SVG, marker ancorado pela base (encurta o destino em 12px) e o
 * "U" no corredor inferior; recalcular em resize/useLayoutEffect.
 */

const PRESETS = [
  { n1: 3, d1: 4, n2: 1, d2: 6 },
  { n1: 5, d1: 6, n2: 3, d2: 4 },
  { n1: 5, d1: 6, n2: 1, d2: 3 },
] as const;

/** Último passo que desenha seta (índices 4–9 da sequência de passos). */
const ARROW_LAST_STEP = 9;

type FracConfig = { n1: number; d1: number; n2: number; d2: number };

type LabelSpec =
  | { kind: 'eq'; cx: number; cy: number; eq: string; hi: string }
  | { kind: 'badge'; x: number; y: number; text: string }
  | { kind: 'plain'; cx: number; cy: number; eq: string; hi: string };

interface ArrowState {
  arcs: Array<{ step: number; d: string }>;
  label: LabelSpec | null;
}

const NO_ARROWS: ArrowState = { arcs: [], label: null };

/** Caixa-fração do modo Personalizar (commita no blur/Enter, com clamp). */
function FracInput({
  id,
  ariaLabel,
  value,
  disabled,
  inputRef,
  onCommit,
}: {
  id: string;
  ariaLabel: string;
  value: number;
  disabled: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function commit() {
    onCommit(clamp(Math.round(Number(draft) || 1), 1, 12));
  }

  return (
    <input
      ref={inputRef}
      id={id}
      type="number"
      min={1}
      max={12}
      value={draft}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') commit();
      }}
    />
  );
}

export function ContaPassosSimulator() {
  const [config, setConfig] = useState<FracConfig>({ n1: 3, d1: 4, n2: 1, d2: 6 });
  const [custom, setCustom] = useState(false);
  const [activePreset, setActivePreset] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [arrows, setArrows] = useState<ArrowState>(NO_ARROWS);
  const [labelShown, setLabelShown] = useState(true);
  const [n1Filled, setN1Filled] = useState(false);
  const [n2Filled, setN2Filled] = useState(false);

  /** Transição atual foi para trás/reset → efeitos adiados viram instantâneos. */
  const instantRef = useRef(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const stage1Ref = useRef<HTMLDivElement | null>(null);
  const stage2Ref = useRef<HTMLDivElement | null>(null);
  const a1nRef = useRef<HTMLSpanElement | null>(null);
  const a1dRef = useRef<HTMLSpanElement | null>(null);
  const a2nRef = useRef<HTMLSpanElement | null>(null);
  const a2dRef = useRef<HTMLSpanElement | null>(null);
  const n1SlotRef = useRef<HTMLSpanElement | null>(null);
  const d1SlotRef = useRef<HTMLSpanElement | null>(null);
  const n2SlotRef = useRef<HTMLSpanElement | null>(null);
  const d2SlotRef = useRef<HTMLSpanElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  const { n1, d1, n2, d2 } = config;
  const L = lcm(d1, d2);
  const f1 = L / d1;
  const f2 = L / d2;
  const r = n1 * f1 - n2 * f2;
  const g = r === 0 ? 1 : gcd(Math.abs(r), L);
  const proper = n1 <= d1 && n2 <= d2;
  const nonNegative = n1 * d2 >= n2 * d1;
  const valid = proper && nonNegative;
  const stepCount = valid ? 12 + (g > 1 ? 1 : 0) : 0;
  const configKey = `${n1}/${d1}-${n2}/${d2}`;

  /* — geometria das setas: medida dos elementos reais, recalculada — */
  function computeArrows(): ArrowState {
    const svg = svgRef.current;
    const stage1 = stage1Ref.current?.getBoundingClientRect();
    const stage2 = stage2Ref.current?.getBoundingClientRect();
    const a1n = a1nRef.current?.getBoundingClientRect();
    const a1d = a1dRef.current?.getBoundingClientRect();
    const a2n = a2nRef.current?.getBoundingClientRect();
    const a2d = a2dRef.current?.getBoundingClientRect();
    const n1s = n1SlotRef.current?.getBoundingClientRect();
    const d1s = d1SlotRef.current?.getBoundingClientRect();
    const n2s = n2SlotRef.current?.getBoundingClientRect();
    const d2s = d2SlotRef.current?.getBoundingClientRect();
    if (
      !svg ||
      !stage1 ||
      !stage2 ||
      !a1n ||
      !a1d ||
      !a2n ||
      !a2d ||
      !n1s ||
      !d1s ||
      !n2s ||
      !d2s
    ) {
      return NO_ARROWS;
    }
    const box = svg.getBoundingClientRect();
    const arcs: ArrowState['arcs'] = [];
    let label: LabelSpec | null = null;

    /* Seta A — a divisão: desce do denominador NOVO, atravessa o corredor
       inferior e sobe até a base do denominador ANTIGO (U simétrico).
       Cards empilhados (mobile): contorna pela lateral esquerda. */
    function arrowFactor(fromNew: DOMRect, toOld: DOMRect, sf: DOMRect, st: DOMRect, eq: string, hi: string): string {
      const stacked = sf.bottom <= st.top + 4 || st.bottom <= sf.top + 4;
      if (!stacked) {
        const x1 = fromNew.left - box.left + fromNew.width / 2;
        const y1 = fromNew.bottom - box.top + 6;
        const x2 = toOld.left - box.left + toOld.width / 2;
        const y2 = toOld.bottom - box.top + 6 + 12; /* o marker come 12px */
        const valley = Math.max(y1, y2 - 12) + 34;
        label = { kind: 'eq', cx: (x1 + x2) / 2, cy: valley + 19, eq, hi };
        return `M ${x1} ${y1} C ${x1} ${valley}, ${x2} ${valley}, ${x2} ${y2}`;
      }
      const x1 = fromNew.left - box.left - 8;
      const y1 = fromNew.top - box.top + fromNew.height / 2;
      const x2 = toOld.left - box.left - 8 - 12;
      const y2 = toOld.top - box.top + toOld.height / 2;
      const bx = Math.min(x1, x2) - 24;
      label = { kind: 'eq', cx: bx - 44, cy: (y1 + y2) / 2 + 4, eq, hi };
      return `M ${x1} ${y1} C ${bx} ${y1}, ${bx} ${y2}, ${x2} ${y2}`;
    }

    /* Seta B — o fator viaja do denominador antigo ao numerador, contornando
       a própria fração pelo lado externo, carregando o número destacado. */
    function arrowUp(denRect: DOMRect, numRect: DOMRect, sg: DOMRect, side: 'left' | 'right', badge: string): string {
      const dir = side === 'right' ? 1 : -1;
      const x1 = denRect.left - box.left + (side === 'right' ? denRect.width : 0) + dir * 8;
      const y1 = denRect.top - box.top + denRect.height / 2;
      const x2 = numRect.left - box.left + (side === 'right' ? numRect.width : 0) + dir * (8 + 12);
      const y2 = numRect.top - box.top + numRect.height / 2;
      const bx = (side === 'right' ? Math.max(x1, x2) : Math.min(x1, x2)) + dir * 28;
      const bxx =
        side === 'right'
          ? Math.min(bx, sg.right - box.left - 15)
          : Math.max(bx, sg.left - box.left + 15);
      label = { kind: 'badge', x: bxx, y: (y1 + y2) / 2, text: badge };
      return `M ${x1} ${y1} C ${bx} ${y1 - 2}, ${bx} ${y2 + 2}, ${x2} ${y2}`;
    }

    /* Seta C — o transporte: do numerador original por cima até o numerador
       novo. O ápice fica acima da origem e da chegada: o bico chega apontando
       para baixo, nunca invertido. */
    function arrowCarry(fromNum: DOMRect, toSlot: DOMRect, sf: DOMRect, st: DOMRect, eq: string, hi: string): string {
      const x1 = fromNum.left - box.left + fromNum.width / 2;
      const y1 = fromNum.top - box.top - 6;
      const x2 = toSlot.left - box.left + toSlot.width / 2;
      const y2 = toSlot.top - box.top - 6 - 12; /* marker come 12px */
      const stacked = st.top >= sf.bottom - 4;
      const top = Math.min(y1, y2) - 8 - (stacked ? 12 : 0);
      label = { kind: 'plain', cx: (x1 + x2) / 2, cy: top + 14, eq, hi };
      return `M ${x1} ${y1} C ${x1} ${top}, ${x2} ${top}, ${x2} ${y2}`;
    }

    if (stepIndex > 4) {
      arcs.push({ step: 4, d: arrowFactor(d1s, a1d, stage2, stage1, `${L} ÷ ${d1}`, String(f1)) });
    }
    if (stepIndex > 5) {
      arcs.push({ step: 5, d: arrowUp(a1d, a1n, stage1, 'left', String(f1)) });
    }
    if (stepIndex > 6) {
      arcs.push({ step: 6, d: arrowCarry(a1n, n1s, stage1, stage2, `${n1} × ${f1}`, String(n1 * f1)) });
    }
    if (stepIndex > 7) {
      arcs.push({ step: 7, d: arrowFactor(d2s, a2d, stage2, stage1, `${L} ÷ ${d2}`, String(f2)) });
    }
    if (stepIndex > 8) {
      arcs.push({ step: 8, d: arrowUp(a2d, a2n, stage1, 'right', String(f2)) });
    }
    if (stepIndex > 9) {
      arcs.push({ step: 9, d: arrowCarry(a2n, n2s, stage1, stage2, `${n2} × ${f2}`, String(n2 * f2)) });
    }

    /* rótulo: apenas o do último passo executado, se for passo de seta */
    if (stepIndex - 1 > ARROW_LAST_STEP) {
      label = null;
    }
    return { arcs, label };
  }

  useLayoutEffect(() => {
    setArrows(computeArrows());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, configKey]);

  useEffect(() => {
    function recompute() {
      setArrows(computeArrows());
    }
    window.addEventListener('resize', recompute);
    return () => window.removeEventListener('resize', recompute);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, configKey]);

  /* rótulo do passo: surge 460ms depois da seta (instantâneo ao voltar) */
  useEffect(() => {
    if (instantRef.current) {
      setLabelShown(true);
      return;
    }
    setLabelShown(false);
    const timer = setTimeout(() => setLabelShown(true), 460);
    return () => clearTimeout(timer);
  }, [stepIndex]);

  /* números transportados: chegam 380ms depois da seta de transporte */
  useEffect(() => {
    if (stepIndex < 7) {
      setN1Filled(false);
      return;
    }
    if (instantRef.current) {
      setN1Filled(true);
      return;
    }
    const timer = setTimeout(() => setN1Filled(true), 380);
    return () => clearTimeout(timer);
  }, [stepIndex]);

  useEffect(() => {
    if (stepIndex < 10) {
      setN2Filled(false);
      return;
    }
    if (instantRef.current) {
      setN2Filled(true);
      return;
    }
    const timer = setTimeout(() => setN2Filled(true), 380);
    return () => clearTimeout(timer);
  }, [stepIndex]);

  /* ▶ Executar tudo: um passo a cada 900ms. */
  useEffect(() => {
    if (!running) return;
    instantRef.current = false;
    if (stepIndex >= stepCount) {
      setRunning(false);
      return;
    }
    const timer = setTimeout(() => {
      instantRef.current = false;
      setStepIndex((current) => current + 1);
    }, 900);
    return () => clearTimeout(timer);
  }, [running, stepIndex, stepCount]);

  function reset() {
    instantRef.current = true;
    setStepIndex(0);
    setRunning(false);
    setLabelShown(true);
    setN1Filled(false);
    setN2Filled(false);
  }

  function applyFromInput(next: FracConfig) {
    setConfig(next);
    setActivePreset(-1);
    reset();
  }

  function applyPreset(index: number) {
    const preset = PRESETS[index];
    if (!preset) return;
    setConfig({ ...preset });
    setActivePreset(index);
    if (custom) {
      setCustom(false);
    }
    reset();
  }

  function step() {
    if (running || !valid || stepIndex >= stepCount) return;
    instantRef.current = false;
    setStepIndex((current) => current + 1);
  }

  function back() {
    if (running || !valid || stepIndex <= 0) return;
    instantRef.current = true;
    setStepIndex((current) => current - 1);
  }

  function toggleCustom() {
    setCustom((current) => {
      const next = !current;
      if (next) {
        firstInputRef.current?.focus();
      }
      return next;
    });
  }

  /* — status do passo corrente (a especificação viva do mockup) — */
  const isMultiple = d1 % d2 === 0 || d2 % d1 === 0;
  let statusTone: '' | 'ok' | 'fail' = '';
  let statusNode: ReactNode;

  if (!valid) {
    statusTone = 'fail';
    statusNode = proper ? (
      <>A 1ª fração precisa ser maior ou igual à 2ª (resultado não pode ficar negativo). Tente, por exemplo, trocar a ordem das frações.</>
    ) : (
      <>Este simulador trabalha com frações próprias: numerador ≤ denominador. Ajuste os números e tente de novo.</>
    );
  } else if (stepIndex === 0) {
    statusNode = (
      <>
        Pronto! A conta é <Fraction n={n1} d={d1} /> − <Fraction n={n2} d={d2} />. Use ⏭ para
        avançar um passo, ou ▶ para ver tudo acontecer.
      </>
    );
  } else {
    switch (stepIndex - 1) {
      case 0:
        statusNode = (
          <>
            Denominadores diferentes: <strong>
              {d1} e {d2}
            </strong>
            . Não dá para subtrair direto — precisamos de fatias do mesmo tamanho!
          </>
        );
        break;
      case 1:
        statusTone = 'ok';
        statusNode = (
          <>
            🧮 O terreno comum é o <strong>
              MMC({d1}, {d2}) = {L}
            </strong>
            {isMultiple
              ? ` (o ${Math.max(d1, d2)} já serve: ${Math.max(d1, d2)} é múltiplo de ${Math.min(d1, d2)}!)`
              : null}
          </>
        );
        break;
      case 2:
        statusNode = (
          <>
            O novo denominador da 1ª fração: <strong>{L}</strong>. Fatias menores, mesma barra
            inteira.
          </>
        );
        break;
      case 3:
        statusNode = (
          <>
            O novo denominador da 2ª fração: <strong>{L}</strong>.
          </>
        );
        break;
      case 4:
        statusNode = (
          <>
            A conta dos denominadores da 1ª fração: <strong>
              {L} ÷ {d1} = {f1}
            </strong>
            . Esse <strong>{f1}</strong> destacado é o fator — é ele que vai multiplicar o número
            de cima.
          </>
        );
        break;
      case 5:
        statusNode = (
          <>
            O <strong>{f1}</strong> destacado sobe e multiplica o número de cima da fração:{' '}
            <strong>
              {n1} × {f1}
            </strong>
            .
          </>
        );
        break;
      case 6:
        statusNode = (
          <>
            A conta completa: <strong>
              {n1} × {f1} = {n1 * f1}
            </strong>{' '}
            — o resultado é transportado para o numerador novo.
          </>
        );
        break;
      case 7:
        statusNode = (
          <>
            Agora a conta dos denominadores da 2ª fração: <strong>
              {L} ÷ {d2} = {f2}
            </strong>{' '}
            — o fator <strong>{f2}</strong> destacado.
          </>
        );
        break;
      case 8:
        statusNode = (
          <>
            O <strong>{f2}</strong> destacado sobe e multiplica o número de cima:{' '}
            <strong>
              {n2} × {f2}
            </strong>
            .
          </>
        );
        break;
      case 9:
        statusNode = (
          <>
            E o transporte: <strong>
              {n2} × {f2} = {n2 * f2}
            </strong>
            .
          </>
        );
        break;
      case 10:
        statusTone = 'ok';
        statusNode = (
          <>
            Agora as fatias são do mesmo tamanho: <Fraction n={n1 * f1} d={L} /> −{' '}
            <Fraction n={n2 * f2} d={L} />.
          </>
        );
        break;
      case 11:
        statusTone = 'ok';
        statusNode = (
          <>
            {n1 * f1} − {n2 * f2} = <strong>{r}</strong>, denominador continua {L} →{' '}
            <Fraction n={r} d={L} /> 🎉
          </>
        );
        break;
      default:
        statusTone = 'ok';
        statusNode = (
          <>
            ✨ E dá para simplificar: <Fraction n={r} d={L} /> ={' '}
            <Fraction n={r / g} d={L / g} /> (dividi por {g}).
          </>
        );
    }
  }

  const labelOpacity = labelShown ? 1 : 0;

  return (
    <div>
      <div className="sim-state-display">
        <div className="m3c-grid">
          <div className="m3c-stage" ref={stage1Ref}>
            <div className="m3c-stage-title">Passo 1 · A conta que temos</div>
            <div className="m3c-expr">
              <span className="m3c-old">
                <Fraction
                  className="lg"
                  n={<span ref={a1nRef}>{n1}</span>}
                  d={
                    <span ref={a1dRef} className={stepIndex === 1 ? 'm3c-hl' : undefined}>
                      {d1}
                    </span>
                  }
                />
              </span>
              <span className="m3c-op">−</span>
              <span className="m3c-old">
                <Fraction
                  className="lg"
                  n={<span ref={a2nRef}>{n2}</span>}
                  d={
                    <span ref={a2dRef} className={stepIndex === 1 ? 'm3c-hl' : undefined}>
                      {d2}
                    </span>
                  }
                />
              </span>
              <span className="m3c-op">=</span>
              <span className="m3c-blank">&nbsp;</span>
            </div>
          </div>

          <div className="m3c-stage" ref={stage2Ref}>
            <div className="m3c-stage-title">Passo 2 · Frações equivalentes</div>
            <div className="m3c-expr">
              <span className={`fracv lg m3c-fracslot${stepIndex >= 11 ? ' m3c-glow' : ''}`}>
                <span className="fn">
                  <span className="m3c-slot" ref={n1SlotRef}>
                    {n1Filled ? <span className="m3c-pop">{n1 * f1}</span> : ' '}
                  </span>
                </span>
                <span className="fd m3c-tgt">
                  <span className="m3c-slot" ref={d1SlotRef}>
                    {stepIndex >= 3 ? <span className="m3c-pop">{L}</span> : ' '}
                  </span>
                </span>
              </span>
              <span className="m3c-op">−</span>
              <span className={`fracv lg m3c-fracslot${stepIndex >= 11 ? ' m3c-glow' : ''}`}>
                <span className="fn">
                  <span className="m3c-slot" ref={n2SlotRef}>
                    {n2Filled ? <span className="m3c-pop">{n2 * f2}</span> : ' '}
                  </span>
                </span>
                <span className="fd m3c-tgt">
                  <span className="m3c-slot" ref={d2SlotRef}>
                    {stepIndex >= 4 ? <span className="m3c-pop">{L}</span> : ' '}
                  </span>
                </span>
              </span>
            </div>
          </div>

          <div className="m3c-stage">
            <div className="m3c-stage-title">Passo 3 · O resultado</div>
            <div className="m3c-expr">
              {stepIndex >= 12 ? (
                <>
                  <span className="m3c-done">
                    <Fraction className="lg" n={r} d={L} />
                  </span>
                  {stepIndex >= 13 ? (
                    <>
                      <span className="m3c-op">=</span>
                      <span className="m3c-done">
                        <Fraction className="lg" n={r / g} d={L / g} />
                      </span>
                      <span className="m3c-simp">(dividi por {g})</span>
                    </>
                  ) : null}
                </>
              ) : (
                <span className="m3c-blank-lg">&nbsp;</span>
              )}
            </div>
          </div>

          <svg ref={svgRef} className="m3c-arrows" aria-hidden="true">
            <defs>
              <marker
                id="m3cArrowHead"
                markerUnits="userSpaceOnUse"
                markerWidth="12"
                markerHeight="12"
                refX="0.5"
                refY="6"
                orient="auto"
              >
                <path d="M0,0 L12,6 L0,12 Z" fill="var(--accent)" />
              </marker>
            </defs>
            {arrows.arcs.map((arc) => (
              <path
                key={arc.step}
                className="m3c-arc m3c-arc-draw"
                pathLength={1}
                d={arc.d}
                markerEnd="url(#m3cArrowHead)"
              />
            ))}
            {arrows.label?.kind === 'eq' ? (
              <>
                <text
                  className="m3c-arc-label"
                  x={arrows.label.cx - 16}
                  y={arrows.label.cy}
                  textAnchor="end"
                  style={{ opacity: labelOpacity }}
                >
                  {arrows.label.eq} =
                </text>
                <circle
                  className="m3c-arc-hi-c"
                  cx={arrows.label.cx + 16}
                  cy={arrows.label.cy - 5}
                  r={12}
                  style={{ opacity: labelOpacity }}
                />
                <text
                  className="m3c-arc-hi-t"
                  x={arrows.label.cx + 16}
                  y={arrows.label.cy}
                  textAnchor="middle"
                  style={{ opacity: labelOpacity }}
                >
                  {arrows.label.hi}
                </text>
              </>
            ) : null}
            {arrows.label?.kind === 'badge' ? (
              <>
                <circle
                  className="m3c-arc-hi-c"
                  cx={arrows.label.x}
                  cy={arrows.label.y}
                  r={12}
                  style={{ opacity: labelOpacity }}
                />
                <text
                  className="m3c-arc-hi-t"
                  x={arrows.label.x}
                  y={arrows.label.y + 5.5}
                  textAnchor="middle"
                  style={{ opacity: labelOpacity }}
                >
                  {arrows.label.text}
                </text>
              </>
            ) : null}
            {arrows.label?.kind === 'plain' ? (
              <text
                className="m3c-arc-label"
                x={arrows.label.cx}
                y={arrows.label.cy}
                textAnchor="middle"
                style={{ opacity: labelOpacity }}
              >
                <tspan>{arrows.label.eq} = </tspan>
                <tspan className="m3c-arc-hl">{arrows.label.hi}</tspan>
              </text>
            ) : null}
          </svg>
        </div>
        <SimStatusBox tone={statusTone}>{statusNode}</SimStatusBox>
      </div>

      <div className="sim-controls">
        <span className={`m3c-ctl-label${custom ? ' dim' : ''}`}>Sugestões:</span>
        {PRESETS.map((preset, index) => (
          <button
            key={`${preset.n1}-${preset.d1}-${preset.n2}-${preset.d2}`}
            type="button"
            className={`sim-btn m3c-preset${activePreset === index ? ' active' : ''}${custom ? ' dim' : ''}`}
            onClick={() => applyPreset(index)}
          >
            <Fraction n={preset.n1} d={preset.d1} /> − <Fraction n={preset.n2} d={preset.d2} />
          </button>
        ))}
        <span className="m3c-sep" aria-hidden="true" />
        <span className={`m3c-custom${custom ? ' on' : ''}`}>
          <span className="m3c-fracinput">
            <FracInput
              id="m3c-in1"
              ariaLabel="numerador da 1ª fração"
              value={n1}
              disabled={!custom}
              inputRef={firstInputRef}
              onCommit={(value) => applyFromInput({ ...config, n1: value })}
            />
            <span className="m3c-fibar" aria-hidden="true" />
            <FracInput
              id="m3c-id1"
              ariaLabel="denominador da 1ª fração"
              value={d1}
              disabled={!custom}
              onCommit={(value) => applyFromInput({ ...config, d1: value })}
            />
          </span>
          <span className="m3c-op">−</span>
          <span className="m3c-fracinput">
            <FracInput
              id="m3c-in2"
              ariaLabel="numerador da 2ª fração"
              value={n2}
              disabled={!custom}
              onCommit={(value) => applyFromInput({ ...config, n2: value })}
            />
            <span className="m3c-fibar" aria-hidden="true" />
            <FracInput
              id="m3c-id2"
              ariaLabel="denominador da 2ª fração"
              value={d2}
              disabled={!custom}
              onCommit={(value) => applyFromInput({ ...config, d2: value })}
            />
          </span>
          <button
            type="button"
            className={`sim-btn${custom ? ' active' : ''}`}
            title="Escrever as suas próprias frações"
            onClick={toggleCustom}
          >
            ✏️ Personalizar
          </button>
        </span>
      </div>

      <SimActionBar
        onRun={() => {
          instantRef.current = false;
          setRunning(true);
        }}
        onBack={back}
        onStep={step}
        onReset={reset}
        runDisabled={running || !valid || stepIndex >= stepCount}
        backDisabled={running || !valid || stepIndex <= 0}
        stepDisabled={running || !valid || stepIndex >= stepCount}
      />
    </div>
  );
}
