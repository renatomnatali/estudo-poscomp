'use client';

import { useEffect, useState, type ReactNode } from 'react';

/** Máximo divisor comum (a, b ≥ 0). */
export function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Mínimo múltiplo comum. */
export function lcm(a: number, b: number): number {
  return (a / gcd(a, b)) * b;
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Fração na notação vertical do DS (.fracv). */
export function Fraction({
  n,
  d,
  className = '',
}: {
  n: ReactNode;
  d: ReactNode;
  className?: string;
}) {
  return (
    <span className={`fracv ${className}`.trim()}>
      <span className="fn">{n}</span>
      <span className="fd">{d}</span>
    </span>
  );
}

/** Fração empilhada dos painéis de igualdade (.frac-stack). */
export function FractionStack({
  n,
  d,
  className = '',
}: {
  n: ReactNode;
  d: ReactNode;
  className?: string;
}) {
  return (
    <span className={`frac-stack ${className}`.trim()}>
      <span className="fn">{n}</span>
      <span className="fd">{d}</span>
    </span>
  );
}

/** Barra de ações padrão dos simuladores (▶ ⏮ ⏭ ↺ [+ extras]). */
export function SimActionBar({
  onRun,
  onBack,
  onStep,
  onReset,
  runDisabled = false,
  backDisabled = false,
  stepDisabled = false,
  children,
}: {
  onRun: () => void;
  onBack: () => void;
  onStep: () => void;
  onReset: () => void;
  runDisabled?: boolean;
  backDisabled?: boolean;
  stepDisabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="sim-action-bar">
      <button
        type="button"
        className="sim-action-btn sim-action-btn-primary"
        disabled={runDisabled}
        onClick={onRun}
      >
        ▶ Executar tudo
      </button>
      <button
        type="button"
        className="sim-action-btn sim-action-btn-secondary"
        disabled={backDisabled}
        onClick={onBack}
      >
        ⏮ Anterior
      </button>
      <button
        type="button"
        className="sim-action-btn sim-action-btn-secondary"
        disabled={stepDisabled}
        onClick={onStep}
      >
        ⏭ Próximo
      </button>
      <button type="button" className="sim-action-btn sim-action-btn-tertiary" onClick={onReset}>
        ↺ Reiniciar
      </button>
      {children}
    </div>
  );
}

/** Caixa de mensagem de status dentro da área de animação. */
export function SimStatusBox({ tone = '', children }: { tone?: '' | 'ok' | 'fail'; children: ReactNode }) {
  /* role=status: leitores de tela anunciam a mensagem do passo (SC 4.1.3) */
  return (
    <div role="status" className={`sim-status${tone ? ` ${tone}` : ''}`}>
      {children}
    </div>
  );
}

/** Rótulo de grupo de controles (o mesmo estilo dos "Sugestões:" do mockup). */
export function SimGroupLabel({ children }: { children: ReactNode }) {
  return (
    <span style={{ fontFamily: 'var(--fm)', fontSize: '.78rem', color: 'var(--muted)' }}>
      {children}
    </span>
  );
}

/**
 * Campo numérico que commita no blur/Enter (com clamp), não a cada tecla —
 * mesmo comportamento de `change` dos inputs do mockup.
 */
export function NumberField({
  id,
  label,
  value,
  min,
  max,
  onCommit,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function commit() {
    onCommit(clamp(Math.round(Number(draft) || min), min, max));
  }

  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            commit();
          }
        }}
      />
    </>
  );
}
