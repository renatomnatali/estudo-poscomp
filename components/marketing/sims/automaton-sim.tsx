'use client';

import { useEffect, useMemo, useState } from 'react';

type StateId = 'q0' | 'q1' | 'q2';

const AFD = {
  states: ['q0', 'q1', 'q2'] as StateId[],
  initial: 'q0' as StateId,
  accept: new Set<StateId>(['q2']),
  alphabet: ['a', 'b'] as const,
  delta: {
    q0: { a: 'q1', b: 'q0' },
    q1: { a: 'q1', b: 'q2' },
    q2: { a: 'q1', b: 'q0' },
  } as Record<StateId, Record<'a' | 'b', StateId>>,
};

const NODES: Record<StateId, { x: number; y: number; label: string }> = {
  q0: { x: 90, y: 110, label: 'q₀' },
  q1: { x: 270, y: 110, label: 'q₁' },
  q2: { x: 450, y: 110, label: 'q₂' },
};

type EdgeKind =
  | 'straight'
  | 'loop-bottom'
  | 'loop-top'
  | 'curve-back-up'
  | 'curve-back-far';

interface EdgeDef {
  id: string;
  from: StateId;
  to: StateId;
  symbol: 'a' | 'b';
  kind: EdgeKind;
}

const EDGES: EdgeDef[] = [
  { id: 'q0-q1', from: 'q0', to: 'q1', symbol: 'a', kind: 'straight' },
  { id: 'q1-q2', from: 'q1', to: 'q2', symbol: 'b', kind: 'straight' },
  { id: 'q0-q0', from: 'q0', to: 'q0', symbol: 'b', kind: 'loop-bottom' },
  { id: 'q1-q1', from: 'q1', to: 'q1', symbol: 'a', kind: 'loop-top' },
  { id: 'q2-q1', from: 'q2', to: 'q1', symbol: 'a', kind: 'curve-back-up' },
  { id: 'q2-q0', from: 'q2', to: 'q0', symbol: 'b', kind: 'curve-back-far' },
];

const R = 26;

function edgePath(e: EdgeDef): { d: string; lblX: number; lblY: number } {
  const a = NODES[e.from];
  const b = NODES[e.to];
  if (e.kind === 'straight') {
    const dx = b.x - a.x;
    const sx = a.x + R * Math.sign(dx);
    const ex = b.x - R * Math.sign(dx);
    return { d: `M ${sx} ${a.y} L ${ex} ${b.y}`, lblX: (sx + ex) / 2, lblY: a.y - 12 };
  }
  if (e.kind === 'loop-top') {
    const cx = a.x;
    const cy = a.y - R;
    return {
      d: `M ${cx - 10} ${cy - 2} C ${cx - 28} ${cy - 36}, ${cx + 28} ${cy - 36}, ${cx + 10} ${cy - 2}`,
      lblX: cx,
      lblY: cy - 28,
    };
  }
  if (e.kind === 'loop-bottom') {
    const cx = a.x;
    const cy = a.y + R;
    return {
      d: `M ${cx - 10} ${cy + 2} C ${cx - 28} ${cy + 36}, ${cx + 28} ${cy + 36}, ${cx + 10} ${cy + 2}`,
      lblX: cx,
      lblY: cy + 36,
    };
  }
  if (e.kind === 'curve-back-up') {
    const startX = NODES[e.from].x - R;
    const endX = NODES[e.to].x + R;
    return {
      d: `M ${startX} ${NODES[e.from].y - 6} C ${startX - 30} ${NODES[e.from].y - 60}, ${endX + 30} ${NODES[e.to].y - 60}, ${endX} ${NODES[e.to].y - 6}`,
      lblX: (startX + endX) / 2,
      lblY: NODES[e.from].y - 56,
    };
  }
  // curve-back-far
  const startX = NODES[e.from].x - R;
  const endX = NODES[e.to].x + R;
  return {
    d: `M ${startX} ${NODES[e.from].y + 10} C ${startX - 50} ${NODES[e.from].y + 90}, ${endX + 50} ${NODES[e.to].y + 90}, ${endX} ${NODES[e.to].y + 10}`,
    lblX: (startX + endX) / 2,
    lblY: NODES[e.from].y + 90,
  };
}

interface TraceStep {
  state: StateId | null;
  edge: string | null;
  symbol?: 'a' | 'b';
  rejected?: boolean;
}

