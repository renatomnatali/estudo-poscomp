(function () {
  const root = typeof window !== 'undefined' ? window : globalThis;
  const core = root.AutomataCore;

  const textarea = document.querySelector('[data-conv-automaton-input]');
  if (!textarea || !core) return;

  const nfaTable = document.querySelector('[data-conv-nfa-table]');
  const dfaTable = document.querySelector('[data-conv-dfa-table]');
  const closuresEl = document.querySelector('[data-conv-closures]');
  const subsetMapEl = document.querySelector('[data-conv-subset-map]');
  const resultRowsEl = document.querySelector('[data-conv-word-results]');

  const dfaInitialEl = document.querySelector('[data-conv-dfa-initial]');
  const dfaFinalsEl = document.querySelector('[data-conv-dfa-finals]');

  const statusDot = document.querySelector('[data-conv-status-dot]');
  const statusText = document.querySelector('[data-conv-status-text]');
  const logEl = document.querySelector('[data-conv-log]');

  const runButton = document.querySelector('[data-conv-run]');
  const resetButton = document.querySelector('[data-conv-reset]');
  const demoButtons = Array.from(document.querySelectorAll('[data-conv-demo]'));
  const wordButtons = Array.from(document.querySelectorAll('[data-conv-word]'));

  const demos = {
    'demo-a-b': {
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
    'demo-final-ab': {
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

  let activeDemo = 'demo-a-b';
  let currentNfa = null;
  let currentConverted = null;

  function setStatus(status) {
    statusDot.className = `status-dot ${status}`;
    statusText.textContent = status;
  }

  function log(message) {
    const row = document.createElement('div');
    row.className = 'run-log-item';

    const time = document.createElement('strong');
    time.textContent = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const content = document.createElement('div');
    content.innerHTML = message;

    row.appendChild(time);
    row.appendChild(content);
    logEl.prepend(row);
  }

  function setActiveDemoButton(id) {
    demoButtons.forEach((button) => {
      button.classList.toggle('is-active', button.getAttribute('data-conv-demo') === id);
    });
  }

  function transitionsToText(value) {
    const arr = Array.isArray(value) ? value : [];
    return arr.length ? `{${arr.join(',')}}` : '∅';
  }

  function renderNfaTable(nfa) {
    const header = nfaTable.querySelector('thead tr');
    header.innerHTML = '<th>δ</th>' + nfa.alphabet.map((symbol) => `<th>${symbol}</th>`).join('') + '<th>ε</th>';

    const tbody = nfaTable.querySelector('tbody');
    tbody.innerHTML = '';

    nfa.states.forEach((state) => {
      const tr = document.createElement('tr');
      tr.innerHTML += `<td class="state-cell">${state}</td>`;

      nfa.alphabet.forEach((symbol) => {
        const value = nfa.transitions[state] && nfa.transitions[state][symbol];
        tr.innerHTML += `<td>${transitionsToText(value)}</td>`;
      });

      const epsilonTargets = nfa.transitions[state] && nfa.transitions[state]['ε'];
      tr.innerHTML += `<td>${transitionsToText(epsilonTargets)}</td>`;

      tbody.appendChild(tr);
    });
  }

  function renderClosures(nfa) {
    closuresEl.innerHTML = '';
    nfa.states.forEach((state) => {
      const closure = core.epsilonClosure(nfa, [state]);
      const card = document.createElement('div');
      card.className = 'partition-step';
      card.innerHTML = `<strong>ε-fecho(${state})</strong><code>${core.formatSet(closure)}</code>`;
      closuresEl.appendChild(card);
    });
  }

  function renderDfaTable(dfa) {
    const header = dfaTable.querySelector('thead tr');
    header.innerHTML = '<th>δ</th>' + dfa.alphabet.map((symbol) => `<th>${symbol}</th>`).join('');

    const tbody = dfaTable.querySelector('tbody');
    tbody.innerHTML = '';

    dfa.states.forEach((state) => {
      const tr = document.createElement('tr');
      tr.innerHTML += `<td class="state-cell">${state}</td>`;
      dfa.alphabet.forEach((symbol) => {
        const target = dfa.transitions[state] && dfa.transitions[state][symbol];
        tr.innerHTML += `<td>${target || '—'}</td>`;
      });
      tbody.appendChild(tr);
    });
  }

  function renderSubsetMap(subsetMap) {
    subsetMapEl.innerHTML = '';

    Object.entries(subsetMap).forEach(([state, subset]) => {
      const item = document.createElement('div');
      item.className = 'subset-map-item';
      item.textContent = `${state} = ${core.formatSet(subset)}`;
      subsetMapEl.appendChild(item);
    });
  }

  function parseNfa() {
    try {
      return JSON.parse(textarea.value);
    } catch (error) {
      setStatus('failed');
      log(`Falha ao interpretar JSON do AFN: ${error.message}.`);
      return null;
    }
  }

  function runConversion() {
    const parsed = parseNfa();
    if (!parsed) return;

    setStatus('running');
    log('Iniciando conversão AFN→AFD.');

    try {
      currentNfa = parsed;
      currentConverted = core.convertNfaToDfa(parsed);

      renderNfaTable(parsed);
      renderClosures(parsed);
      renderDfaTable(currentConverted.dfa);
      renderSubsetMap(currentConverted.subsetMap);

      dfaInitialEl.textContent = currentConverted.dfa.initialState;
      dfaFinalsEl.textContent = `{${currentConverted.dfa.acceptStates.join(',')}}`;

      setStatus('completed');
      log(`Conversão concluída com ${currentConverted.dfa.states.length} estados no AFD.`);
    } catch (error) {
      setStatus('failed');
      log(`Erro na conversão: ${error.message}.`);
    }
  }

  function appendWordResult(word) {
    if (!currentNfa || !currentConverted) {
      runConversion();
      if (!currentNfa || !currentConverted) return;
    }

    const nfaRun = core.simulateNfa(currentNfa, word);
    const dfaRun = core.simulateDfa(currentConverted.dfa, word);

    const nfaLabel = nfaRun.accepted ? 'ACEITA' : 'REJEITA';
    const dfaLabel = dfaRun.result;
    const isEquivalent = nfaLabel === dfaLabel;

    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${word}</td><td>${nfaLabel}</td><td>${dfaLabel}</td><td>${isEquivalent ? 'OK' : 'DIVERGENTE'}</td>`;
    resultRowsEl.appendChild(tr);

    log(`Teste de palavra <code>${word}</code>: AFN=${nfaLabel}, AFD=${dfaLabel}.`);
  }

  function loadDemo(id) {
    const demo = demos[id];
    if (!demo) return;

    activeDemo = id;
    currentNfa = null;
    currentConverted = null;

    textarea.value = JSON.stringify(demo, null, 2);
    setActiveDemoButton(id);
    setStatus('queued');

    nfaTable.querySelector('tbody').innerHTML = '';
    dfaTable.querySelector('tbody').innerHTML = '';
    closuresEl.innerHTML = '';
    subsetMapEl.innerHTML = '';
    resultRowsEl.innerHTML = '';
    dfaInitialEl.textContent = '—';
    dfaFinalsEl.textContent = '—';

    log(`Demo carregada: ${id}.`);
  }

  runButton.addEventListener('click', runConversion);
  resetButton.addEventListener('click', () => loadDemo(activeDemo));

  demoButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-conv-demo');
      loadDemo(id);
    });
  });

  wordButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const word = button.getAttribute('data-conv-word') || '';
      appendWordResult(word);
    });
  });

  loadDemo(activeDemo);
})();
