(function () {
  const root = typeof window !== 'undefined' ? window : globalThis;
  const core = root.AutomataCore;

  const textarea = document.querySelector('[data-min-automaton-input]');
  if (!textarea || !core) return;

  const statusDot = document.querySelector('[data-min-status-dot]');
  const statusText = document.querySelector('[data-min-status-text]');
  const logEl = document.querySelector('[data-min-log]');

  const originalTable = document.querySelector('[data-min-original-table]');
  const minimizedTable = document.querySelector('[data-min-minimized-table]');
  const partitionsEl = document.querySelector('[data-min-partitions]');
  const equivalenceEl = document.querySelector('[data-min-equivalence]');

  const originalStatesEl = document.querySelector('[data-min-original-states]');
  const originalFinalsEl = document.querySelector('[data-min-original-finals]');
  const minimizedStatesEl = document.querySelector('[data-min-minimized-states]');
  const mergedStatesEl = document.querySelector('[data-min-merged-states]');

  const runButton = document.querySelector('[data-min-run]');
  const stepButton = document.querySelector('[data-min-step]');
  const resetButton = document.querySelector('[data-min-reset]');
  const demoButtons = Array.from(document.querySelectorAll('[data-min-demo]'));

  const demoDefinitions = {
    'demo-v1': {
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
    'demo-paridade': {
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

  const equivalenceWords = ['c', 'abc', 'ababc', 'abca'];
  let activeDemo = 'demo-v1';
  let currentModel = null;
  let currentResult = null;
  let currentPartitionStep = 0;

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

  function setDemoActiveButton(id) {
    demoButtons.forEach((button) => {
      button.classList.toggle('is-active', button.getAttribute('data-min-demo') === id);
    });
  }

  function renderTransitionTable(table, automaton) {
    if (!table || !automaton) return;

    const headerRow = table.querySelector('thead tr');
    headerRow.innerHTML = '<th>δ</th>' + automaton.alphabet.map((symbol) => `<th>${symbol}</th>`).join('');

    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';

    automaton.states.forEach((state) => {
      const tr = document.createElement('tr');
      const stateCell = document.createElement('td');
      stateCell.className = 'state-cell';
      stateCell.textContent = state;
      tr.appendChild(stateCell);

      automaton.alphabet.forEach((symbol) => {
        const cell = document.createElement('td');
        const target = automaton.transitions[state] && automaton.transitions[state][symbol];
        cell.textContent = target || '—';
        tr.appendChild(cell);
      });

      tbody.appendChild(tr);
    });
  }

  function partitionToText(partition) {
    return partition.map((group) => `{${group.join(',')}}`).join(' | ');
  }

  function renderPartitions() {
    partitionsEl.innerHTML = '';

    if (!currentResult) return;

    currentResult.partitions.forEach((partition, index) => {
      const block = document.createElement('div');
      block.className = 'partition-step';
      if (index === currentPartitionStep) block.classList.add('is-active');

      const title = document.createElement('strong');
      title.textContent = `Passo ${index}`;
      block.appendChild(title);

      const value = document.createElement('code');
      value.textContent = partitionToText(partition);
      block.appendChild(value);

      if (index === currentPartitionStep) {
        const marker = document.createElement('p');
        marker.style.marginTop = '8px';
        marker.style.fontSize = '0.75rem';
        marker.style.color = 'var(--color-primary-strong)';
        marker.textContent = index === currentResult.partitions.length - 1 ? 'partições estabilizadas' : 'passo atual';
        block.appendChild(marker);
      }

      partitionsEl.appendChild(block);
    });
  }

  function renderEquivalenceTable() {
    equivalenceEl.innerHTML = '';
    if (!currentResult || !currentModel) return;

    equivalenceWords.forEach((word) => {
      const fromOriginal = core.simulateDfa(currentModel, word);
      const fromMinimized = core.simulateDfa(currentResult.minimized, word);
      const equivalent = fromOriginal.result === fromMinimized.result;

      const tr = document.createElement('tr');
      tr.innerHTML = [
        `<td>${word}</td>`,
        `<td>${fromOriginal.result}</td>`,
        `<td>${fromMinimized.result}</td>`,
        `<td>${equivalent ? 'OK' : 'DIVERGENTE'}</td>`,
      ].join('');

      equivalenceEl.appendChild(tr);
    });
  }

  function syncSummary() {
    if (!currentModel || !currentResult) return;

    originalStatesEl.textContent = String(currentModel.states.length);
    originalFinalsEl.textContent = `{${(currentModel.acceptStates || []).join(',')}}`;

    minimizedStatesEl.textContent = String(currentResult.minimized.states.length);

    const merged = currentResult.mergedStates.length
      ? currentResult.mergedStates.map((group) => `{${group.join(',')}}`).join(' + ')
      : 'nenhuma';

    mergedStatesEl.textContent = merged;
  }

  function parseModel() {
    try {
      const parsed = JSON.parse(textarea.value);
      return parsed;
    } catch (error) {
      setStatus('failed');
      log(`Falha ao interpretar JSON do AFD: ${error.message}.`);
      return null;
    }
  }

  function runMinimization() {
    const parsed = parseModel();
    if (!parsed) return;

    setStatus('running');
    log('Executando minimização por partições.');

    try {
      currentModel = parsed;
      currentResult = core.minimizeDfa(parsed);
      currentPartitionStep = 0;

      renderTransitionTable(originalTable, currentModel);
      renderTransitionTable(minimizedTable, currentResult.minimized);
      renderPartitions();
      renderEquivalenceTable();
      syncSummary();

      setStatus('completed');
      log(`Minimização concluída. Removidos inalcançáveis: ${currentResult.removedUnreachable.join(', ') || 'nenhum'}.`);
    } catch (error) {
      setStatus('failed');
      log(`Erro ao minimizar AFD: ${error.message}.`);
    }
  }

  function nextPartition() {
    if (!currentResult) {
      runMinimization();
      return;
    }

    if (currentPartitionStep < currentResult.partitions.length - 1) {
      currentPartitionStep += 1;
      renderPartitions();
      log(`Avançou para o passo ${currentPartitionStep} de partições.`);
      return;
    }

    renderPartitions();
    log('Partições estabilizadas.');
  }

  function loadDemo(id) {
    const demo = demoDefinitions[id];
    if (!demo) return;

    activeDemo = id;
    textarea.value = JSON.stringify(demo, null, 2);
    currentModel = null;
    currentResult = null;
    currentPartitionStep = 0;

    setDemoActiveButton(id);
    setStatus('queued');

    if (partitionsEl) partitionsEl.innerHTML = '';
    if (equivalenceEl) equivalenceEl.innerHTML = '';
    if (originalTable) originalTable.querySelector('tbody').innerHTML = '';
    if (minimizedTable) minimizedTable.querySelector('tbody').innerHTML = '';

    originalStatesEl.textContent = String(demo.states.length);
    originalFinalsEl.textContent = `{${demo.acceptStates.join(',')}}`;
    minimizedStatesEl.textContent = '—';
    mergedStatesEl.textContent = '—';

    log(`Demo carregada: ${id}.`);
  }

  runButton.addEventListener('click', runMinimization);
  stepButton.addEventListener('click', nextPartition);
  resetButton.addEventListener('click', () => loadDemo(activeDemo));

  demoButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-min-demo');
      loadDemo(id);
    });
  });

  loadDemo(activeDemo);
})();
