const API = {
  async get(path) {
    const response = await fetch(path);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}`);
    }
    return response.json();
  },

  async post(path, body) {
    const response = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}`);
    }

    return response.json();
  },
};

const core = window.AutomataCore;

function nowLabel() {
  return new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function setStatus(statusDot, statusText, status) {
  statusDot.className = `status-dot ${status}`;
  statusText.textContent = status;
}

function appendLog(logEl, message) {
  const row = document.createElement('div');
  row.className = 'run-log-item';

  const time = document.createElement('strong');
  time.textContent = nowLabel();

  const text = document.createElement('div');
  text.innerHTML = message;

  row.appendChild(time);
  row.appendChild(text);
  logEl.prepend(row);
}

function setupViewSwitcher() {
  const buttons = Array.from(document.querySelectorAll('[data-view-btn]'));
  const views = Array.from(document.querySelectorAll('[data-view]'));

  function activate(targetView) {
    views.forEach((view) => {
      const isActive = view.getAttribute('data-view') === targetView;
      view.hidden = !isActive;
    });

    buttons.forEach((button) => {
      const isActive = button.getAttribute('data-view-btn') === targetView;
      button.classList.toggle('primary', isActive);
      button.classList.toggle('secondary', !isActive);
    });
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      activate(button.getAttribute('data-view-btn'));
    });
  });

  activate('afd');
}

