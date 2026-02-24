'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { DfaDefinition, DfaSimulationResult, DfaTraceStep, SimulationStatus } from '@/lib/types';

type DemoId = 'demo-c' | 'demo-b' | 'demo-a';
type FocusField = 'machine' | 'language' | 'word';

interface MachineConfig {
  loopSymbols: string[];
  transitionSymbol: string;
  transitions: DfaDefinition['transitions'];
}

interface SessionData {
  word: string;
  trace: DfaTraceStep[];
  finalResult: DfaSimulationResult['result'];
  finalState: string | null;
}

const ALPHABET = ['a', 'b', 'c'] as const;

const DEMOS: Record<DemoId, { loopSymbols: string[]; transitionSymbol: string; word: string }> = {
  'demo-c': { loopSymbols: ['a', 'b'], transitionSymbol: 'c', word: 'ababc' },
  'demo-b': { loopSymbols: ['a', 'c'], transitionSymbol: 'b', word: 'acccb' },
  'demo-a': { loopSymbols: ['b', 'c'], transitionSymbol: 'a', word: 'bccca' },
};

function buildMachineConfig(loopSymbols: string[], transitionSymbol: string): MachineConfig | null {
  const loops = Array.from(new Set(loopSymbols.map((symbol) => symbol.toLowerCase()))).filter((symbol) =>
    ALPHABET.includes(symbol as (typeof ALPHABET)[number])
  );

  const transition = transitionSymbol.toLowerCase();
  if (!ALPHABET.includes(transition as (typeof ALPHABET)[number])) return null;
  if (loops.includes(transition)) return null;

  const transitions: DfaDefinition['transitions'] = {
    e1: {},
    e2: {},
    e3: {},
  };

  ALPHABET.forEach((symbol) => {
    if (symbol === transition) transitions.e1[symbol] = 'e2';
    else if (loops.includes(symbol)) transitions.e1[symbol] = 'e1';
    else transitions.e1[symbol] = 'e3';

    transitions.e2[symbol] = 'e3';
    transitions.e3[symbol] = 'e3';
  });

  return {
    loopSymbols: loops,
    transitionSymbol: transition,
    transitions,
  };
}

function languageExpressionFor(config: MachineConfig): string {
  return `L={${config.loopSymbols.join(',')}}*{${config.transitionSymbol}}`;
}

function machineExpressionFor(config: MachineConfig): string {
  const e1Rules = ALPHABET.map((symbol) => `δ(e1,${symbol})=${config.transitions.e1[symbol]}`).join(', ');
  const e2Rules = ALPHABET.map((symbol) => `δ(e2,${symbol})=e3`).join(', ');
  const e3Rules = ALPHABET.map((symbol) => `δ(e3,${symbol})=e3`).join(', ');

  return `M1=(E={e1,e2,e3}, Σ={a,b,c}, i=e1, F={e2}, ${e1Rules}, ${e2Rules}, ${e3Rules})`;
}

function parseLanguageExpression(raw: string): MachineConfig | null {
  const compact = raw.toLowerCase().replace(/\s+/g, '');
  const match = compact.match(/(?:l=)?\{([abc](?:,[abc])*)\}\*\{?([abc])\}?/);
  if (!match) return null;

  const loopSymbols = match[1].split(',').filter(Boolean);
  return buildMachineConfig(loopSymbols, match[2]);
}

function parseMachineExpression(raw: string): MachineConfig | null {
  const compact = raw.toLowerCase().replace(/\s+/g, '');
  const transitionMatch = compact.match(/δ\(e1,([abc])\)=e2/);
  const loopMatches = Array.from(compact.matchAll(/δ\(e1,([abc])\)=e1/g)).map((item) => item[1]);

  if (!transitionMatch || loopMatches.length === 0) return null;
  return buildMachineConfig(loopMatches, transitionMatch[1]);
}

function toDfa(config: MachineConfig): DfaDefinition {
  return {
    alphabet: [...ALPHABET],
    states: ['e1', 'e2', 'e3'],
    initialState: 'e1',
    acceptStates: ['e2'],
    transitions: config.transitions,
  };
}

function edgeFor(fromState: string, symbol: string, transitionSymbol: string): string {
  if (fromState === 'e1') return symbol === transitionSymbol ? 'e1-transition' : 'e1-loop';
  if (fromState === 'e2') return 'e2-e3';
  return 'e3-loop';
}

