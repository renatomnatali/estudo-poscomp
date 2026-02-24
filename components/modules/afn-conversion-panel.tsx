'use client';

import { useMemo, useState } from 'react';

import { epsilonClosure, formatSet, simulateDfa, simulateNfa } from '@/lib/automata-core';
import type { DfaDefinition, NfaDefinition, SimulationStatus } from '@/lib/types';

type ConvDemoId = 'a-b' | 'termina-ab';

const DEMOS: Record<ConvDemoId, NfaDefinition> = {
  'a-b': {
    alphabet: ['a', 'b'],
    states: ['q0', 'q1', 'q2'],
    initialState: 'q0',
    acceptStates: ['q2'],
    transitions: {
      q0: { a: [], b: [], 'ε': ['q1'] },
      q1: { a: ['q1'], b: ['q2'], 'ε': [] },
      q2: { a: [], b: [], 'ε': [] },
    },
  },
  'termina-ab': {
    alphabet: ['a', 'b'],
    states: ['p0', 'p1', 'p2', 'p3'],
    initialState: 'p0',
    acceptStates: ['p3'],
    transitions: {
      p0: { a: ['p0', 'p1'], b: ['p0'], 'ε': [] },
      p1: { a: [], b: ['p2'], 'ε': [] },
      p2: { a: [], b: [], 'ε': ['p3'] },
      p3: { a: [], b: [], 'ε': [] },
    },
  },
};

interface ConvertPayload {
  subsetMap: Record<string, string[]>;
  subsetKeyMap: Record<string, string>;
  dfa: DfaDefinition;
}

interface ConversionResult {
  parsed: NfaDefinition;
  converted: ConvertPayload;
}