function setupAfdSimulator() {
  const alphabet = ['a', 'b', 'c'];

  const demos = {
    'demo-c': {
      loopSymbols: ['a', 'b'],
      transitionSymbol: 'c',
      word: 'ababc',
    },
    'demo-b': {
      loopSymbols: ['a', 'c'],
      transitionSymbol: 'b',
      word: 'acccb',
    },
    'demo-a': {
      loopSymbols: ['b', 'c'],
      transitionSymbol: 'a',
      word: 'bccca',
    },
  };

  const machineInput = document.querySelector('[data-afd-machine-input]');
  const languageInput = document.querySelector('[data-afd-language-input]');
  const wordInput = document.querySelector('[data-afd-word-input]');
  const statusDot = document.querySelector('[data-afd-status-dot]');
  const statusText = document.querySelector('[data-afd-status-text]');
  const currentStateEl = document.querySelector('[data-afd-current-state]');
  const currentPosEl = document.querySelector('[data-afd-current-pos]');
  const resultEl = document.querySelector('[data-afd-result]');
  const tapeEl = document.querySelector('[data-afd-tape]');
  const logEl = document.querySelector('[data-afd-log]');

  const runButton = document.querySelector('[data-afd-run]');
  const stepButton = document.querySelector('[data-afd-step]');
  const resetButton = document.querySelector('[data-afd-reset]');
  const cancelButton = document.querySelector('[data-afd-cancel]');

  const demoButtons = Array.from(document.querySelectorAll('[data-afd-demo]'));
  const symbolButtons = Array.from(document.querySelectorAll('[data-afd-symbol]'));

  if (!machineInput || !languageInput || !wordInput) return;

  let activeInput = languageInput;
  let machineConfig = null;
  let timer = null;

  const state = {
    session: null,
    currentState: 'e1',
    currentPos: 0,
    cursor: 0,
    activeDemo: 'demo-c',
  };

  function stopTimer() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function clearDeltaHighlights() {
    document
      .querySelectorAll('[data-afd-cell].is-active')
      .forEach((cell) => cell.classList.remove('is-active'));
  }

  function highlightDeltaCell(fromState, symbol) {
    clearDeltaHighlights();
    const cell = document.querySelector(`[data-afd-cell="${fromState}-${symbol}"]`);
    if (cell) cell.classList.add('is-active');
  }

  function renderTape() {
    const word = state.session ? state.session.word : (wordInput.value || '').trim();
    tapeEl.innerHTML = '';

    const chars = word.length ? word.split('') : ['ε'];
    chars.forEach((char, index) => {
      const chip = document.createElement('span');
      chip.className = 'tape-char';
      chip.textContent = char;

      if (word.length > 0) {
        if (index < state.currentPos) chip.classList.add('is-read');
        if (index === state.currentPos && statusText.textContent === 'running') {
          chip.classList.add('is-current');
        }
      }

      tapeEl.appendChild(chip);
    });
  }

  function syncSummary() {
    const wordLength = state.session ? state.session.word.length : (wordInput.value || '').trim().length;
    currentStateEl.textContent = state.currentState;
    currentPosEl.textContent = `${state.currentPos}/${wordLength}`;
  }

  function buildMachineConfig(loopSymbols, transitionSymbol) {
    const loops = Array.from(
      new Set(loopSymbols.map((symbol) => String(symbol).toLowerCase()))
    ).filter((symbol) => alphabet.includes(symbol));

    const transition = String(transitionSymbol || '').toLowerCase();
    if (!alphabet.includes(transition)) return null;
    if (loops.includes(transition)) return null;

    const transitions = { e1: {}, e2: {}, e3: {} };
    alphabet.forEach((symbol) => {
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

  function toAutomaton(config) {
    return {
      alphabet: alphabet.slice(),
      states: ['e1', 'e2', 'e3'],
      initialState: 'e1',
      acceptStates: ['e2'],
      transitions: config.transitions,
    };
  }

  function languageExpressionFor(config) {
    return `L={${config.loopSymbols.join(',')}}*{${config.transitionSymbol}}`;
  }

  function machineExpressionFor(config) {
    const e1Rules = alphabet.map((symbol) => `δ(e1,${symbol})=${config.transitions.e1[symbol]}`).join(', ');
    const e2Rules = alphabet.map((symbol) => `δ(e2,${symbol})=e3`).join(', ');
    const e3Rules = alphabet.map((symbol) => `δ(e3,${symbol})=e3`).join(', ');

    return `M1=(E={e1,e2,e3}, Σ={a,b,c}, i=e1, F={e2}, ${e1Rules}, ${e2Rules}, ${e3Rules})`;
  }

  function parseLanguageExpression(raw) {
    const compact = String(raw || '').toLowerCase().replace(/\s+/g, '');
    const match = compact.match(/(?:l=)?\{([abc](?:,[abc])*)\}\*\{?([abc])\}?/);
    if (!match) return null;

    return buildMachineConfig(match[1].split(',').filter(Boolean), match[2]);
  }

  function parseMachineExpression(raw) {
    const compact = String(raw || '').toLowerCase().replace(/\s+/g, '');
    const transitionMatch = compact.match(/δ\(e1,([abc])\)=e2/);
    const loopMatches = Array.from(compact.matchAll(/δ\(e1,([abc])\)=e1/g)).map((match) => match[1]);

    if (!transitionMatch || loopMatches.length === 0) return null;
    return buildMachineConfig(loopMatches, transitionMatch[1]);
  }

  function readConfig() {
    return parseMachineExpression(machineInput.value) || parseLanguageExpression(languageInput.value);
  }

  function syncDeltaTable(config) {
    alphabet.forEach((symbol) => {
      const e1Cell = document.querySelector(`[data-afd-cell="e1-${symbol}"]`);
      const e2Cell = document.querySelector(`[data-afd-cell="e2-${symbol}"]`);
      const e3Cell = document.querySelector(`[data-afd-cell="e3-${symbol}"]`);
      if (e1Cell) e1Cell.textContent = config.transitions.e1[symbol];
      if (e2Cell) e2Cell.textContent = config.transitions.e2[symbol];
      if (e3Cell) e3Cell.textContent = config.transitions.e3[symbol];
    });
  }

  async function prepareSession() {
    const config = readConfig();
    if (!config) {
      setStatus(statusDot, statusText, 'failed');
      resultEl.textContent = 'INVÁLIDA';
      appendLog(logEl, 'Expressão inválida. Use as demos como referência.');
      return false;
    }

    machineConfig = config;
    syncDeltaTable(config);

    const word = String(wordInput.value || '').trim().toLowerCase();
    if (!/^[abc]*$/.test(word)) {
      setStatus(statusDot, statusText, 'failed');
      resultEl.textContent = 'INVÁLIDA';
      appendLog(logEl, 'A palavra aceita apenas símbolos <code>a</code>, <code>b</code> e <code>c</code>.');
      return false;
    }

    try {
      const response = await API.post('/api/simulator/afd/run', {
        automaton: toAutomaton(config),
        inputWord: word,
      });

      if (response.status === 'failed') {
        setStatus(statusDot, statusText, 'failed');
        resultEl.textContent = 'INVÁLIDA';
        appendLog(logEl, response.error || 'Falha de simulação.');
        return false;
      }

      state.session = {
        word,
        trace: response.trace || [],
        finalResult: response.result,
        finalState: response.finalState,
      };

      state.cursor = 0;
      state.currentState = 'e1';
      state.currentPos = 0;

      setStatus(statusDot, statusText, 'running');
      resultEl.textContent = 'PENDENTE';
      clearDeltaHighlights();
      syncSummary();
      renderTape();

      appendLog(logEl, `Execução iniciada para <code>${word || 'ε'}</code>.`);

      if (state.session.trace.length === 0) {
        finishSession();
      }

      return true;
    } catch (error) {
      setStatus(statusDot, statusText, 'failed');
      resultEl.textContent = 'INVÁLIDA';
      appendLog(logEl, `Erro de API: ${escapeHtml(error.message)}.`);
      return false;
    }
  }

  function finishSession() {
    if (!state.session) return;

    setStatus(statusDot, statusText, 'completed');
    resultEl.textContent = state.session.finalResult;
    state.currentState = state.session.finalState || state.currentState;

    syncSummary();
    renderTape();

    appendLog(
      logEl,
      state.session.finalResult === 'ACEITA'
        ? 'Palavra reconhecida.'
        : 'Palavra não reconhecida.'
    );
  }

  function doStep() {
    if (!state.session || statusText.textContent !== 'running') return;

    if (state.cursor >= state.session.trace.length) {
      finishSession();
      return;
    }

    const step = state.session.trace[state.cursor];
    highlightDeltaCell(step.fromState, step.symbol);
    state.currentState = step.toState;
    state.currentPos = step.stepIndex;
    state.cursor += 1;

    syncSummary();
    renderTape();
    appendLog(logEl, `<code>δ(${step.fromState}, ${step.symbol}) = ${step.toState}</code>`);

    if (state.cursor >= state.session.trace.length) {
      finishSession();
    }
  }

  async function runAll() {
    stopTimer();

    const ready = await prepareSession();
    if (!ready) return;

    timer = window.setInterval(() => {
      doStep();
      if (statusText.textContent !== 'running') {
        stopTimer();
      }
    }, 700);
  }

  async function runStep() {
    stopTimer();

    if (!state.session || state.currentPos === 0 || statusText.textContent === 'queued') {
      const ready = await prepareSession();
      if (!ready) return;
    }

    doStep();
  }

  function reset() {
    stopTimer();
    state.session = null;
    state.cursor = 0;
    state.currentState = 'e1';
    state.currentPos = 0;
    setStatus(statusDot, statusText, 'queued');
    resultEl.textContent = '—';
    clearDeltaHighlights();
    syncSummary();
    renderTape();
    appendLog(logEl, 'Execução resetada.');
  }

  function cancel() {
    if (statusText.textContent !== 'running') return;
    stopTimer();
    setStatus(statusDot, statusText, 'canceled');
    resultEl.textContent = 'CANCELADA';
    appendLog(logEl, 'Execução cancelada pelo usuário.');
  }

  function setActiveInput(input) {
    activeInput = input;
  }

  function insertSymbol(symbol) {
    const field = activeInput || languageInput;
    field.focus();

    const start = field.selectionStart ?? field.value.length;
    const end = field.selectionEnd ?? field.value.length;

    field.value = field.value.slice(0, start) + symbol + field.value.slice(end);

    const next = start + symbol.length;
    field.setSelectionRange(next, next);
  }

  function loadDemo(id) {
    const demo = demos[id];
    if (!demo) return;

    const config = buildMachineConfig(demo.loopSymbols, demo.transitionSymbol);
    if (!config) return;

    machineConfig = config;
    state.activeDemo = id;

    machineInput.value = machineExpressionFor(config);
    languageInput.value = languageExpressionFor(config);
    wordInput.value = demo.word;

    demoButtons.forEach((button) => {
      button.classList.toggle('is-active', button.getAttribute('data-afd-demo') === id);
    });

    syncDeltaTable(config);
    reset();
    appendLog(logEl, `Demo carregada: ${id}.`);
  }

  [machineInput, languageInput, wordInput].forEach((input) => {
    input.addEventListener('focus', () => setActiveInput(input));
    input.addEventListener('click', () => setActiveInput(input));
  });

  symbolButtons.forEach((button) => {
    button.addEventListener('click', () => {
      insertSymbol(button.getAttribute('data-afd-symbol') || '');
    });
  });

  demoButtons.forEach((button) => {
    button.addEventListener('click', () => {
      loadDemo(button.getAttribute('data-afd-demo'));
    });
  });

  runButton.addEventListener('click', runAll);
  stepButton.addEventListener('click', runStep);
  resetButton.addEventListener('click', reset);
  cancelButton.addEventListener('click', cancel);

  loadDemo('demo-c');
}

function setupMinimization() {
  const input = document.querySelector('[data-min-input]');
  const runButton = document.querySelector('[data-min-run]');
  const stepButton = document.querySelector('[data-min-step]');
  const resetButton = document.querySelector('[data-min-reset]');
  const demoButtons = Array.from(document.querySelectorAll('[data-min-demo]'));

  const statusDot = document.querySelector('[data-min-status-dot]');
  const statusText = document.querySelector('[data-min-status-text]');

  const beforeEl = document.querySelector('[data-min-before]');
  const afterEl = document.querySelector('[data-min-after]');
  const mergedEl = document.querySelector('[data-min-merged]');

  const originalTable = document.querySelector('[data-min-original]');
  const minimizedTable = document.querySelector('[data-min-minimized]');
  const partitionsEl = document.querySelector('[data-min-partitions]');
  const equivalenceEl = document.querySelector('[data-min-equivalence]');
  const logEl = document.querySelector('[data-min-log]');

  if (!input || !runButton) return;

  const demos = {
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

  const words = ['c', 'abc', 'ababc', 'abca'];

  const state = {
    activeDemo: 'v1',
    original: null,
    result: null,
    partitionStep: 0,
  };

  function renderTransitionTable(table, automaton) {
    if (!table || !automaton) return;

    const header = table.querySelector('thead tr');
    header.innerHTML = '<th>δ</th>' + automaton.alphabet.map((symbol) => `<th>${symbol}</th>`).join('');

    const body = table.querySelector('tbody');
    body.innerHTML = '';

    automaton.states.forEach((source) => {
      const row = document.createElement('tr');
      row.innerHTML += `<td class="state-cell">${source}</td>`;
      automaton.alphabet.forEach((symbol) => {
        row.innerHTML += `<td>${automaton.transitions[source][symbol] || '—'}</td>`;
      });
      body.appendChild(row);
    });
  }

  function renderPartitions() {
    partitionsEl.innerHTML = '';
    if (!state.result) return;

    state.result.partitions.forEach((partition, index) => {
      const block = document.createElement('div');
      block.className = 'partition-step';

      const title = document.createElement('strong');
      title.textContent = `Passo ${index}`;
      block.appendChild(title);

      const value = document.createElement('code');
      value.textContent = partition
        .map((group) => `{${group.join(',')}}`)
        .join(' | ');
      block.appendChild(value);

      if (index === state.partitionStep) {
        const marker = document.createElement('p');
        marker.style.marginTop = '8px';
        marker.style.marginBottom = '0';
        marker.style.fontSize = '0.76rem';
        marker.style.color = '#1d4ed8';
        marker.textContent = index === state.result.partitions.length - 1
          ? 'partições estabilizadas'
          : 'passo atual';
        block.appendChild(marker);
      }

      partitionsEl.appendChild(block);
    });
  }

  function renderEquivalence() {
    equivalenceEl.innerHTML = '';
    if (!state.original || !state.result) return;

    words.forEach((word) => {
      const before = core.simulateDfa(state.original, word);
      const after = core.simulateDfa(state.result.minimized, word);
      const ok = before.result === after.result;

      const row = document.createElement('tr');
      row.innerHTML = `<td>${word}</td><td>${before.result}</td><td>${after.result}</td><td>${ok ? 'OK' : 'DIVERGENTE'}</td>`;
      equivalenceEl.appendChild(row);
    });
  }

  function syncSummary() {
    if (!state.original || !state.result) return;
    beforeEl.textContent = String(state.original.states.length);
    afterEl.textContent = String(state.result.minimized.states.length);

    mergedEl.textContent = state.result.mergedStates.length
      ? state.result.mergedStates.map((group) => `{${group.join(',')}}`).join(' + ')
      : 'nenhuma';
  }

  function loadDemo(id) {
    const demo = demos[id];
    if (!demo) return;

    state.activeDemo = id;
    state.original = null;
    state.result = null;
    state.partitionStep = 0;

    input.value = JSON.stringify(demo, null, 2);
    setStatus(statusDot, statusText, 'queued');
    beforeEl.textContent = '—';
    afterEl.textContent = '—';
    mergedEl.textContent = '—';

    originalTable.querySelector('thead tr').innerHTML = '';
    originalTable.querySelector('tbody').innerHTML = '';
    minimizedTable.querySelector('thead tr').innerHTML = '';
    minimizedTable.querySelector('tbody').innerHTML = '';
    partitionsEl.innerHTML = '';
    equivalenceEl.innerHTML = '';

    demoButtons.forEach((button) => {
      button.classList.toggle('is-active', button.getAttribute('data-min-demo') === id);
    });

    appendLog(logEl, `Demo carregada: ${id}.`);
  }

  async function runMinimization() {
    let parsed;
    try {
      parsed = JSON.parse(input.value);
    } catch (error) {
      setStatus(statusDot, statusText, 'failed');
      appendLog(logEl, `JSON inválido: ${escapeHtml(error.message)}.`);
      return;
    }

    setStatus(statusDot, statusText, 'running');
    appendLog(logEl, 'Executando minimização...');

    try {
      const response = await API.post('/api/simulator/afd/minimize', {
        automaton: parsed,
      });

      state.original = parsed;
      state.result = response;
      state.partitionStep = 0;

      renderTransitionTable(originalTable, parsed);
      renderTransitionTable(minimizedTable, response.minimized);
      renderPartitions();
      renderEquivalence();
      syncSummary();

      setStatus(statusDot, statusText, 'completed');
      appendLog(logEl, 'Minimização concluída.');
    } catch (error) {
      setStatus(statusDot, statusText, 'failed');
      appendLog(logEl, `Falha ao minimizar: ${escapeHtml(error.message)}.`);
    }
  }

  function nextPartition() {
    if (!state.result) {
      runMinimization();
      return;
    }

    if (state.partitionStep < state.result.partitions.length - 1) {
      state.partitionStep += 1;
      renderPartitions();
      appendLog(logEl, `Avançando para passo ${state.partitionStep}.`);
      return;
    }

    renderPartitions();
    appendLog(logEl, 'Partições estabilizadas.');
  }

  runButton.addEventListener('click', runMinimization);
  stepButton.addEventListener('click', nextPartition);
  resetButton.addEventListener('click', () => loadDemo(state.activeDemo));

  demoButtons.forEach((button) => {
    button.addEventListener('click', () => {
      loadDemo(button.getAttribute('data-min-demo'));
    });
  });

  loadDemo('v1');
}

function setupAfnConversion() {
  const input = document.querySelector('[data-conv-input]');
  const runButton = document.querySelector('[data-conv-run]');
  const resetButton = document.querySelector('[data-conv-reset]');
  const demoButtons = Array.from(document.querySelectorAll('[data-conv-demo]'));
  const testButtons = Array.from(document.querySelectorAll('[data-conv-word]'));

  const statusDot = document.querySelector('[data-conv-status-dot]');
  const statusText = document.querySelector('[data-conv-status-text]');
  const initialEl = document.querySelector('[data-conv-initial]');
  const finalsEl = document.querySelector('[data-conv-finals]');

  const nfaTable = document.querySelector('[data-conv-nfa]');
  const dfaTable = document.querySelector('[data-conv-dfa]');
  const closureEl = document.querySelector('[data-conv-closures]');
  const subsetEl = document.querySelector('[data-conv-subsets]');
  const resultsEl = document.querySelector('[data-conv-results]');
  const logEl = document.querySelector('[data-conv-log]');

  if (!input || !runButton) return;

  const demos = {
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

  const state = {
    activeDemo: 'a-b',
    nfa: null,
    converted: null,
  };

  function transitionsToText(value) {
    if (!Array.isArray(value) || value.length === 0) return '∅';
    return `{${value.join(',')}}`;
  }

  function renderNfaTable(nfa) {
    const header = nfaTable.querySelector('thead tr');
    header.innerHTML = '<th>δ</th>' + nfa.alphabet.map((symbol) => `<th>${symbol}</th>`).join('') + '<th>ε</th>';

    const body = nfaTable.querySelector('tbody');
    body.innerHTML = '';

    nfa.states.forEach((source) => {
      const row = document.createElement('tr');
      row.innerHTML += `<td class="state-cell">${source}</td>`;

      nfa.alphabet.forEach((symbol) => {
        row.innerHTML += `<td>${transitionsToText(nfa.transitions[source][symbol])}</td>`;
      });

      row.innerHTML += `<td>${transitionsToText(nfa.transitions[source]['ε'])}</td>`;
      body.appendChild(row);
    });
  }

  function renderDfaTable(dfa) {
    const header = dfaTable.querySelector('thead tr');
    header.innerHTML = '<th>δ</th>' + dfa.alphabet.map((symbol) => `<th>${symbol}</th>`).join('');

    const body = dfaTable.querySelector('tbody');
    body.innerHTML = '';

    dfa.states.forEach((source) => {
      const row = document.createElement('tr');
      row.innerHTML += `<td class="state-cell">${source}</td>`;

      dfa.alphabet.forEach((symbol) => {
        row.innerHTML += `<td>${dfa.transitions[source][symbol]}</td>`;
      });

      body.appendChild(row);
    });
  }

  function renderClosures(nfa) {
    closureEl.innerHTML = '';
    nfa.states.forEach((stateName) => {
      const closure = core.epsilonClosure(nfa, [stateName]);
      const card = document.createElement('div');
      card.className = 'partition-step';
      card.innerHTML = `<strong>ε-fecho(${stateName})</strong><code>{${closure.join(',')}}</code>`;
      closureEl.appendChild(card);
    });
  }

  function renderSubsets(subsetMap) {
    subsetEl.innerHTML = '';
    Object.entries(subsetMap).forEach(([stateName, subset]) => {
      const item = document.createElement('div');
      item.className = 'subset-map-item';
      item.textContent = `${stateName} = {${subset.join(',')}}`;
      subsetEl.appendChild(item);
    });
  }

  function loadDemo(id) {
    const demo = demos[id];
    if (!demo) return;

    state.activeDemo = id;
    state.nfa = null;
    state.converted = null;

    input.value = JSON.stringify(demo, null, 2);
    setStatus(statusDot, statusText, 'queued');
    initialEl.textContent = '—';
    finalsEl.textContent = '—';

    nfaTable.querySelector('thead tr').innerHTML = '';
    nfaTable.querySelector('tbody').innerHTML = '';
    dfaTable.querySelector('thead tr').innerHTML = '';
    dfaTable.querySelector('tbody').innerHTML = '';
    closureEl.innerHTML = '';
    subsetEl.innerHTML = '';
    resultsEl.innerHTML = '';

    demoButtons.forEach((button) => {
      button.classList.toggle('is-active', button.getAttribute('data-conv-demo') === id);
    });

    appendLog(logEl, `Demo carregada: ${id}.`);
  }

  async function runConversion() {
    let parsed;
    try {
      parsed = JSON.parse(input.value);
    } catch (error) {
      setStatus(statusDot, statusText, 'failed');
      appendLog(logEl, `JSON inválido: ${escapeHtml(error.message)}.`);
      return;
    }

    setStatus(statusDot, statusText, 'running');
    appendLog(logEl, 'Executando conversão AFN→AFD...');

    try {
      const response = await API.post('/api/simulator/afn/convert', {
        automaton: parsed,
      });

      state.nfa = parsed;
      state.converted = response;

      renderNfaTable(parsed);
      renderDfaTable(response.dfa);
      renderClosures(parsed);
      renderSubsets(response.subsetMap);

      initialEl.textContent = response.dfa.initialState;
      finalsEl.textContent = `{${response.dfa.acceptStates.join(',')}}`;

      setStatus(statusDot, statusText, 'completed');
      appendLog(logEl, `Conversão concluída com ${response.dfa.states.length} estados.`);
    } catch (error) {
      setStatus(statusDot, statusText, 'failed');
      appendLog(logEl, `Falha na conversão: ${escapeHtml(error.message)}.`);
    }
  }

  async function testWord(word) {
    if (!state.nfa || !state.converted) {
      await runConversion();
      if (!state.nfa || !state.converted) return;
    }

    const nfaRun = core.simulateNfa(state.nfa, word);
    let dfaRun;

    try {
      dfaRun = await API.post('/api/simulator/afd/run', {
        automaton: state.converted.dfa,
        inputWord: word,
      });
    } catch (error) {
      appendLog(logEl, `Erro ao testar palavra no AFD: ${escapeHtml(error.message)}.`);
      return;
    }

    const nfaLabel = nfaRun.accepted ? 'ACEITA' : 'REJEITA';
    const dfaLabel = dfaRun.result;

    const row = document.createElement('tr');
    row.innerHTML = `<td>${word}</td><td>${nfaLabel}</td><td>${dfaLabel}</td><td>${nfaLabel === dfaLabel ? 'OK' : 'DIVERGENTE'}</td>`;
    resultsEl.appendChild(row);

    appendLog(logEl, `Teste ${word}: AFN=${nfaLabel}, AFD=${dfaLabel}.`);
  }

  runButton.addEventListener('click', runConversion);
  resetButton.addEventListener('click', () => loadDemo(state.activeDemo));

  demoButtons.forEach((button) => {
    button.addEventListener('click', () => {
      loadDemo(button.getAttribute('data-conv-demo'));
    });
  });

  testButtons.forEach((button) => {
    button.addEventListener('click', () => {
      testWord(button.getAttribute('data-conv-word') || '');
    });
  });

  loadDemo('a-b');
}

function setupQuestions() {
  const yearEl = document.querySelector('[data-qa-year]');
  const topicEl = document.querySelector('[data-qa-topic]');
  const difficultyEl = document.querySelector('[data-qa-difficulty]');
  const listEl = document.querySelector('[data-qa-list]');
  const detailEl = document.querySelector('[data-qa-detail]');
  const feedbackEl = document.querySelector('[data-qa-feedback]');
  const metricsEl = document.querySelector('[data-qa-metrics]');

  if (!yearEl || !topicEl || !difficultyEl) return;

  const subtopicLabels = {
    afd_modelagem_execucao: 'AFD modelagem e execução',
    minimizacao_afd: 'Minimização de AFD',
    afn_epsilon: 'AFN com ε',
    conversao_afn_afd: 'Conversão AFN→AFD',
  };

  const difficultyLabels = {
    easy: 'Fácil',
    medium: 'Média',
    hard: 'Difícil',
  };

  const state = {
    questions: [],
    selectedQuestionId: null,
    selectedChoice: null,
    answersMap: {},
    latestAssessment: null,
  };

  function findQuestion(id) {
    return state.questions.find((question) => question.id === id) || null;
  }

  function getLabelForTopic(subTopic) {
    return subtopicLabels[subTopic] || subTopic;
  }

  async function loadQuestions() {
    const params = new URLSearchParams();
    if (yearEl.value !== 'all') params.set('year', yearEl.value);
    if (topicEl.value !== 'all') params.set('subTopic', topicEl.value);
    if (difficultyEl.value !== 'all') params.set('difficulty', difficultyEl.value);

    const query = params.toString();

    try {
      const response = await API.get(`/api/questions${query ? `?${query}` : ''}`);
      state.questions = response.items || [];
      state.selectedQuestionId = state.questions.length > 0 ? state.questions[0].id : null;
      state.selectedChoice = null;
      renderQuestionList();
      renderQuestionDetail();
    } catch (error) {
      listEl.innerHTML = `<p>Erro ao carregar questões: ${escapeHtml(error.message)}.</p>`;
      detailEl.innerHTML = '';
    }
  }

  function renderQuestionList() {
    listEl.innerHTML = '';

    if (state.questions.length === 0) {
      listEl.innerHTML = '<p class="page-subtitle" style="margin-top:0;color:var(--color-ink-500);">Nenhuma questão encontrada.</p>';
      return;
    }

    state.questions.forEach((question) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'question-item';
      if (question.id === state.selectedQuestionId) card.classList.add('is-active');

      card.innerHTML = [
        `<strong>${question.year} · Questão ${question.number}</strong>`,
        `<p>${escapeHtml(getLabelForTopic(question.subTopic))}</p>`,
        '<div class="question-meta">',
        `<span class="question-chip">${escapeHtml(difficultyLabels[question.difficulty] || question.difficulty)}</span>`,
        `<span class="question-chip">${escapeHtml(question.source)}</span>`,
        '</div>',
      ].join('');

      card.addEventListener('click', () => {
        state.selectedQuestionId = question.id;
        state.selectedChoice = null;
        renderQuestionList();
        renderQuestionDetail();
      });

      listEl.appendChild(card);
    });
  }

  function renderQuestionDetail() {
    detailEl.innerHTML = '';
    const question = findQuestion(state.selectedQuestionId);

    if (!question) {
      detailEl.innerHTML = '<p class="page-subtitle" style="margin-top:0;color:var(--color-ink-500);">Selecione uma questão.</p>';
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `<p style="margin-top:0;"><strong>${question.year} · Questão ${question.number}</strong></p><p style="margin-top:0;">${escapeHtml(question.stem)}</p>`;

    const options = document.createElement('div');
    options.className = 'option-list';

    question.options.forEach((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'option-btn';

      if (state.selectedChoice === option.key) {
        button.classList.add('is-selected');
      }

      button.innerHTML = `<strong>${option.key})</strong> ${escapeHtml(option.text)}`;
      button.addEventListener('click', () => {
        state.selectedChoice = option.key;
        renderQuestionDetail();
      });
      options.appendChild(button);
    });

    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar';

    const submitButton = document.createElement('button');
    submitButton.type = 'button';
    submitButton.className = 'button primary';
    submitButton.textContent = 'Corrigir resposta';
    submitButton.addEventListener('click', submitAnswer);

    toolbar.appendChild(submitButton);
    wrapper.appendChild(options);
    wrapper.appendChild(toolbar);

    detailEl.appendChild(wrapper);
  }

  function renderMetrics() {
    metricsEl.innerHTML = '';

    const byTopic = state.latestAssessment && state.latestAssessment.byTopic
      ? state.latestAssessment.byTopic
      : {};

    const keys = Object.keys(byTopic);
    if (keys.length === 0) {
      metricsEl.innerHTML = '<tr><td colspan="4">Sem dados ainda</td></tr>';
      return;
    }

    keys.forEach((subTopic) => {
      const item = byTopic[subTopic];
      const row = document.createElement('tr');
      row.innerHTML = [
        `<td>${escapeHtml(getLabelForTopic(subTopic))}</td>`,
        `<td>${item.answered}</td>`,
        `<td>${Math.round(item.accuracy * 100)}%</td>`,
        `<td>${item.status}</td>`,
      ].join('');
      metricsEl.appendChild(row);
    });
  }

  async function submitAnswer() {
    const question = findQuestion(state.selectedQuestionId);
    if (!question) return;

    if (!state.selectedChoice) {
      feedbackEl.innerHTML = 'Selecione uma alternativa antes de corrigir.';
      return;
    }

    state.answersMap[question.id] = state.selectedChoice;

    const answers = Object.entries(state.answersMap).map(([questionId, choice]) => ({
      questionId,
      choice,
    }));

    try {
      const assessment = await API.post('/api/assessment/submit', {
        attemptId: 'frontend-session',
        answers,
      });

      state.latestAssessment = assessment;
      renderMetrics();

      const graded = (assessment.gradedAnswers || []).find((item) => item.questionId === question.id);
      const recommendation = (assessment.recommendedNextTopics || []).length > 0
        ? `Revisar: ${(assessment.recommendedNextTopics || []).map(getLabelForTopic).join(', ')}.`
        : 'Sem lacunas críticas no momento.';

      if (graded && graded.status !== 'not_found') {
        feedbackEl.innerHTML = [
          `<strong>${graded.correct ? 'Resposta correta.' : 'Resposta incorreta.'}</strong>`,
          `<p style="margin-top:8px;margin-bottom:8px;">Gabarito: <strong>${escapeHtml(graded.answerKey)}</strong>.</p>`,
          `<p style="margin-top:0;margin-bottom:8px;">${escapeHtml(graded.explanation || '')}</p>`,
          `<p style="margin:0;"><strong>${escapeHtml(recommendation)}</strong></p>`,
        ].join('');
      } else {
        feedbackEl.innerHTML = 'Não foi possível corrigir esta questão.';
      }
    } catch (error) {
      feedbackEl.innerHTML = `Falha ao corrigir: ${escapeHtml(error.message)}.`;
    }
  }

  [yearEl, topicEl, difficultyEl].forEach((input) => {
    input.addEventListener('change', loadQuestions);
  });

  renderMetrics();
  loadQuestions();
}

setupViewSwitcher();
setupAfdSimulator();
setupMinimization();
setupAfnConversion();
setupQuestions();
