'use client';

import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import Link from 'next/link';

import type { StudyModule } from '@/lib/types';

interface ModulePageProps {
  moduleSlug: string;
  userId?: string;
}

interface ModuleImportedSource {
  header: {
    badge: string;
    title: string;
    subtitle: string;
    meta: string[];
    progressLabel: string;
  };
  navLinks: Array<{ id: string; label: string }>;
  html: string;
}

const MODULE_01_FALLBACK_NAV = [
  { id: 'por-que', label: 'Por quê?' },
  { id: 'conjuntos', label: 'Conjuntos' },
  { id: 'operacoes', label: 'Operações' },
  { id: 'relacoes', label: 'Relações' },
  { id: 'funcoes', label: 'Funções' },
  { id: 'alfabetos', label: 'Alfabetos' },
  { id: 'strings', label: 'Strings' },
  { id: 'linguagens', label: 'Linguagens' },
  { id: 'quiz', label: 'Exercícios' },
  { id: 'resumo', label: 'Resumo' },
] as const;

const MODULE_IMPORT_SLUGS = new Set([
  'modulo-01',
  'modulo-02',
  'modulo-03',
  'modulo-04',
  'modulo-05',
  'modulo-06',
  'modulo-07',
  'modulo-08',
  'modulo-09',
]);

const MODULE_FALLBACK_TITLES: Record<string, string> = {
  'modulo-01': 'Fundamentos Matemáticos',
  'modulo-02': 'Autômato Finito Determinístico',
  'modulo-03': 'AFN e ε-Transições',
  'modulo-04': 'Operações e Fechamento',
  'modulo-05': 'Minimização de AFD',
  'modulo-06': 'Expressões Regulares',
  'modulo-07': 'GLC e Autômatos de Pilha',
  'modulo-08': 'Bombeamento, Chomsky e Computabilidade',
  'modulo-09': 'P, NP, NP-Completo e Teorema de Gödel',
};

interface InlineSimulatorPreset {
  id: string;
  title: string;
  description: string;
  alphabet: string[];
  states: string[];
  initialState: string;
  acceptStates: string[];
  transitions: Record<string, Record<string, string>>;
  defaultInput: string;
  positions: Record<string, { x: number; y: number }>;
}

const MODULE_02_SIM_PRESETS: Record<string, InlineSimulatorPreset> = {
  par1s: {
    id: 'par1s',
    title: 'Nº par de 1s',
    description: 'Aceita strings binárias com quantidade par de 1s (incluindo ε).',
    alphabet: ['0', '1'],
    states: ['q0', 'q1'],
    initialState: 'q0',
    acceptStates: ['q0'],
    transitions: {
      q0: { '0': 'q0', '1': 'q1' },
      q1: { '0': 'q1', '1': 'q0' },
    },
    defaultInput: '0110',
    positions: {
      q0: { x: 200, y: 110 },
      q1: { x: 420, y: 110 },
    },
  },
  termina01: {
    id: 'termina01',
    title: 'Termina em 01',
    description: 'Aceita cadeias binárias cujo sufixo final é 01.',
    alphabet: ['0', '1'],
    states: ['q0', 'q1', 'q2'],
    initialState: 'q0',
    acceptStates: ['q2'],
    transitions: {
      q0: { '0': 'q1', '1': 'q0' },
      q1: { '0': 'q1', '1': 'q2' },
      q2: { '0': 'q1', '1': 'q0' },
    },
    defaultInput: '1101',
    positions: {
      q0: { x: 180, y: 120 },
      q1: { x: 350, y: 50 },
      q2: { x: 500, y: 120 },
    },
  },
  multiplo3: {
    id: 'multiplo3',
    title: 'Binário ÷ 3',
    description: 'Reconhece números binários cujo valor decimal é divisível por 3.',
    alphabet: ['0', '1'],
    states: ['r0', 'r1', 'r2'],
    initialState: 'r0',
    acceptStates: ['r0'],
    transitions: {
      r0: { '0': 'r0', '1': 'r1' },
      r1: { '0': 'r2', '1': 'r0' },
      r2: { '0': 'r1', '1': 'r2' },
    },
    defaultInput: '110',
    positions: {
      r0: { x: 180, y: 120 },
      r1: { x: 350, y: 50 },
      r2: { x: 500, y: 120 },
    },
  },
  comeca1: {
    id: 'comeca1',
    title: 'Começa com 1',
    description: 'Aceita apenas palavras binárias cujo primeiro símbolo é 1.',
    alphabet: ['0', '1'],
    states: ['s0', 's1', 'sd'],
    initialState: 's0',
    acceptStates: ['s1'],
    transitions: {
      s0: { '0': 'sd', '1': 's1' },
      s1: { '0': 's1', '1': 's1' },
      sd: { '0': 'sd', '1': 'sd' },
    },
    defaultInput: '1010',
    positions: {
      s0: { x: 180, y: 120 },
      s1: { x: 360, y: 65 },
      sd: { x: 520, y: 120 },
    },
  },
};