export function AutomatonSim() {
  const [input, setInput] = useState('aab');
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);

  const trace = useMemo<TraceStep[]>(() => {
    const t: TraceStep[] = [{ state: AFD.initial, edge: null }];
    let s: StateId = AFD.initial;
    for (const ch of input) {
      if (ch !== 'a' && ch !== 'b') {
        t.push({ state: null, edge: null, rejected: true });
        break;
      }
      const next = AFD.delta[s][ch];
      const edgeId = `${s}-${next}`;
      t.push({ state: next, edge: edgeId, symbol: ch });
      s = next;
    }
    return t;
  }, [input]);

  const current = trace[Math.min(step, trace.length - 1)];
  const finished = step >= trace.length - 1;
  const accepted = finished && !!current.state && AFD.accept.has(current.state);
  const rejected = finished && (!current.state || !AFD.accept.has(current.state));

  useEffect(() => {
    if (!running) return;
    if (finished) {
      setRunning(false);
      return;
    }
    const id = setTimeout(() => setStep((s) => s + 1), 650);
    return () => clearTimeout(id);
  }, [running, step, finished]);

  function handleInput(v: string) {
    const cleaned = v.toLowerCase().replace(/[^ab]/g, '').slice(0, 12);
    setInput(cleaned);
    setStep(0);
    setRunning(false);
  }

  function reset() {
    setStep(0);
    setRunning(false);
  }
  function play() {
    reset();
    setTimeout(() => setRunning(true), 50);
  }
  function stepOnce() {
    if (!finished) setStep((s) => s + 1);
  }

  const litEdge = current.edge;

  let statusText: string;
  let statusClass: string;
  if (step === 0) {
    statusText = 'Pronto';
    statusClass = 'idle';
  } else if (running) {
    statusText = 'Executando';
    statusClass = 'running';
  } else if (accepted) {
    statusText = '✓ aceita';
    statusClass = 'accepted';
  } else if (rejected) {
    statusText = '✗ rejeita';
    statusClass = 'rejected';
  } else {
    statusText = `Passo ${step}/${trace.length - 1}`;
    statusClass = 'running';
  }

  const examples = ['ab', 'aab', 'abab', 'baab', 'bba', 'aba'];

  return (
    <div className="aut-stage">
      <div className="hd">
        <div className="hd-l">
          <span className="hd-eyebrow">F6 · Linguagens Formais · módulo 3</span>
          <span className="hd-ttl">
            AFD que reconhece strings terminadas em{' '}
            <span style={{ color: 'var(--em)', fontFamily: 'var(--fm)' }}>&quot;ab&quot;</span>
          </span>
        </div>
        <div className="hd-r">
          <span className="aut-pill live-badge">
            <span className="live-dot" /> AO VIVO
          </span>
          <span className="aut-pill">Σ = {'{a, b}'}</span>
        </div>
      </div>

      <div className="aut-canvas">
        <svg viewBox="0 0 540 220" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker
              id="arr"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="rgba(255,255,255,.45)" />
            </marker>
            <marker
              id="arr-lit"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="var(--sap-l)" />
            </marker>
          </defs>

          {EDGES.map((e) => {
            const { d, lblX, lblY } = edgePath(e);
            const lit = litEdge === e.id;
            return (
              <g key={e.id}>
                <path
                  d={d}
                  className={`aut-edge ${lit ? 'lit' : ''}`}
                  markerEnd={lit ? 'url(#arr-lit)' : 'url(#arr)'}
                />
                <text x={lblX} y={lblY} className={`aut-edge-label ${lit ? 'lit' : ''}`}>
                  {e.symbol}
                </text>
              </g>
            );
          })}

          {AFD.states.map((s) => {
            const n = NODES[s];
            const isAcc = AFD.accept.has(s);
            const isInit = s === AFD.initial;
            const isActive = current.state === s && step > 0;
            const cls = ['aut-state', isInit ? 'init' : '', isAcc ? 'acc' : '', isActive ? 'active' : '']
              .filter(Boolean)
              .join(' ');
            return (
              <g key={s}>
                {isAcc && <circle cx={n.x} cy={n.y} r={R + 4} className="aut-acc-ring" />}
                <circle cx={n.x} cy={n.y} r={R} className={cls} />
                <text x={n.x} y={n.y} className="aut-state-label">
                  {n.label}
                </text>
                {isInit && (
                  <line
                    x1={n.x - R - 18}
                    y1={n.y}
                    x2={n.x - R - 2}
                    y2={n.y}
                    stroke="rgba(255,255,255,.4)"
                    strokeWidth="1.5"
                    markerEnd="url(#arr)"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="aut-tape">
        {(input.length === 0 ? ['ε'] : input.split('')).map((ch, i) => {
          const isCurrent = i === step - 1 && !finished;
          const isConsumed = i < step - 1 || (finished && i < step && accepted);
          const isRejected = finished && rejected;
          const cls = [
            'aut-cell',
            isCurrent ? 'current' : '',
            isConsumed && !isRejected ? 'consumed' : '',
            isRejected && i < step ? 'rejected' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <div key={i} className={cls}>
              {ch}
            </div>
          );
        })}
      </div>

      <div className="aut-controls">
        <div className="aut-input-group">
          <span className="aut-input-label">w =</span>
          <input
            className="aut-input"
            value={input}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="aab"
            spellCheck={false}
          />
        </div>
        {!running && !finished && step === 0 && (
          <span className="try-me-wrap">
            <button
              className="aut-btn"
              onClick={play}
              disabled={input.length === 0}
              type="button"
            >
              ▶ Simular
            </button>
          </span>
        )}
        {!running && !finished && step > 0 && (
          <button className="aut-btn" onClick={stepOnce} type="button">
            Passo →
          </button>
        )}
        {(running || finished) && (
          <button className="aut-btn ghost" onClick={reset} type="button">
            ↺ Reiniciar
          </button>
        )}
      </div>

      <div className="aut-quick">
        <span className="aut-quick-label">Tente:</span>
        {examples.map((ex) => (
          <button key={ex} className="aut-chip" onClick={() => handleInput(ex)} type="button">
            {ex}
          </button>
        ))}
      </div>

      <div className="aut-status">
        <div className="aut-status-left">
          <span style={{ fontFamily: 'var(--fm)', color: 'var(--on-dark-3)' }}>
            estado atual:
          </span>
          <span style={{ color: '#fff', fontWeight: 600 }}>{current.state ?? '—'}</span>
        </div>
        <div className={`aut-status-right ${statusClass}`}>{statusText}</div>
      </div>

      <div className="aut-hint">
        <span>↑ digite uma string ou clique em &ldquo;simular&rdquo;</span>
      </div>
    </div>
  );
}