export function AfnConversionPanel() {
  const [activeDemo, setActiveDemo] = useState<ConvDemoId>('a-b');
  const [input, setInput] = useState<string>(JSON.stringify(DEMOS['a-b'], null, 2));
  const [status, setStatus] = useState<SimulationStatus>('queued');
  const [nfa, setNfa] = useState<NfaDefinition | null>(null);
  const [converted, setConverted] = useState<ConvertPayload | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [wordResults, setWordResults] = useState<Array<{ word: string; nfa: string; dfa: string; ok: boolean }>>([]);

  function appendLog(message: string) {
    const stamp = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setLogs((prev) => [`${stamp} · ${message}`, ...prev]);
  }

  function loadDemo(demoId: ConvDemoId) {
    setActiveDemo(demoId);
    setInput(JSON.stringify(DEMOS[demoId], null, 2));
    setStatus('queued');
    setNfa(null);
    setConverted(null);
    setWordResults([]);
    appendLog(`Demo carregada: ${demoId}.`);
  }

  async function runConversion(): Promise<ConversionResult | null> {
    let parsed: NfaDefinition;
    try {
      parsed = JSON.parse(input) as NfaDefinition;
    } catch (error) {
      setStatus('failed');
      appendLog(`JSON inválido: ${(error as Error).message}.`);
      return null;
    }

    setStatus('running');
    appendLog('Executando conversão AFN→AFD...');

    const response = await fetch('/api/simulator/afn/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ automaton: parsed }),
    });

    const payload = (await response.json()) as ConvertPayload & { error?: string };
    if (!response.ok) {
      setStatus('failed');
      appendLog(payload.error || 'Falha na conversão.');
      return null;
    }

    setNfa(parsed);
    setConverted(payload);
    setWordResults([]);
    setStatus('completed');
    appendLog(`Conversão concluída com ${payload.dfa.states.length} estados.`);
    return {
      parsed,
      converted: payload,
    };
  }

  async function testWord(word: string) {
    let activeNfa = nfa;
    let activeConverted = converted;

    if (!activeNfa || !activeConverted) {
      const conversion = await runConversion();
      if (!conversion) return;
      activeNfa = conversion.parsed;
      activeConverted = conversion.converted;
    }

    const nfaResult = simulateNfa(activeNfa, word);
    const dfaResult = simulateDfa(activeConverted.dfa, word);
    const nfaLabel = nfaResult.accepted ? 'ACEITA' : 'REJEITA';
    const dfaLabel = dfaResult.result;

    setWordResults((prev) => [...prev, { word, nfa: nfaLabel, dfa: dfaLabel, ok: nfaLabel === dfaLabel }]);
    appendLog(`Teste ${word}: AFN=${nfaLabel}, AFD=${dfaLabel}.`);
  }

  const closureRows = useMemo(() => {
    if (!nfa) return [] as Array<{ state: string; closure: string[] }>;
    return nfa.states.map((stateName) => ({
      state: stateName,
      closure: epsilonClosure(nfa, [stateName]),
    }));
  }, [nfa]);

  function renderNfaTable(automaton: NfaDefinition | null) {
    if (!automaton) return null;

    return (
      <div className="overflow-x-auto">
        <table className="delta-table">
          <thead>
            <tr>
              <th>δ</th>
              {automaton.alphabet.map((symbol) => <th key={symbol}>{symbol}</th>)}
              <th>ε</th>
            </tr>
          </thead>
          <tbody>
            {automaton.states.map((stateName) => (
              <tr key={stateName}>
                <td className="state-cell">{stateName}</td>
                {automaton.alphabet.map((symbol) => (
                  <td key={`${stateName}-${symbol}`}>{formatSet(automaton.transitions[stateName]?.[symbol] || [])}</td>
                ))}
                <td>{formatSet(automaton.transitions[stateName]?.['ε'] || [])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderDfaTable(automaton: DfaDefinition | null) {
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
        <h2 className="text-xl font-bold">Conversão AFN→AFD</h2>
        <p className="mt-1 text-sm text-slate-600">Construção por subconjuntos com epsilon-fecho.</p>

        <label className="mt-3 block text-xs uppercase tracking-wide text-slate-500" htmlFor="conv-input">
          AFN em JSON
        </label>
        <textarea
          id="conv-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="mt-1 min-h-[180px] w-full rounded-xl border border-slate-300 p-2 font-mono text-sm"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={`button ${activeDemo === 'a-b' ? 'primary' : 'secondary'}`} onClick={() => loadDemo('a-b')}>Demo a*b</button>
          <button type="button" className={`button ${activeDemo === 'termina-ab' ? 'primary' : 'secondary'}`} onClick={() => loadDemo('termina-ab')}>Demo termina com ab</button>
          <button type="button" className="button primary" onClick={() => void runConversion()}>Converter</button>
          <button type="button" className="button secondary" onClick={() => loadDemo(activeDemo)}>Reset</button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <article className="sim-box"><div className="sim-box-label">Status</div><p className="sim-box-value flex items-center gap-2 text-base"><span className={`status-dot ${status}`}></span>{status}</p></article>
          <article className="sim-box"><div className="sim-box-label">Inicial AFD</div><p className="sim-box-value">{converted?.dfa.initialState ?? '—'}</p></article>
          <article className="sim-box"><div className="sim-box-label">Finais AFD</div><p className="sim-box-value text-base">{converted ? `{${converted.dfa.acceptStates.join(',')}}` : '—'}</p></article>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="section-card">
          <h3 className="font-semibold">Tabela AFN</h3>
          <div className="mt-3">{renderNfaTable(nfa)}</div>

          <h4 className="mt-4 font-semibold">ε-fechos</h4>
          <div className="mt-2 grid gap-2">
            {closureRows.map((item) => (
              <article key={item.state} className="partition-step">
                <strong>ε-fecho({item.state})</strong>
                <code>{formatSet(item.closure)}</code>
              </article>
            ))}
          </div>
        </article>

        <article className="section-card">
          <h3 className="font-semibold">Tabela AFD</h3>
          <div className="mt-3">{renderDfaTable(converted?.dfa || null)}</div>

          <h4 className="mt-4 font-semibold">Subconjunto → estado</h4>
          <div className="mt-2 grid gap-2">
            {Object.entries(converted?.subsetMap || {}).map(([stateName, subset]) => (
              <div key={stateName} className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm">
                {stateName} = {formatSet(subset)}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="section-card">
        <h3 className="font-semibold">Validação de palavras</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="button secondary" onClick={() => void testWord('ab')}>Testar ab</button>
          <button type="button" className="button secondary" onClick={() => void testWord('aab')}>Testar aab</button>
          <button type="button" className="button secondary" onClick={() => void testWord('bbb')}>Testar bbb</button>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="delta-table">
            <thead>
              <tr><th>Palavra</th><th>AFN</th><th>AFD</th><th>Status</th></tr>
            </thead>
            <tbody>
              {wordResults.map((row, index) => (
                <tr key={`${row.word}-${index}`}>
                  <td>{row.word}</td>
                  <td>{row.nfa}</td>
                  <td>{row.dfa}</td>
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