function normalizePresetId(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function normalizeModuleLabels(value: string) {
  return value.replace(/m[oó]dulo\s*(\d+)\s*de\s*8/gi, 'Módulo $1 de 9');
}

function stripHeaderIconPrefix(value: string) {
  return value
    .replace(/^[\s\uFE0E\uFE0F\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}]+/u, '')
    .trim();
}

function renumberModuleSectionsFromOne(html: string) {
  let chapterNumber = 1;
  return html.replace(/(<h2>\s*<span class="num">)\d+(<\/span>)/gi, (_match, prefix, suffix) => {
    const value = `${prefix}${chapterNumber}${suffix}`;
    chapterNumber += 1;
    return value;
  });
}

function formatModuleBadge(order: number) {
  return `Módulo ${order} de 9`;
}

function getModuleTitleFallback(moduleData: StudyModule) {
  return MODULE_FALLBACK_TITLES[moduleData.slug] || moduleData.title;
}

function getModuleSubtitleFallback(moduleData: StudyModule) {
  if (moduleData.slug === 'modulo-01') {
    return 'Conjuntos, relações, funções, alfabetos e linguagens — o vocabulário que torna a teoria dos autômatos legível.';
  }
  if (moduleData.slug === 'modulo-02') {
    return 'Da definição formal à execução visual — construa, leia e simule um AFD do zero.';
  }
  return moduleData.subtitle;
}

function buildFallbackImportedNav(moduleData: StudyModule) {
  if (moduleData.slug === 'modulo-01') {
    return [...MODULE_01_FALLBACK_NAV];
  }

  return moduleData.chapters.map((chapter) => ({
    id: chapter.id,
    label: chapter.title,
  }));
}

