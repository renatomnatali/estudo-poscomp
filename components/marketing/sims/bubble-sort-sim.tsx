'use client';

import { useEffect, useState } from 'react';

const INITIAL = [42, 17, 88, 23, 9, 56, 31, 71];

export function BubbleSortSim() {
  const [arr, setArr] = useState<number[]>(INITIAL);
  const [i, setI] = useState(0);
  const [j, setJ] = useState(0);
  const [swaps, setSwaps] = useState(0);
  const [comps, setComps] = useState(0);
  const [done, setDone] = useState(false);
  const [running, setRunning] = useState(false);
  const [lastAction, setLastAction] = useState<'compare' | 'swap' | null>(null);

  function step() {
    if (done) return;
    const n = arr.length;
    if (i >= n - 1) {
      setDone(true);
      setRunning(false);
      return;
    }
    if (j >= n - 1 - i) {
      setI(i + 1);
      setJ(0);
      return;
    }
    setComps(comps + 1);
    if (arr[j] > arr[j + 1]) {
      const next = arr.slice();
      [next[j], next[j + 1]] = [next[j + 1], next[j]];
      setArr(next);
      setSwaps(swaps + 1);
      setLastAction('swap');
    } else {
      setLastAction('compare');
    }
    setJ(j + 1);
  }

  useEffect(() => {
    if (!running || done) return;
    const id = setTimeout(step, 380);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, done, i, j, arr, comps, swaps]);

  function reset() {
    const next = INITIAL.slice().sort(() => Math.random() - 0.5);
    setArr(next);
    setI(0);
    setJ(0);
    setSwaps(0);
    setComps(0);
    setDone(false);
    setRunning(false);
    setLastAction(null);
  }
  function play() {
    setRunning(true);
  }
  function pause() {
    setRunning(false);
  }

  const max = Math.max(...arr);

  let statusText: string;
  let statusClass: string;
  if (done) {
    statusText = '✓ ordenado';
    statusClass = 'accepted';
  } else if (running) {
    statusText = 'Executando';
    statusClass = 'running';
  } else if (comps === 0) {
    statusText = 'Pronto';
    statusClass = 'idle';
  } else {
    statusText = `passo ${comps}`;
    statusClass = 'running';
  }

  return (
    <div className="aut-stage">
      <div className="hd">
        <div className="hd-l">
          <span className="hd-eyebrow">F1 · Análise de Algoritmos · módulo 1</span>
          <span className="hd-ttl">
            Bubble Sort —{' '}
            <span style={{ color: 'var(--em)', fontFamily: 'var(--fm)' }}>O(n²)</span>
          </span>
        </div>
        <div className="hd-r">
          <span className="aut-pill live-badge">
            <span className="live-dot" /> AO VIVO
          </span>
          <span className="aut-pill">n = {arr.length}</span>
        </div>
      </div>

      <div className="bs-stage">
        {arr.map((v, idx) => {
          const isCompared = !done && (idx === j || idx === j + 1);
          const isSwap = isCompared && lastAction === 'swap';
          const isSorted = idx >= arr.length - i;
          const cls = [
            'bs-bar',
            isSwap ? 'swap' : '',
            isCompared && !isSwap ? 'compare' : '',
            isSorted ? 'sorted' : '',
            done ? 'done' : '',
          ]
            .filter(Boolean)
            .join(' ');
          const h = 12 + (v / max) * 110;
          return (
            <div className="bs-col" key={idx}>
              <div className={cls} style={{ height: `${h}px` }}>
                <span className="bs-num">{v}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bs-meta">
        <div className="bs-meta-cell">
          <div className="bs-meta-l">comparações</div>
          <div className="bs-meta-v tabular">{comps}</div>
        </div>
        <div className="bs-meta-cell">
          <div className="bs-meta-l">trocas</div>
          <div className="bs-meta-v tabular" style={{ color: 'var(--amb)' }}>
            {swaps}
          </div>
        </div>
        <div className="bs-meta-cell">
          <div className="bs-meta-l">passe</div>
          <div className="bs-meta-v tabular">
            {Math.min(done ? arr.length - 1 : i + 1, arr.length - 1)}
            <span style={{ fontSize: '0.7em', color: 'var(--on-dark-3)' }}>
              /{arr.length - 1}
            </span>
          </div>
        </div>
      </div>

      <div className="aut-controls">
        {!running && !done && (
          <span className="try-me-wrap">
            <button className="aut-btn" onClick={play} type="button">
              ▶ Executar
            </button>
          </span>
        )}
        {!running && !done && comps > 0 && (
          <button className="aut-btn ghost" onClick={step} type="button">
            Passo →
          </button>
        )}
        {running && (
          <button className="aut-btn ghost" onClick={pause} type="button">
            ❚❚ Pausar
          </button>
        )}
        <button className="aut-btn ghost" onClick={reset} type="button">
          ↺ Embaralhar
        </button>
      </div>

      <div className="aut-status">
        <div className="aut-status-left">
          <span style={{ fontFamily: 'var(--fm)', color: 'var(--on-dark-3)' }}>
            complexidade:
          </span>
          <span style={{ color: '#fff', fontWeight: 600, fontFamily: 'var(--fm)' }}>
            O(n²) ≈ {(arr.length * (arr.length - 1)) / 2} comparações
          </span>
        </div>
        <div className={`aut-status-right ${statusClass}`}>{statusText}</div>
      </div>

      <div className="aut-hint">
        <span>↑ clique em &ldquo;executar&rdquo; ou &ldquo;embaralhar&rdquo;</span>
      </div>
    </div>
  );
}