export function AfdSimulator() {
  const [activeDemo, setActiveDemo] = useState<DemoId>('demo-c');
  const [machineExpr, setMachineExpr] = useState('');
  const [languageExpr, setLanguageExpr] = useState('');
  const [word, setWord] = useState('');

  const [status, setStatus] = useState<SimulationStatus>('queued');
  const [result, setResult] = useState('—');
  const [currentState, setCurrentState] = useState('e1');
  const [currentPos, setCurrentPos] = useState(0);
  const [activeTransition, setActiveTransition] = useState<{ fromState: string; symbol: string } | null>(null);

  const [focusedField, setFocusedField] = useState<FocusField>('language');
  const machineRef = useRef<HTMLTextAreaElement | null>(null);
  const languageRef = useRef<HTMLInputElement | null>(null);
  const wordRef = useRef<HTMLInputElement | null>(null);

  const [machineConfig, setMachineConfig] = useState<MachineConfig | null>(null);

  const sessionRef = useRef<SessionData | null>(null);
  const cursorRef = useRef(0);
  const statusRef = useRef<SimulationStatus>('queued');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function appendLog(_message: string) {
    // Mantido como no-op para preservar trilha de chamadas sem expor painel de log.
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function setRunStatus(next: SimulationStatus) {
    statusRef.current = next;
    setStatus(next);
  }

  function finishSession() {
    const session = sessionRef.current;
    if (!session) return;

    setRunStatus('completed');
    setResult(session.finalResult);
    setCurrentState(session.finalState || 'e1');
    setActiveTransition(null);

    appendLog(session.finalResult === 'ACEITA' ? 'Palavra reconhecida.' : 'Palavra não reconhecida.');
    stopTimer();
  }

  function stepExecution() {
    if (statusRef.current !== 'running') return;
    const session = sessionRef.current;
    if (!session) return;

    if (cursorRef.current >= session.trace.length) {
      finishSession();
      return;
    }

    const step = session.trace[cursorRef.current];
    setActiveTransition({ fromState: step.fromState, symbol: step.symbol });
    setCurrentState(step.toState);
    setCurrentPos(step.stepIndex);
    cursorRef.current += 1;
    appendLog(`δ(${step.fromState}, ${step.symbol}) = ${step.toState}`);

    if (cursorRef.current >= session.trace.length) {
      finishSession();
    }
  }

  function readConfig(): MachineConfig | null {
    return parseMachineExpression(machineExpr) || parseLanguageExpression(languageExpr);
  }

  async function prepareSession(): Promise<boolean> {
    const config = readConfig();
    if (!config) {
      setRunStatus('failed');
      setResult('INVÁLIDA');
      appendLog('Expressão inválida. Use o formato das demos.');
      return false;
    }

    setMachineConfig(config);

    const normalizedWord = word.trim().toLowerCase();
    if (!/^[abc]*$/.test(normalizedWord)) {
      setRunStatus('failed');
      setResult('INVÁLIDA');
      appendLog('A palavra aceita apenas símbolos a, b e c.');
      return false;
    }

    const response = await fetch('/api/simulator/afd/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ automaton: toDfa(config), inputWord: normalizedWord }),
    });

    const payload = (await response.json()) as DfaSimulationResult & { error?: string };

    if (!response.ok || payload.status === 'failed') {
      setRunStatus('failed');
      setResult('INVÁLIDA');
      appendLog(payload.error || 'Falha de simulação.');
      return false;
    }

    sessionRef.current = {
      word: normalizedWord,
      trace: payload.trace,
      finalResult: payload.result,
      finalState: payload.finalState,
    };

    cursorRef.current = 0;
    setCurrentState('e1');
    setCurrentPos(0);
    setActiveTransition(null);
    setRunStatus('running');
    setResult('PENDENTE');
    appendLog(`Execução iniciada para ${normalizedWord || 'ε'}.`);

    if (payload.trace.length === 0) {
      finishSession();
    }

    return true;
  }

  async function onRunAll() {
    stopTimer();
    const ok = await prepareSession();
    if (!ok) return;

    timerRef.current = setInterval(() => {
      stepExecution();
      if (statusRef.current !== 'running') stopTimer();
    }, 700);
  }

  async function onRunStep() {
    stopTimer();

    if (statusRef.current === 'queued' || !sessionRef.current) {
      const ok = await prepareSession();
      if (!ok) return;
    }

    stepExecution();
  }

  function onReset() {
    stopTimer();
    sessionRef.current = null;
    cursorRef.current = 0;
    setRunStatus('queued');
    setResult('—');
    setCurrentState('e1');
    setCurrentPos(0);
    setActiveTransition(null);
    appendLog('Execução resetada.');
  }

  function onCancel() {
    if (statusRef.current !== 'running') return;
    stopTimer();
    setRunStatus('canceled');
    setResult('CANCELADA');
    appendLog('Execução cancelada pelo usuário.');
  }

  function insertSymbol(symbol: string) {
    const field =
      focusedField === 'machine'
        ? machineRef.current
        : focusedField === 'word'
          ? wordRef.current
          : languageRef.current;

    if (!field) return;

    const start = field.selectionStart ?? field.value.length;
    const end = field.selectionEnd ?? field.value.length;
    const nextValue = `${field.value.slice(0, start)}${symbol}${field.value.slice(end)}`;

    if (focusedField === 'machine') setMachineExpr(nextValue);
    if (focusedField === 'language') setLanguageExpr(nextValue);
    if (focusedField === 'word') setWord(nextValue);

    requestAnimationFrame(() => {
      field.focus();
      const nextPos = start + symbol.length;
      field.setSelectionRange(nextPos, nextPos);
    });
  }

  function applyDemo(demoId: DemoId) {
    const demo = DEMOS[demoId];
    const config = buildMachineConfig(demo.loopSymbols, demo.transitionSymbol);
    if (!config) return;

    setActiveDemo(demoId);
    setMachineConfig(config);
    setMachineExpr(machineExpressionFor(config));
    setLanguageExpr(languageExpressionFor(config));
    setWord(demo.word);

    onReset();
    appendLog(`Demo carregada: ${demoId}.`);
  }

  useEffect(() => {
    const demo = DEMOS['demo-c'];
    const config = buildMachineConfig(demo.loopSymbols, demo.transitionSymbol);
    if (config) {
      setMachineConfig(config);
      setMachineExpr(machineExpressionFor(config));
      setLanguageExpr(languageExpressionFor(config));
      setWord(demo.word);
      appendLog('Demo carregada: demo-c.');
    }

    return () => {
      stopTimer();
    };
  }, []);

  const tapeChars = useMemo(() => {
    const sessionWord = sessionRef.current?.word ?? word.trim();
    return sessionWord.length > 0 ? sessionWord.split('') : ['ε'];
  }, [word]);

  const activeEdge = useMemo(() => {
    if (!activeTransition || !machineConfig) return null;
    return edgeFor(activeTransition.fromState, activeTransition.symbol, machineConfig.transitionSymbol);
  }, [activeTransition, machineConfig]);

  const loopLabel = machineConfig?.loopSymbols.join(',') || 'a,b';
  const transitionLabel = machineConfig?.transitionSymbol || 'c';
  const sinkLabel = ALPHABET.join(',');

  return (
    <div className="space-y-5">
      <section className="section-card">
        <h2 className="text-xl font-bold">Simulador AFD</h2>
        <p className="mt-1 text-sm text-slate-600">
          Entrada por expressão da máquina + expressão da linguagem + palavra, com demonstrações prontas.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-500" htmlFor="machine-expr">
              Expressão da máquina
            </label>
            <textarea
              id="machine-expr"
              ref={machineRef}
              value={machineExpr}
              onChange={(event) => setMachineExpr(event.target.value)}
              onFocus={() => setFocusedField('machine')}
              className="mt-1 min-h-[140px] w-full rounded-xl border border-slate-300 p-2 font-mono text-sm"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-500" htmlFor="language-expr">
              Expressão da linguagem
            </label>
            <input
              id="language-expr"
              ref={languageRef}
              value={languageExpr}
              onChange={(event) => setLanguageExpr(event.target.value)}
              onFocus={() => setFocusedField('language')}
              className="mt-1 w-full rounded-xl border border-slate-300 p-2"
            />

            <label className="mt-3 block text-xs uppercase tracking-wide text-slate-500" htmlFor="word-expr">
              Palavra de entrada
            </label>
            <input
              id="word-expr"
              ref={wordRef}
              value={word}
              onChange={(event) => setWord(event.target.value)}
              onFocus={() => setFocusedField('word')}
              className="mt-1 w-full rounded-xl border border-slate-300 p-2 font-mono"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {['a', 'b', 'c', ',', '*', '=', '{', '}', '(', ')', 'δ', 'Σ', '→'].map((symbol) => (
            <button
              key={symbol}
              type="button"
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm hover:border-blue-400"
              onClick={() => insertSymbol(symbol)}
            >
              {symbol}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {(
            Object.keys(DEMOS) as DemoId[]
          ).map((demoId) => (
            <button
              key={demoId}
              type="button"
              onClick={() => applyDemo(demoId)}
              className={`rounded-xl border p-3 text-left ${activeDemo === demoId ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white'}`}
            >
              <strong className="block text-sm">{demoId}</strong>
              <span className="text-xs text-slate-600">{languageExpressionFor(buildMachineConfig(DEMOS[demoId].loopSymbols, DEMOS[demoId].transitionSymbol)!)}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="button primary" onClick={onRunAll}>Executar automático</button>
          <button type="button" className="button secondary" onClick={onRunStep}>Próximo passo</button>
          <button type="button" className="button secondary" onClick={onReset}>Reset</button>
          <button type="button" className="button secondary" onClick={onCancel}>Cancelar</button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="sim-box"><div className="sim-box-label">Estado atual</div><p className="sim-box-value">{currentState}</p></article>
          <article className="sim-box"><div className="sim-box-label">Posição</div><p className="sim-box-value">{currentPos}/{sessionRef.current?.word.length ?? word.trim().length}</p></article>
          <article className="sim-box"><div className="sim-box-label">Resultado</div><p className="sim-box-value">{result}</p></article>
          <article className="sim-box"><div className="sim-box-label">Status</div><p className="sim-box-value flex items-center gap-2 text-base"><span className={`status-dot ${status}`}></span>{status}</p></article>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {tapeChars.map((char, index) => {
            const sessionWord = sessionRef.current?.word ?? word.trim();
            const isRead = sessionWord.length > 0 && index < currentPos;
            const isCurrent = sessionWord.length > 0 && index === currentPos && status === 'running';
            return (
              <span key={`${char}-${index}`} className={`tape-char ${isRead ? 'is-read' : ''} ${isCurrent ? 'is-current' : ''}`}>
                {char}
              </span>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="section-card">
          <h3 className="font-semibold">Diagrama do AFD</h3>
          <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
            <svg className="afd-canvas" viewBox="0 0 760 350" role="img" aria-label="Autômato finito determinístico com estados e1, e2 e e3">
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#334155"></polygon>
                </marker>
              </defs>

              <g className="edge-group" data-afd-edge="start">
                <line className="edge-line" x1="22" y1="180" x2="118" y2="180" markerEnd="url(#arrowhead)"></line>
              </g>

              <g className={`edge-group ${activeEdge === 'e1-transition' ? 'is-active' : ''}`} data-afd-edge="e1-transition">
                <line className="edge-line" x1="198" y1="180" x2="352" y2="180" markerEnd="url(#arrowhead)"></line>
                <text className="edge-label" x="272" y="163" data-afd-label-transition>{transitionLabel}</text>
              </g>

              <g className={`edge-group ${activeEdge === 'e1-loop' ? 'is-active' : ''}`} data-afd-edge="e1-loop">
                <path className="edge-loop" d="M 130 228 C 86 262, 98 314, 145 307 C 192 300, 193 248, 163 232" markerEnd="url(#arrowhead)"></path>
                <text className="edge-label" x="102" y="330" data-afd-label-loop>{loopLabel}</text>
              </g>

              <g className={`edge-group ${activeEdge === 'e2-e3' ? 'is-active' : ''}`} data-afd-edge="e2-e3">
                <line className="edge-line" x1="430" y1="156" x2="430" y2="66" markerEnd="url(#arrowhead)"></line>
                <text className="edge-label" x="446" y="116" data-afd-label-sink>{sinkLabel}</text>
              </g>

              <g className={`edge-group ${activeEdge === 'e3-loop' ? 'is-active' : ''}`} data-afd-edge="e3-loop">
                <path className="edge-loop" d="M 480 30 C 517 -9, 580 5, 560 56 C 551 81, 520 89, 498 70" markerEnd="url(#arrowhead)"></path>
                <text className="edge-label" x="566" y="41" data-afd-label-sink-loop>{sinkLabel}</text>
              </g>

              <g data-afd-state="e1" className={`state-group ${currentState === 'e1' ? 'is-active' : ''}`}>
                <circle className="state-circle" cx="158" cy="180" r="48"></circle>
                <text className="state-label" x="140" y="194">e1</text>
              </g>

              <g data-afd-state="e2" className={`state-group ${currentState === 'e2' ? 'is-active' : ''}`}>
                <circle className="state-circle" cx="430" cy="180" r="48"></circle>
                <circle className="state-final-ring" cx="430" cy="180" r="38"></circle>
                <text className="state-label" x="412" y="194">e2</text>
              </g>

              <g data-afd-state="e3" className={`state-group ${currentState === 'e3' ? 'is-active' : ''}`}>
                <circle className="state-circle" cx="430" cy="40" r="38"></circle>
                <text className="state-label" x="413" y="50">e3</text>
              </g>
            </svg>
          </div>
        </article>

        <article className="section-card">
          <h3 className="font-semibold">Função de transição δ</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="delta-table">
              <thead>
                <tr><th>δ</th><th>a</th><th>b</th><th>c</th></tr>
              </thead>
              <tbody>
                {['e1', 'e2', 'e3'].map((stateName) => (
                  <tr key={stateName}>
                    <td className="state-cell">{stateName}</td>
                    {ALPHABET.map((symbol) => (
                      <td
                        key={`${stateName}-${symbol}`}
                        data-afd-cell={`${stateName}-${symbol}`}
                        className={activeTransition?.fromState === stateName && activeTransition.symbol === symbol ? 'is-active' : ''}
                      >
                        {machineConfig?.transitions[stateName]?.[symbol] || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

    </div>
  );
}