function ModuleImportedLessonView({ moduleData }: { moduleData: StudyModule }) {
  const [source, setSource] = useState<ModuleImportedSource | null>(null);
  const [activeSectionId, setActiveSectionId] = useState('');
  const importBodyRef = useRef<HTMLDivElement | null>(null);
  const sectionNavRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    async function loadImportedSource() {
      const response = await fetch(`/api/study/modules/${moduleData.slug}/source`);
      if (!response.ok) {
        setSource(null);
        return;
      }

      const payload = (await response.json()) as Partial<ModuleImportedSource>;
      if (!payload || typeof payload !== 'object') {
        setSource(null);
        return;
      }

      setSource({
        header: {
          badge: normalizeModuleLabels(payload.header?.badge || formatModuleBadge(moduleData.order)),
          title: payload.header?.title || getModuleTitleFallback(moduleData),
          subtitle: payload.header?.subtitle || getModuleSubtitleFallback(moduleData),
          meta: Array.isArray(payload.header?.meta)
            ? payload.header.meta
                .map((item) => stripHeaderIconPrefix(String(item || '')))
                .filter((item) => item.length > 0)
            : [],
          progressLabel: normalizeModuleLabels(
            payload.header?.progressLabel || `${formatModuleBadge(moduleData.order)} — ${moduleData.title}`
          ),
        },
        navLinks:
          Array.isArray(payload.navLinks) && payload.navLinks.length > 0
            ? payload.navLinks
            : buildFallbackImportedNav(moduleData),
        html: renumberModuleSectionsFromOne(typeof payload.html === 'string' ? payload.html : ''),
      });
    }

    void loadImportedSource();
  }, [moduleData]);

  useEffect(() => {
    const root = importBodyRef.current;
    if (!root) {
      return;
    }
    const rootEl = root;

    function setQuizResult(resultEl: HTMLElement, message: string, isCorrect: boolean) {
      resultEl.classList.add('show');
      resultEl.classList.remove('is-correct', 'is-wrong');
      resultEl.classList.add(isCorrect ? 'is-correct' : 'is-wrong');
      resultEl.textContent = message;
    }

    function clearOptionState(optionsRoot: HTMLElement) {
      optionsRoot.querySelectorAll<HTMLElement>('.opt').forEach((label) => {
        label.classList.remove('is-selected', 'is-correct', 'is-wrong');
      });
    }

    function handleVerifyClick(event: Event) {
      const target = event.target as HTMLElement | null;
      const button = target?.closest('button.quiz-btn') as HTMLButtonElement | null;
      if (!button || !rootEl.contains(button)) {
        return;
      }

      const questionId = button.dataset.questionId;
      const answerKey = (button.dataset.answerKey || '').trim().toUpperCase();
      if (!questionId || !answerKey) {
        return;
      }

      const optionsRoot = rootEl.querySelector<HTMLElement>(`#${questionId}`);
      const resultEl = rootEl.querySelector<HTMLElement>(`#${questionId}-res`);
      if (!optionsRoot || !resultEl) {
        return;
      }

      clearOptionState(optionsRoot);

      const selected = optionsRoot.querySelector<HTMLInputElement>(`input[name="${questionId}"]:checked`);
      if (!selected) {
        setQuizResult(resultEl, 'Selecione uma alternativa antes de verificar.', false);
        return;
      }

      const selectedValue = selected.value.trim().toUpperCase();
      const selectedLabel = selected.closest<HTMLElement>('.opt');
      if (selectedLabel) {
        selectedLabel.classList.add('is-selected');
      }

      optionsRoot.querySelectorAll<HTMLElement>('.opt').forEach((label) => {
        const input = label.querySelector<HTMLInputElement>('input[type="radio"]');
        const optionValue = input?.value.trim().toUpperCase();
        if (optionValue === answerKey) {
          label.classList.add('is-correct');
        }
      });

      const isCorrect = selectedValue === answerKey;
      if (!isCorrect && selectedLabel) {
        selectedLabel.classList.add('is-wrong');
      }

      setQuizResult(
        resultEl,
        isCorrect
          ? `Correta. Alternativa ${answerKey}.`
          : `Incorreta. Resposta correta: ${answerKey}.`,
        isCorrect
      );
    }

    rootEl.addEventListener('click', handleVerifyClick);
    return () => {
      rootEl.removeEventListener('click', handleVerifyClick);
    };
  }, [source?.html]);

  useEffect(() => {
    if (moduleData.slug !== 'modulo-02') {
      return;
    }

    const root = importBodyRef.current;
    if (!root) {
      return;
    }

    const simulatorEl = root.querySelector<HTMLElement>('#simulator');
    if (!simulatorEl) {
      return;
    }
    const simulatorRoot = simulatorEl;

    const presetButtons = Array.from(simulatorRoot.querySelectorAll<HTMLButtonElement>('button.preset-btn'));
    const actionButtons = Array.from(simulatorRoot.querySelectorAll<HTMLButtonElement>('button.sim-btn'));
    const presetDescElRaw = simulatorRoot.querySelector<HTMLElement>('#preset-desc');
    const inputElRaw = simulatorRoot.querySelector<HTMLInputElement>('#sim-string');
    const tableBodyElRaw = simulatorRoot.querySelector<HTMLTableSectionElement>('#sim-table-body');
    const stateCircleElRaw = simulatorRoot.querySelector<HTMLElement>('#sim-state-circle');
    const tapeElRaw = simulatorRoot.querySelector<HTMLElement>('#sim-tape');
    const logElRaw = simulatorRoot.querySelector<HTMLElement>('#sim-log');
    const resultElRaw = simulatorRoot.querySelector<HTMLElement>('#sim-result');
    const canvasElRaw = simulatorRoot.querySelector<HTMLCanvasElement>('#afd-canvas');

    if (
      !presetDescElRaw ||
      !inputElRaw ||
      !tableBodyElRaw ||
      !stateCircleElRaw ||
      !tapeElRaw ||
      !logElRaw ||
      !resultElRaw ||
      !canvasElRaw
    ) {
      return;
    }

    const presetDescEl = presetDescElRaw;
    const inputEl = inputElRaw;
    const tableBodyEl = tableBodyElRaw;
    const stateCircleEl = stateCircleElRaw;
    const tapeEl = tapeElRaw;
    const logEl = logElRaw;
    const resultEl = resultElRaw;
    const canvasEl = canvasElRaw;

    interface InlineSimulatorSession {
      input: string;
      index: number;
      currentState: string;
      finished: boolean;
    }

    let activePreset: InlineSimulatorPreset = MODULE_02_SIM_PRESETS.par1s;
    let session: InlineSimulatorSession | null = null;

    function escapeHtml(value: string) {
      return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function getPresetById(rawId: string) {
      const normalized = normalizePresetId(rawId);
      if (normalized === 'comeca1') {
        return MODULE_02_SIM_PRESETS.comeca1;
      }
      return MODULE_02_SIM_PRESETS[normalized] || MODULE_02_SIM_PRESETS.par1s;
    }

    function resolvePresetIdFromButton(button: HTMLButtonElement) {
      const fromData = button.dataset.presetId || '';
      if (fromData) {
        return normalizePresetId(fromData);
      }

      const label = normalizePresetId(button.textContent || '');
      if (label.includes('termina')) return 'termina01';
      if (label.includes('multiplo')) return 'multiplo3';
      if (label.includes('comeca')) return 'comeca1';
      return 'par1s';
    }

    function resolveActionFromButton(button: HTMLButtonElement) {
      const byData = (button.dataset.simAction || '').trim().toLowerCase();
      if (byData === 'init' || byData === 'step' || byData === 'run' || byData === 'reset') {
        return byData;
      }

      const label = normalizePresetId(button.textContent || '');
      if (label.includes('iniciar')) return 'init';
      if (label.includes('passo')) return 'step';
      if (label.includes('executar')) return 'run';
      if (label.includes('reset')) return 'reset';
      return '';
    }

    function appendLog(message: string, tone: 'step' | 'accept' | 'reject' = 'step') {
      if (!logEl) {
        return;
      }
      const line = document.createElement('div');
      line.className = `log-line ${tone === 'accept' ? 'log-accept' : tone === 'reject' ? 'log-reject' : 'log-step'}`;
      line.textContent = message;
      logEl.appendChild(line);
      logEl.scrollTop = logEl.scrollHeight;
    }

    function clearResult() {
      resultEl.textContent = '';
      resultEl.classList.remove('accept', 'reject');
      resultEl.style.display = 'none';
    }

    function showResult(accepted: boolean) {
      resultEl.style.display = 'block';
      resultEl.classList.remove('accept', 'reject');
      resultEl.classList.add(accepted ? 'accept' : 'reject');
      resultEl.textContent = accepted ? 'ACEITA' : 'REJEITA';
      appendLog(accepted ? 'Palavra aceita.' : 'Palavra rejeitada.', accepted ? 'accept' : 'reject');
    }

    function renderTape() {
      const word = session?.input ?? inputEl.value.trim();
      const cells = word.length > 0 ? word.split('') : ['ε'];

      tapeEl.innerHTML = '';
      cells.forEach((char, index) => {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.textContent = char;

        if (char === 'ε') {
          cell.classList.add('eps');
        } else if (session) {
          if (index < session.index) {
            cell.classList.add('done');
          } else if (index === session.index && !session.finished) {
            cell.classList.add('read');
          } else {
            cell.classList.add('pending');
          }
        } else {
          cell.classList.add('pending');
        }

        tapeEl.appendChild(cell);
      });
    }

    function renderTable() {
      const currentSymbol =
        session && session.index < session.input.length ? session.input[session.index] : null;
      const nextState =
        session && currentSymbol
          ? activePreset.transitions[session.currentState]?.[currentSymbol] || null
          : null;

      let tableHtml = `<tr><th>Estado</th>${activePreset.alphabet
        .map((symbol) => `<th>${escapeHtml(symbol)}</th>`)
        .join('')}</tr>`;

      activePreset.states.forEach((state) => {
        const isInitial = state === activePreset.initialState ? '→ ' : '';
        const isFinal = activePreset.acceptStates.includes(state) ? '★ ' : '';

        tableHtml += `<tr><td><strong>${isInitial}${isFinal}${escapeHtml(state)}</strong></td>`;

        activePreset.alphabet.forEach((symbol) => {
          const target = activePreset.transitions[state]?.[symbol] || '—';
          const classes = [
            session && currentSymbol && session.currentState === state && currentSymbol === symbol ? 'td-current' : '',
            session && currentSymbol && nextState === state && currentSymbol === symbol ? 'td-next' : '',
          ]
            .filter(Boolean)
            .join(' ');

          tableHtml += `<td class="${classes}">${escapeHtml(target)}</td>`;
        });

        tableHtml += '</tr>';
      });

      tableBodyEl.innerHTML = tableHtml;
    }

    function drawArrow(
      ctx: CanvasRenderingContext2D,
      from: { x: number; y: number },
      to: { x: number; y: number },
      color: string,
      label: string,
      offset = 0
    ) {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const startX = from.x + (dx / len) * 36 + nx * offset;
      const startY = from.y + (dy / len) * 36 + ny * offset;
      const endX = to.x - (dx / len) * 36 + nx * offset;
      const endY = to.y - (dy / len) * 36 + ny * offset;

      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      const angle = Math.atan2(endY - startY, endX - startX);
      const arrowSize = 8;
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - arrowSize * Math.cos(angle - Math.PI / 6), endY - arrowSize * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(endX - arrowSize * Math.cos(angle + Math.PI / 6), endY - arrowSize * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();

      const midX = (startX + endX) / 2 + nx * 10;
      const midY = (startY + endY) / 2 + ny * 10;
      ctx.fillStyle = '#0d2d6b';
      ctx.font = '12px "DM Mono", monospace';
      ctx.fillText(label, midX - 6, midY - 4);
    }

    function drawLoop(
      ctx: CanvasRenderingContext2D,
      center: { x: number; y: number },
      color: string,
      label: string
    ) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(center.x, center.y - 44, 18, Math.PI * 0.2, Math.PI * 1.8);
      ctx.stroke();

      ctx.fillStyle = '#0d2d6b';
      ctx.font = '12px "DM Mono", monospace';
      ctx.fillText(label, center.x - 12, center.y - 68);
    }

    function renderCanvas() {
      if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)) {
        return;
      }

      let ctx: CanvasRenderingContext2D | null = null;
      try {
        ctx = canvasEl.getContext('2d');
      } catch {
        ctx = null;
      }
      if (!ctx) {
        return;
      }

      const width = 720;
      const height = 220;
      canvasEl.width = width;
      canvasEl.height = height;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#f8fbff';
      ctx.fillRect(0, 0, width, height);

      const currentSymbol =
        session && session.index < session.input.length ? session.input[session.index] : null;
      const edgeBuckets = new Map<string, string[]>();

      activePreset.states.forEach((fromState) => {
        activePreset.alphabet.forEach((symbol) => {
          const toState = activePreset.transitions[fromState]?.[symbol];
          if (!toState) return;
          const key = `${fromState}->${toState}`;
          if (!edgeBuckets.has(key)) {
            edgeBuckets.set(key, []);
          }
          edgeBuckets.get(key)?.push(symbol);
        });
      });

      edgeBuckets.forEach((symbols, key) => {
        const [fromState, toState] = key.split('->');
        const fromPos = activePreset.positions[fromState];
        const toPos = activePreset.positions[toState];
        if (!fromPos || !toPos) return;

        const isActive =
          Boolean(session) &&
          session?.currentState === fromState &&
          Boolean(currentSymbol) &&
          symbols.includes(currentSymbol || '');

        const color = isActive ? '#e8700a' : '#1a6bcc';
        const label = symbols.join(',');

        if (fromState === toState) {
          drawLoop(ctx, fromPos, color, label);
          return;
        }

        const reverseKey = `${toState}->${fromState}`;
        const hasReverse = edgeBuckets.has(reverseKey);
        const offset = hasReverse ? (fromState < toState ? -12 : 12) : 0;
        drawArrow(ctx, fromPos, toPos, color, label, offset);
      });

      const initialPos = activePreset.positions[activePreset.initialState];
      if (initialPos) {
        ctx.strokeStyle = '#1a6bcc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(initialPos.x - 70, initialPos.y);
        ctx.lineTo(initialPos.x - 38, initialPos.y);
        ctx.stroke();
      }

      activePreset.states.forEach((state) => {
        const pos = activePreset.positions[state];
        if (!pos) return;

        const isActive = session?.currentState === state;
        const isFinal = activePreset.acceptStates.includes(state);

        ctx.fillStyle = isActive ? '#dbeafe' : '#ffffff';
        ctx.strokeStyle = isActive ? '#e8700a' : '#1a6bcc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (isFinal) {
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 26, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = '#0d2d6b';
        ctx.font = 'bold 14px "DM Mono", monospace';
        ctx.fillText(state, pos.x - 12, pos.y + 4);
      });
    }

    function renderAll() {
      stateCircleEl.textContent = session ? session.currentState : '—';
      renderTape();
      renderTable();
      renderCanvas();
    }

    function finishSession() {
      if (!session || session.finished) return;
      session.finished = true;
      const accepted = activePreset.acceptStates.includes(session.currentState);
      showResult(accepted);
      renderAll();
    }

    function createSessionFromInput() {
      const rawInput = inputEl.value.trim();
      const invalidChar = rawInput.split('').find((char) => !activePreset.alphabet.includes(char));

      if (invalidChar) {
        clearResult();
        resultEl.style.display = 'block';
        resultEl.classList.remove('accept');
        resultEl.classList.add('reject');
        resultEl.textContent = `Entrada inválida: "${invalidChar}"`;
        appendLog(`Símbolo inválido: "${invalidChar}". Use apenas ${activePreset.alphabet.join(', ')}.`, 'reject');
        return false;
      }

      clearResult();
      session = {
        input: rawInput,
        index: 0,
        currentState: activePreset.initialState,
        finished: false,
      };
      appendLog(`Execução iniciada com entrada "${rawInput || 'ε'}".`);
      renderAll();

      if (rawInput.length === 0) {
        finishSession();
      }

      return true;
    }

    function stepSession() {
      if (!session || session.finished) return;

      if (session.index >= session.input.length) {
        finishSession();
        return;
      }

      const symbol = session.input[session.index];
      const fromState = session.currentState;
      const toState = activePreset.transitions[fromState]?.[symbol];

      if (!toState) {
        session.finished = true;
        resultEl.style.display = 'block';
        resultEl.classList.remove('accept');
        resultEl.classList.add('reject');
        resultEl.textContent = 'AFD inválido';
        appendLog(`Transição indefinida para δ(${fromState}, ${symbol}).`, 'reject');
        renderAll();
        return;
      }

      appendLog(`δ(${fromState}, ${symbol}) = ${toState}`);
      session.currentState = toState;
      session.index += 1;
      renderAll();

      if (session.index >= session.input.length) {
        finishSession();
      }
    }

    function resetSimulator(message = 'Selecione um autômato, digite uma string e clique em Iniciar.') {
      session = null;
      logEl.innerHTML = '';
      appendLog(message);
      clearResult();
      renderAll();
    }

    function applyPreset(rawId: string) {
      activePreset = getPresetById(rawId);
      presetDescEl.innerHTML = `<strong>${escapeHtml(activePreset.title)}:</strong> ${escapeHtml(activePreset.description)}`;
      inputEl.value = activePreset.defaultInput;

      presetButtons.forEach((button) => {
        const buttonPresetId = resolvePresetIdFromButton(button);
        button.classList.toggle('active', buttonPresetId === activePreset.id);
      });

      resetSimulator(`Preset ativo: ${activePreset.title}.`);
    }

    function handleSimulatorClick(event: Event) {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const presetButton = target.closest('button.preset-btn') as HTMLButtonElement | null;
      if (presetButton && simulatorRoot.contains(presetButton)) {
        const presetId = resolvePresetIdFromButton(presetButton);
        applyPreset(presetId);
        return;
      }

      const actionButton = target.closest('button.sim-btn') as HTMLButtonElement | null;
      if (!actionButton || !simulatorRoot.contains(actionButton)) {
        return;
      }

      const action = resolveActionFromButton(actionButton);
      if (action === 'init') {
        void createSessionFromInput();
      } else if (action === 'step') {
        if (!session) {
          const ok = createSessionFromInput();
          if (!ok) return;
        }
        stepSession();
      } else if (action === 'run') {
        if (!session) {
          const ok = createSessionFromInput();
          if (!ok) return;
        }
        while (session && !session.finished) {
          stepSession();
        }
      } else if (action === 'reset') {
        resetSimulator('Execução resetada.');
      }
    }

    simulatorRoot.addEventListener('click', handleSimulatorClick);

    const initiallyActive =
      presetButtons.find((button) => button.classList.contains('active')) || presetButtons[0];
    const initialPresetId = initiallyActive ? resolvePresetIdFromButton(initiallyActive) : 'par1s';
    applyPreset(initialPresetId || 'par1s');

    return () => {
      simulatorRoot.removeEventListener('click', handleSimulatorClick);
    };
  }, [moduleData.slug, source?.html]);

  const navLinks = useMemo(
    () => (source?.navLinks?.length ? source.navLinks : buildFallbackImportedNav(moduleData)),
    [source?.navLinks, moduleData]
  );

  useEffect(() => {
    if (navLinks.length === 0) {
      setActiveSectionId('');
      return;
    }

    setActiveSectionId((current) => {
      if (current && navLinks.some((link) => link.id === current)) {
        return current;
      }

      return navLinks[0].id;
    });
  }, [navLinks]);

  useEffect(() => {
    const root = importBodyRef.current;
    if (!root || navLinks.length === 0) {
      return;
    }
    const rootEl = root;

    const scrollContainer = rootEl.closest('.study-content') as HTMLElement | null;
    const listenerTarget: HTMLElement | Window = scrollContainer || window;
    const navHeight = sectionNavRef.current?.getBoundingClientRect().height ?? 48;
    const thresholdOffset = navHeight + 12;

    function sectionById(sectionId: string) {
      const localSection = rootEl.querySelector<HTMLElement>(`section[id="${sectionId}"]`);
      if (localSection) return localSection;

      const globalSection = document.getElementById(sectionId);
      if (globalSection && rootEl.contains(globalSection)) {
        return globalSection as HTMLElement;
      }

      return null;
    }

    function sectionTopInScrollContext(section: HTMLElement) {
      if (!scrollContainer) {
        return section.getBoundingClientRect().top + window.scrollY;
      }

      const sectionRect = section.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      return sectionRect.top - containerRect.top + scrollContainer.scrollTop;
    }

    function syncActiveSection() {
      const sectionPositions = navLinks
        .map((link) => {
          const section = sectionById(link.id);
          if (!section) return null;
          return { id: link.id, top: sectionTopInScrollContext(section) };
        })
        .filter((entry): entry is { id: string; top: number } => Boolean(entry));

      if (sectionPositions.length === 0) {
        return;
      }

      const uniqueTops = new Set(sectionPositions.map((entry) => Math.round(entry.top)));
      if (uniqueTops.size <= 1) {
        return;
      }

      const viewportTop = scrollContainer ? scrollContainer.scrollTop : window.scrollY;
      const currentMarker = viewportTop + thresholdOffset;

      let currentId = sectionPositions[0].id;
      sectionPositions.forEach((entry) => {
        if (entry.top <= currentMarker) {
          currentId = entry.id;
        }
      });

      setActiveSectionId(currentId);
    }

    listenerTarget.addEventListener('scroll', syncActiveSection, { passive: true });
    window.addEventListener('resize', syncActiveSection);
    syncActiveSection();

    return () => {
      listenerTarget.removeEventListener('scroll', syncActiveSection);
      window.removeEventListener('resize', syncActiveSection);
    };
  }, [navLinks, source?.html]);

  function handleSectionNavClick(event: MouseEvent<HTMLAnchorElement>, sectionId: string) {
    event.preventDefault();

    const root = importBodyRef.current;
    const section = root?.querySelector<HTMLElement>(`section[id="${sectionId}"]`) || document.getElementById(sectionId);
    if (!section) {
      return;
    }

    setActiveSectionId(sectionId);

    const scrollContainer = root?.closest('.study-content') as HTMLElement | null;
    const navHeight = sectionNavRef.current?.getBoundingClientRect().height ?? 48;
    if (scrollContainer) {
      const sectionRect = section.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      const targetTop = sectionRect.top - containerRect.top + scrollContainer.scrollTop - navHeight - 8;
      if (typeof scrollContainer.scrollTo === 'function') {
        scrollContainer.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
      } else {
        scrollContainer.scrollTop = Math.max(0, targetTop);
      }
      return;
    }

    if (typeof section.scrollIntoView === 'function') {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  const previousHref = moduleData.previousSlug ? `/trilhas/f6/${moduleData.previousSlug}` : null;
  const nextHref = moduleData.nextSlug ? `/trilhas/f6/${moduleData.nextSlug}` : null;

  return (
    <article className="module-lesson module-import" aria-label={`Módulo ${moduleData.order}`}>
      <header className="module-lesson-header">
        <span className="module-lesson-tag">
          {normalizeModuleLabels(source?.header.badge || formatModuleBadge(moduleData.order))}
        </span>
        <h1 className="module-lesson-title">{source?.header.title || getModuleTitleFallback(moduleData)}</h1>
        <p className="module-lesson-sub">
          {source?.header.subtitle || getModuleSubtitleFallback(moduleData)}
        </p>
        {source?.header.meta?.length ? (
          <div className="module-lesson-meta">
            {source.header.meta.map((item) => (
              <span key={item} className="module-lesson-meta-pill">
                {item}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      <nav ref={sectionNavRef} className="module-section-nav" aria-label="Navegação das seções">
        {navLinks.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className={`module-section-link ${activeSectionId === section.id ? 'active' : ''}`}
            onClick={(event) => handleSectionNavClick(event, section.id)}
          >
            {section.label}
          </a>
        ))}
      </nav>

      <div className="module-lesson-content">
        {source?.html ? (
          <div ref={importBodyRef} className="module-import-body" dangerouslySetInnerHTML={{ __html: source.html }} />
        ) : (
          <section className="section-card">Carregando conteúdo atualizado do módulo...</section>
        )}
      </div>

      <div className="module-lesson-nav">
        {previousHref ? (
          <Link href={previousHref} className="module-nav-btn prev">
            ← Módulo anterior
          </Link>
        ) : (
          <button type="button" className="module-nav-btn prev" disabled>
            ← Módulo anterior
          </button>
        )}
        <div className="module-lesson-progress">
          <span className="module-lesson-progress-label">Progresso na trilha</span>
          <span className="module-lesson-progress-track" aria-hidden="true">
            <span className="module-lesson-progress-fill" />
          </span>
          <span className="module-lesson-progress-frac">{`${moduleData.order} / 9 módulos`}</span>
        </div>
        {nextHref ? (
          <Link href={nextHref} className="module-nav-btn next">
            Próximo módulo →
          </Link>
        ) : (
          <button type="button" className="module-nav-btn next" disabled>
            Próximo módulo →
          </button>
        )}
      </div>
    </article>
  );
}

export function ModulePage({ moduleSlug, userId }: ModulePageProps) {
  const [moduleData, setModuleData] = useState<StudyModule | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadModule() {
      const response = await fetch(`/api/study/modules/${moduleSlug}`);
      if (!response.ok) {
        setModuleData(null);
        return;
      }
      const payload = (await response.json()) as StudyModule;
      setModuleData(payload);
      setAnswers({});
      setFeedback({});
      setSaveMessage(null);
    }

    void loadModule();
  }, [moduleSlug]);

  async function checkQuiz(questionId: string) {
    const choice = answers[questionId];
    if (!choice) {
      setFeedback((prev) => ({ ...prev, [questionId]: 'Selecione uma alternativa antes de verificar.' }));
      return;
    }

    const response = await fetch(`/api/study/modules/${moduleSlug}/quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, choice }),
    });

    const payload = (await response.json()) as { correct?: boolean; explanation?: string; error?: string };
    if (!response.ok) {
      setFeedback((prev) => ({ ...prev, [questionId]: payload.error || 'Falha ao corrigir questão.' }));
      return;
    }

    setFeedback((prev) => ({
      ...prev,
      [questionId]: `${payload.correct ? 'Correta' : 'Incorreta'}: ${payload.explanation || ''}`,
    }));
  }

  async function saveProgress() {
    if (!userId) {
      setSaveMessage('Faça login para salvar progresso do módulo.');
      return;
    }

    const response = await fetch(`/api/study/modules/${moduleSlug}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, status: 'completed', score: 1 }),
    });

    if (!response.ok) {
      setSaveMessage('Não foi possível salvar progresso.');
      return;
    }

    setSaveMessage('Progresso salvo com sucesso.');
  }

  if (!moduleData) {
    return <section className="section-card">Carregando módulo...</section>;
  }

  if (MODULE_IMPORT_SLUGS.has(moduleSlug)) {
    return <ModuleImportedLessonView moduleData={moduleData} />;
  }

  return (
    <>
      <section className="section-card">
        <p className="text-xs uppercase tracking-wide text-slate-500">{moduleData.progressLabel}</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">{moduleData.title}</h2>
        <p className="mt-2 text-sm text-slate-600">{moduleData.subtitle}</p>

        <nav className="mt-4 grid gap-2 md:grid-cols-3">
          {moduleData.chapters.map((chapter) => (
            <a
              key={chapter.id}
              href={`#${chapter.id}`}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              {chapter.title}
            </a>
          ))}
        </nav>
      </section>

      <section className="grid gap-3">
        {moduleData.chapters.map((chapter) => (
          <article key={chapter.id} id={chapter.id} className="section-card">
            <h3 className="text-lg font-semibold text-slate-900">{chapter.title}</h3>
            <p className="mt-2 text-sm text-slate-700">{chapter.content}</p>
          </article>
        ))}
      </section>

      <section className="section-card">
        <h3 className="text-lg font-semibold">Quiz do módulo</h3>
        <div className="mt-3 grid gap-4">
          {moduleData.quiz.map((question) => (
            <article key={question.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">{question.prompt}</p>
              <div className="mt-3 grid gap-2">
                {question.options.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className={`option-btn ${answers[question.id] === option.key ? 'is-selected' : ''}`}
                    onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: option.key }))}
                  >
                    <strong>{option.key})</strong> {option.text}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="sim-action-btn sim-action-btn-primary mt-3"
                onClick={() => void checkQuiz(question.id)}
              >
                Verificar
              </button>
              {feedback[question.id] ? <p className="mt-2 text-sm text-slate-700">{feedback[question.id]}</p> : null}
            </article>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="sim-action-btn sim-action-btn-secondary" onClick={() => void saveProgress()}>
            Salvar progresso
          </button>
          {moduleData.previousSlug ? (
            <Link href={`/trilhas/f6/${moduleData.previousSlug}`} className="sim-action-btn sim-action-btn-tertiary">
              Módulo anterior
            </Link>
          ) : null}
          {moduleData.nextSlug ? (
            <Link href={`/trilhas/f6/${moduleData.nextSlug}`} className="sim-action-btn sim-action-btn-primary">
              Próximo módulo
            </Link>
          ) : null}
        </div>
        {saveMessage ? <p className="mt-2 text-sm text-slate-700">{saveMessage}</p> : null}
      </section>
    </>
  );
}
