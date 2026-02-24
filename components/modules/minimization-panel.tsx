'use client';

import { useMemo, useState } from 'react';

import { simulateDfa } from '@/lib/automata-core';
import type { DfaDefinition, SimulationStatus } from '@/lib/types';

type MinDemoId = 'v1' | 'paridade';

const DEMOS: Record<MinDemoId, DfaDefinition> = {
  v1: {
    alphabet: ['a', 'b', 'c'],
    states: ['A', 'B', 'C', 'D'],
    initialState: 'A',
    acceptStates: ['B'],
    transitions: {
      A: { a: 'A', b: 'A', c: 'B' },
      B: { a: 'C', b: 'C', c: 'C' },
      C: { a: 'C', b: 'C', c: 'C' },
      D: { a: 'D', b: 'D', c: 'D' },
    },
  },
  paridade: {
    alphabet: ['0', '1'],
    states: ['q0', 'q1', 'u'],
    initialState: 'q0',
    acceptStates: ['q0'],
    transitions: {
      q0: { '0': 'q0', '1': 'q1' },
      q1: { '0': 'q1', '1': 'q0' },
      u: { '0': 'u', '1': 'u' },
    },
  },
};

interface MinimizeApiPayload {
  original: DfaDefinition;
  reachableStates: string[];
  removedUnreachable: string[];
  partitions: string[][][];
  stateMap: Record<string, string>;
  mergedStates: string[][];
  minimized: DfaDefinition;
}

