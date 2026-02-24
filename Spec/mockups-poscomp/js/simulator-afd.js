(function () {
  const alphabet = ['a', 'b', 'c'];

  const demos = {
    'demo-c': {
      id: 'demo-c',
      loopSymbols: ['a', 'b'],
      transitionSymbol: 'c',
      word: 'ababc',
    },
    'demo-b': {
      id: 'demo-b',
      loopSymbols: ['a', 'c'],
      transitionSymbol: 'b',
      word: 'acccb',
    },
    'demo-a': {
      id: 'demo-a',
      loopSymbols: ['b', 'c'],
      transitionSymbol: 'a',
      word: 'bccca',
    },
  };

  const machineInput = document.querySelector('[data-afd-machine-input]');
  const languageInput = document.querySelector('[data-afd-language-input]');
  const wordInput = document.querySelector('[data-afd-word-input]');

  const demoButtons = Array.from(document.querySelectorAll('[data-afd-demo]'));
  const symbolButtons = Array.from(document.querySelectorAll('[data-symbol]'));

  const runButton = document.querySelector('[data-afd-run]');
  const stepButton = document.querySelector('[data-afd-step]');
  const resetButton = document.querySelector('[data-afd-reset]');
  const cancelButton = document.querySelector('[data-afd-cancel]');

  const currentStateEl = document.querySelector('[data-afd-current-state]');
  const currentPosEl = document.querySelector('[data-afd-current-pos]');
  const resultEl = document.querySelector('[data-afd-result]');
  const statusDotEl = document.querySelector('[data-afd-run-status-dot]');
  const statusTextEl = document.querySelector('[data-afd-run-status-text]');

  const tapeEl = document.querySelector('[data-afd-tape]');
  const logEl = document.querySelector('[data-afd-log]');

  const edgeLoopLabelEl = document.querySelector('[data-afd-label-loop]');
  const edgeTransitionLabelEl = document.querySelector('[data-afd-label-transition]');
  const edgeSinkLabelEl = document.querySelector('[data-afd-label-sink]');
  const edgeSinkLoopLabelEl = document.querySelector('[data-afd-label-sink-loop]');

  const stateGroups = {
    e1: document.querySelector('[data-state="e1"]'),
    e2: document.querySelector('[data-state="e2"]'),
    e3: document.querySelector('[data-state="e3"]'),
  };

  let machineConfig = null;
  let activeInput = languageInput;

  let run = {
    word: 'ababc',
    state: 'e1',
    pos: 0,
    status: 'queued',
    result: '—',
    timer: null,
  };

  function setStatus(status) {
    run.status = status;
    statusDotEl.className = `status-dot ${status}`;
    statusTextEl.textContent = status;
  }

  function setResult(result) {
    run.result = result;
    resultEl.textContent = result;
  }

  function log(message) {
    const row = document.createElement('div');
    row.className = 'run-log-item';

    const time = document.createElement('strong');
    const now = new Date();
    time.textContent = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const msg = document.createElement('div');
    msg.innerHTML = message;

    row.appendChild(time);
    row.appendChild(msg);
    logEl.prepend(row);
  }

  function buildMachineConfig(loopSymbols, transitionSymbol) {
    const loops = Array.from(new Set(loopSymbols.map((item) => item.toLowerCase()))).filter((s) => alphabet.includes(s));
    const transition = transitionSymbol.toLowerCase();

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
      sinkLabel: alphabet.join(','),
    };
  }

  function languageExpressionFor(config) {
    return `L={${config.loopSymbols.join(',')}}*{${config.transitionSymbol}}`;
  }

  function machineExpressionFor(config) {
    const e1Rules = alphabet
      .map((symbol) => `δ(e1,${symbol})=${config.transitions.e1[symbol]}`)
      .join(', ');

    const e2Rules = alphabet
      .map((symbol) => `δ(e2,${symbol})=e3`)
      .join(', ');

    const e3Rules = alphabet
      .map((symbol) => `δ(e3,${symbol})=e3`)
      .join(', ');

    return `M1=(E={e1,e2,e3}, Σ={a,b,c}, i=e1, F={e2}, ${e1Rules}, ${e2Rules}, ${e3Rules})`;
  }

  function parseLanguageExpression(raw) {
    const compact = raw.toLowerCase().replace(/\s+/g, '');
    const match = compact.match(/(?:l=)?\{([abc](?:,[abc])*)\}\*\{?([abc])\}?/);
    if (!match) return null;

    const loopSymbols = match[1].split(',').filter(Boolean);
    const transitionSymbol = match[2];
    return buildMachineConfig(loopSymbols, transitionSymbol);
  }

  function parseMachineExpression(raw) {
    const compact = raw.toLowerCase().replace(/\s+/g, '');

    const transitionMatch = compact.match(/δ\(e1,([abc])\)=e2/);
    const loopMatches = Array.from(compact.matchAll(/δ\(e1,([abc])\)=e1/g)).map((m) => m[1]);

    if (!transitionMatch || loopMatches.length === 0) return null;

    return buildMachineConfig(loopMatches, transitionMatch[1]);
  }

  function syncConfigIntoUI(config) {
    edgeLoopLabelEl.textContent = config.loopSymbols.join(',');
    edgeTransitionLabelEl.textContent = config.transitionSymbol;
    edgeSinkLabelEl.textContent = config.sinkLabel;
    edgeSinkLoopLabelEl.textContent = config.sinkLabel;

    alphabet.forEach((symbol) => {
      const e1Cell = document.querySelector(`[data-cell="e1-${symbol}"]`);
      const e2Cell = document.querySelector(`[data-cell="e2-${symbol}"]`);
      const e3Cell = document.querySelector(`[data-cell="e3-${symbol}"]`);

      if (e1Cell) e1Cell.textContent = config.transitions.e1[symbol];
      if (e2Cell) e2Cell.textContent = config.transitions.e2[symbol];
      if (e3Cell) e3Cell.textContent = config.transitions.e3[symbol];
    });
  }

  function clearHighlights() {
    Object.values(stateGroups).forEach((node) => {
      if (node) node.classList.remove('is-active');
    });

    document.querySelectorAll('.edge-group.is-active').forEach((node) => node.classList.remove('is-active'));
    document.querySelectorAll('.delta-table td.is-active').forEach((node) => node.classList.remove('is-active'));
  }

  function highlightState(state) {
    const node = stateGroups[state];
    if (node) node.classList.add('is-active');
  }

  function highlightTransition(from, symbol) {
    const edgeId = from === 'e1' ? (symbol === machineConfig.transitionSymbol ? 'e1-transition' : 'e1-loop') : from === 'e2' ? 'e2-e3' : 'e3-loop';

    const edge = document.querySelector(`[data-edge="${edgeId}"]`);
    if (edge) edge.classList.add('is-active');

    const cell = document.querySelector(`[data-cell="${from}-${symbol}"]`);
    if (cell) cell.classList.add('is-active');
  }

  function syncSummary() {
    currentStateEl.textContent = run.state;
    currentPosEl.textContent = `${run.pos}/${run.word.length}`;
  }

  function renderTape() {
    tapeEl.innerHTML = '';

    const chars = run.word.length ? run.word.split('') : ['ε'];
    chars.forEach((char, idx) => {
      const span = document.createElement('span');
      span.className = 'tape-char';
      span.textContent = char;

      if (run.word.length) {
        if (idx < run.pos) span.classList.add('is-read');
        if (idx === run.pos && run.status === 'running') span.classList.add('is-current');
      }

      tapeEl.appendChild(span);
    });
  }

  function stopTimer() {
    if (run.timer) {
      window.clearInterval(run.timer);
      run.timer = null;
    }
  }

  function finishRun() {
    const accepted = run.state === 'e2';
    setStatus('completed');
    setResult(accepted ? 'ACEITA' : 'REJEITA');

    log(
      accepted
        ? 'Fim da entrada em <code>e2</code>: palavra reconhecida.'
        : `Fim da entrada em <code>${run.state}</code>: palavra não reconhecida.`
    );

    stopTimer();
    syncSummary();
    renderTape();
  }

  function readCurrentConfig() {
    const machineCandidate = parseMachineExpression(machineInput.value);
    const languageCandidate = parseLanguageExpression(languageInput.value);
    return machineCandidate || languageCandidate;
  }

  function prepareRun() {
    const config = readCurrentConfig();
    if (!config) {
      setStatus('failed');
      setResult('INVÁLIDA');
      log('Não foi possível interpretar as expressões. Use o formato das demos ou ajuste os campos.');
      return false;
    }

    machineConfig = config;
    syncConfigIntoUI(config);

    const word = (wordInput.value || '').trim().toLowerCase();
    if (!/^[abc]*$/.test(word)) {
      setStatus('failed');
      setResult('INVÁLIDA');
      log('A palavra de entrada aceita apenas símbolos <code>a</code>, <code>b</code> e <code>c</code>.');
      return false;
    }

    run.word = word;
    run.state = 'e1';
    run.pos = 0;

    clearHighlights();
    highlightState('e1');

    if (word.length === 0) {
      setStatus('completed');
      setResult('REJEITA');
      syncSummary();
      renderTape();
      log('Entrada vazia (<code>ε</code>) termina em <code>e1</code>: não reconhecida.');
      return false;
    }

    setStatus('running');
    setResult('PENDENTE');
    syncSummary();
    renderTape();
    log(`Iniciando execução para <code>${word}</code>.`);
    return true;
  }

  function doOneStep() {
    if (run.status === 'completed' || run.status === 'failed' || run.status === 'canceled') return;

    if (run.pos >= run.word.length) {
      finishRun();
      return;
    }

    const symbol = run.word[run.pos];
    const prevState = run.state;
    const nextState = machineConfig.transitions[prevState][symbol];

    clearHighlights();
    highlightTransition(prevState, symbol);

    run.state = nextState;
    run.pos += 1;
    highlightState(run.state);

    log(`<code>δ(${prevState}, ${symbol}) = ${nextState}</code> (passo ${run.pos})`);

    syncSummary();
    renderTape();

    if (run.pos >= run.word.length) finishRun();
  }

  function runAll() {
    stopTimer();
    const ok = prepareRun();
    if (!ok) return;

    run.timer = window.setInterval(() => {
      doOneStep();
      if (run.status !== 'running') stopTimer();
    }, 850);
  }

  function stepRun() {
    if (run.status === 'queued' || run.pos === 0) {
      stopTimer();
      const ok = prepareRun();
      if (!ok) return;
    }

    if (run.status === 'running') {
      stopTimer();
      doOneStep();
    }
  }

  function resetRun() {
    stopTimer();
    run.state = 'e1';
    run.pos = 0;
    run.word = (wordInput.value || '').trim().toLowerCase();

    clearHighlights();
    highlightState('e1');

    setStatus('queued');
    setResult('—');
    syncSummary();
    renderTape();
    log('Execução resetada.');
  }

  function cancelRun() {
    if (run.status !== 'running') return;
    stopTimer();
    setStatus('canceled');
    setResult('CANCELADA');
    syncSummary();
    renderTape();
    log('Execução cancelada pelo usuário.');
  }

  function setActiveInput(el) {
    activeInput = el;
  }

  function insertSymbol(symbol) {
    const field = activeInput || languageInput;
    field.focus();

    const start = field.selectionStart ?? field.value.length;
    const end = field.selectionEnd ?? field.value.length;

    field.value = field.value.slice(0, start) + symbol + field.value.slice(end);

    const pos = start + symbol.length;
    if (field.setSelectionRange) field.setSelectionRange(pos, pos);

    field.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function applyDemo(id) {
    const demo = demos[id];
    if (!demo) return;

    const config = buildMachineConfig(demo.loopSymbols, demo.transitionSymbol);
    if (!config) return;

    machineConfig = config;

    machineInput.value = machineExpressionFor(config);
    languageInput.value = languageExpressionFor(config);
    wordInput.value = demo.word;

    demoButtons.forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-afd-demo') === id);
    });

    syncConfigIntoUI(config);
    resetRun();
    log(`Demo carregada: ${id}.`);
  }

  [machineInput, languageInput, wordInput].forEach((input) => {
    input.addEventListener('focus', () => setActiveInput(input));
    input.addEventListener('click', () => setActiveInput(input));
  });

  symbolButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const symbol = button.getAttribute('data-symbol') || '';
      insertSymbol(symbol);
    });
  });

  demoButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-afd-demo');
      applyDemo(id);
    });
  });

  runButton.addEventListener('click', runAll);
  stepButton.addEventListener('click', stepRun);
  resetButton.addEventListener('click', resetRun);
  cancelButton.addEventListener('click', cancelRun);

  applyDemo('demo-c');
})();