export function MinimizationPanel() {
  const [activeDemo, setActiveDemo] = useState<MinDemoId>('v1');
  const [input, setInput] = useState<string>(JSON.stringify(DEMOS.v1, null, 2));
  const [status, setStatus] = useState<SimulationStatus>('queued');
  const [partitionStep, setPartitionStep] = useState(0);
  const [result, setResult] = useState<MinimizeApiPayload | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  function appendLog(message: string) {
    const stamp = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setLogs((prev) => [`${stamp} · ${message}`, ...prev]);
  }

  function loadDemo(demoId: MinDemoId) {
    setActiveDemo(demoId);
    setInput(JSON.stringify(DEMOS[demoId], null, 2));
    setStatus('queued');
    setResult(null);
    setPartitionStep(0);
    appendLog(`Demo carregada: ${demoId}.`);
  }

  async function runMinimization() {
    let parsed: DfaDefinition;
    try {
      parsed = JSON.parse(input) as DfaDefinition;
    } catch (error) {
      setStatus('failed');
      appendLog(`JSON inválido: ${(error as Error).message}.`);
      return;
    }

    setStatus('running');
    appendLog('Executando minimização...');

    const response = await fetch('/api/simulator/afd/minimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ automaton: parsed }),
    });

    const payload = (await response.json()) as MinimizeApiPayload & { error?: string };
    if (!response.ok) {
      setStatus('failed');
      appendLog(payload.error || 'Falha ao minimizar.');
      return;
    }

    setResult(payload);
    setPartitionStep(0);
    setStatus('completed');
    appendLog('Minimização concluída.');
  }

  function nextPartition() {
    if (!result) {
      void runMinimization();
      return;
    }

    if (partitionStep < result.partitions.length - 1) {
      setPartitionStep((previous) => previous + 1);
      appendLog(`Avançando para o passo ${partitionStep + 1}.`);
      return;
    }

    appendLog('Partições estabilizadas.');
  }

  const equivalenceRows = useMemo(() => {
    if (!result) return [] as Array<{ word: string; before: string; after: string; ok: boolean }>;

    const words = ['c', 'abc', 'ababc', 'abca'];
    return words.map((word) => {
      const before = simulateDfa(result.original, word).result;
      const after = simulateDfa(result.minimized, word).result;
      return { word, before, after, ok: before === after };
    });
  }, [result]);

  function renderTransitionTable(automaton: DfaDefinition | null) {
    if (!automaton) return null;

    return (
      <div className="overflow-x-auto">
        <table className="delta-table">
          <thead>
            <tr>
              <th>δ</th>
              {automaton.alphabet.map((symbol) => <th key={symbol}>{symbol}</th>)}
            </tr>
          </thead>
          <tbody>
            {automaton.states.map((stateName) => (
              <tr key={stateName}>
                <td className="state-cell">{stateName}</td>
                {automaton.alphabet.map((symbol) => (
                  <td key={`${stateName}-${symbol}`}>{automaton.transitions[stateName]?.[symbol] || '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="section-card">
        <h2 className="text-xl font-bold">Minimização de AFD</h2>
        <p className="mt-1 text-sm text-slate-600">Remoção de inalcançáveis + refinamento de partições.</p>

        <label className="mt-3 block text-xs uppercase tracking-wide text-slate-500" htmlFor="min-input">
          AFD em JSON
        </label>
        <textarea
          id="min-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="mt-1 min-h-[180px] w-full rounded-xl border border-slate-300 p-2 font-mono text-sm"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={`button ${activeDemo === 'v1' ? 'primary' : 'secondary'}`} onClick={() => loadDemo('v1')}>Demo V1</button>
          <button type="button" className={`button ${activeDemo === 'paridade' ? 'primary' : 'secondary'}`} onClick={() => loadDemo('paridade')}>Demo paridade</button>
          <button type="button" className="button primary" onClick={() => void runMinimization()}>Minimizar</button>
          <button type="button" className="button secondary" onClick={nextPartition}>Próxima partição</button>
          <button type="button" className="button secondary" onClick={() => loadDemo(activeDemo)}>Reset</button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="sim-box"><div className="sim-box-label">Status</div><p className="sim-box-value flex items-center gap-2 text-base"><span className={`status-dot ${status}`}></span>{status}</p></article>
          <article className="sim-box"><div className="sim-box-label">Estados antes</div><p className="sim-box-value">{result?.original.states.length ?? '—'}</p></article>
          <article className="sim-box"><div className="sim-box-label">Estados depois</div><p className="sim-box-value">{result?.minimized.states.length ?? '—'}</p></article>
          <article className="sim-box"><div className="sim-box-label">Mesclas</div><p className="sim-box-value text-base">{result?.mergedStates.length ? result.mergedStates.map((group) => `{${group.join(',')}}`).join(' + ') : '—'}</p></article>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="section-card">
          <h3 className="font-semibold">AFD original</h3>
          <div className="mt-3">{renderTransitionTable(result?.original || null)}</div>
        </article>

        <article className="section-card">
          <h3 className="font-semibold">AFD minimizado</h3>
          <div className="mt-3">{renderTransitionTable(result?.minimized || null)}</div>
        </article>
      </section>

      <section className="section-card">
        <h3 className="font-semibold">Partições</h3>
        <div className="mt-3 grid gap-2">
          {result?.partitions.map((partition, index) => (
            <article key={`partition-${index}`} className="partition-step">
              <strong>Passo {index}</strong>
              <code>{partition.map((group) => `{${group.join(',')}}`).join(' | ')}</code>
              {index === partitionStep ? (
                <p className="mt-2 text-xs font-semibold text-blue-700">
                  {index === result.partitions.length - 1 ? 'partições estabilizadas' : 'passo atual'}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="section-card">
        <h3 className="font-semibold">Equivalência por palavra</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="delta-table">
            <thead>
              <tr><th>Palavra</th><th>Original</th><th>Minimizado</th><th>Status</th></tr>
            </thead>
            <tbody>
              {equivalenceRows.map((row) => (
                <tr key={row.word}>
                  <td>{row.word}</td>
                  <td>{row.before}</td>
                  <td>{row.after}</td>
                  <td>{row.ok ? 'OK' : 'DIVERGENTE'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section-card">
        <h3 className="font-semibold">Log</h3>
        <div className="run-log mt-3">
          {logs.length === 0 ? <div className="text-sm text-slate-500">Sem eventos ainda.</div> : logs.map((entry, index) => (
            <div key={`${entry}-${index}`} className="run-log-item">
              <strong>{entry.split(' · ')[0]}</strong>
              <span>{entry.slice(entry.indexOf(' · ') + 3)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
