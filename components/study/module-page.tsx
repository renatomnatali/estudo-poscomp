'use client';

import { memo, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
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
  script?: string;
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
  'f1-1-analise-notacoes',
  'f1-2-notacoes-assintoticas',
  'f1-3-analise-recorrencias',
  'f2-1-estruturas-lineares',
  'f2-2-arvores-hashing',
  'f2-3-grafos',
  'f3-1-paradigmas',
  'f4-1-linguagens-formais',
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

interface InlineNfaPreset {
  id: string;
  title: string;
  description: string;
  alphabet: string[];
  states: string[];
  initialState: string;
  acceptStates: string[];
  transitions: Record<string, Record<string, string[]>>;
  positions: Record<string, { x: number; y: number }>;
  defaultInput: string;
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

const MODULE_03_AFN_PRESETS: Record<string, InlineNfaPreset> = {
  termina_ab: {
    id: 'termina_ab',
    title: 'Termina em "ab"',
    description:
      'Aceita strings sobre {a,b} cujo sufixo é "ab". O não-determinismo surge no estado q0: ao ler a, pode seguir em q0 ou abrir caminho para q1.',
    alphabet: ['a', 'b'],
    states: ['q0', 'q1', 'q2'],
    initialState: 'q0',
    acceptStates: ['q2'],
    transitions: {
      q0: { a: ['q0', 'q1'], b: ['q0'], ε: [] },
      q1: { a: [], b: ['q2'], ε: [] },
      q2: { a: [], b: [], ε: [] },
    },
    positions: {
      q0: { x: 95, y: 112 },
      q1: { x: 235, y: 112 },
      q2: { x: 375, y: 112 },
    },
    defaultInput: 'aab',
  },
  contem_11: {
    id: 'contem_11',
    title: 'Contém "11"',
    description:
      'Aceita strings binárias que contêm "11" como subpalavra. Ao ler 1 em q0, o AFN pode continuar em q0 ou abrir um caminho para q1.',
    alphabet: ['0', '1'],
    states: ['q0', 'q1', 'q2'],
    initialState: 'q0',
    acceptStates: ['q2'],
    transitions: {
      q0: { '0': ['q0'], '1': ['q0', 'q1'], ε: [] },
      q1: { '0': [], '1': ['q2'], ε: [] },
      q2: { '0': ['q2'], '1': ['q2'], ε: [] },
    },
    positions: {
      q0: { x: 95, y: 112 },
      q1: { x: 235, y: 112 },
      q2: { x: 375, y: 112 },
    },
    defaultInput: '1011',
  },
  eps_demo: {
    id: 'eps_demo',
    title: 'Demo ε-transições',
    description:
      'Demonstra ε-closure: q0 aceita a por q1 e também pode ir por ε até q2 para aceitar b em q3.',
    alphabet: ['a', 'b'],
    states: ['q0', 'q1', 'q2', 'q3'],
    initialState: 'q0',
    acceptStates: ['q1', 'q3'],
    transitions: {
      q0: { a: ['q1'], b: [], ε: ['q2'] },
      q1: { a: [], b: [], ε: [] },
      q2: { a: [], b: ['q3'], ε: [] },
      q3: { a: [], b: [], ε: [] },
    },
    positions: {
      q0: { x: 95, y: 110 },
      q1: { x: 235, y: 58 },
      q2: { x: 235, y: 166 },
      q3: { x: 375, y: 166 },
    },
    defaultInput: 'b',
  },
};

function normalizePresetId(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getEventTargetElement(event: Event) {
  const target = event.target as EventTarget | null;
  if (!target) {
    return null;
  }

  // Avoid instanceof checks here because test/runtime realms may differ.
  if (typeof (target as { closest?: unknown }).closest === 'function') {
    return target as Element;
  }

  if (typeof (target as { nodeType?: unknown }).nodeType === 'number') {
    return (target as Node).parentElement;
  }

  if (typeof event.composedPath === 'function') {
    const path = event.composedPath();
    for (const item of path) {
      if (item && typeof (item as { closest?: unknown }).closest === 'function') {
        return item as Element;
      }
    }
  }

  return null;
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

function buildTrackModuleHref(trackCode: string, moduleSlug: string) {
  return `/trilhas/${trackCode.toLowerCase()}/${moduleSlug}`;
}

function parseTrackTotalModules(progressLabel: string, fallback = 9) {
  const match = progressLabel.match(/de\s*(\d+)/i);
  if (!match) {
    return fallback;
  }

  const parsed = Number.parseInt(match[1] || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
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

const ImportedBody = memo(function ImportedBody({
  html,
  bodyRef,
}: {
  html: string;
  bodyRef: { current: HTMLDivElement | null };
}) {
  return <div ref={bodyRef} className="module-import-body" dangerouslySetInnerHTML={{ __html: html }} />;
});

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
        script: typeof payload.script === 'string' ? payload.script : undefined,
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
      resultEl.classList.remove('is-correct', 'is-wrong', 'correct', 'wrong');
      if (isCorrect) {
        resultEl.classList.add('is-correct', 'correct');
      } else {
        resultEl.classList.add('is-wrong', 'wrong');
      }
      resultEl.textContent = message;
    }

    function clearOptionState(optionsRoot: HTMLElement) {
      optionsRoot.querySelectorAll<HTMLElement>('.opt').forEach((label) => {
        label.classList.remove('is-selected', 'is-correct', 'is-wrong');
      });
    }

    function resolveQuizExplanation(button: HTMLButtonElement) {
      const rawExplanation = (
        button.getAttribute('data-explanation') || button.getAttribute('data-explanation-id') || ''
      ).trim();
      if (!rawExplanation || /^[a-z]\d+$/i.test(rawExplanation)) {
        return '';
      }
      return rawExplanation;
    }

    function handleVerifyClick(event: Event) {
      const target = getEventTargetElement(event);
      const button = target?.closest('button.quiz-btn') as HTMLButtonElement | null;
      if (!button || !rootEl.contains(button)) {
        return;
      }

      const questionId = button.dataset.questionId;
      const answerKey = (button.dataset.answerKey || '').trim().toUpperCase();
      if (!questionId || !answerKey) {
        return;
      }
      const explanation = resolveQuizExplanation(button);

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
          ? `Correta. Alternativa ${answerKey}.${explanation ? ` ${explanation}` : ''}`
          : `Incorreta. Resposta correta: ${answerKey}.${explanation ? ` ${explanation}` : ''}`,
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
      const target = getEventTargetElement(event);
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

  useEffect(() => {
    if (moduleData.slug !== 'modulo-03') {
      return;
    }

    const root = importBodyRef.current;
    if (!root) {
      return;
    }

    const afnRoot = root.querySelector<HTMLElement>('#sim-afn');
    const subsetRoot = root.querySelector<HTMLElement>('.subset-builder');

    const cleanups: Array<() => void> = [];

    if (afnRoot) {
      const presetButtons = Array.from(afnRoot.querySelectorAll<HTMLButtonElement>('button.preset-btn'));
      const actionButtons = Array.from(afnRoot.querySelectorAll<HTMLButtonElement>('button.sim-btn'));
      const presetDescEl = afnRoot.querySelector<HTMLElement>('#afn-preset-desc');
      const activeStatesEl = afnRoot.querySelector<HTMLElement>('#afn-active');
      const tapeEl = afnRoot.querySelector<HTMLElement>('#afn-tape');
      const inputEl = afnRoot.querySelector<HTMLInputElement>('#afn-string');
      const logEl = afnRoot.querySelector<HTMLElement>('#afn-log');
      const resultEl = afnRoot.querySelector<HTMLElement>('#afn-result');
      const canvasEl = afnRoot.querySelector<HTMLCanvasElement>('#afn-canvas');

      if (presetDescEl && activeStatesEl && tapeEl && inputEl && logEl && resultEl && canvasEl) {
        let activePreset: InlineNfaPreset = MODULE_03_AFN_PRESETS.termina_ab;
        let currentInput = '';
        let currentIndex = 0;
        let activeStates = new Set<string>();
        let running = false;

        function setKey(states: Set<string>) {
          if (states.size === 0) {
            return '∅';
          }
          return `{${Array.from(states).sort().join(', ')}}`;
        }

        function epsilonClosure(states: Iterable<string>) {
          const visited = new Set<string>();
          const queue = Array.from(states);

          queue.forEach((state) => visited.add(state));

          while (queue.length > 0) {
            const state = queue.shift();
            if (!state) {
              continue;
            }

            const epsilonTargets = activePreset.transitions[state]?.ε || [];
            epsilonTargets.forEach((nextState) => {
              if (visited.has(nextState)) {
                return;
              }
              visited.add(nextState);
              queue.push(nextState);
            });
          }

          return visited;
        }

        function move(states: Set<string>, symbol: string) {
          const result = new Set<string>();
          states.forEach((state) => {
            const targets = activePreset.transitions[state]?.[symbol] || [];
            targets.forEach((target) => result.add(target));
          });
          return result;
        }

        function appendLog(message: string, tone: 'step' | 'branch' | 'eps' | 'accept' | 'reject' = 'step') {
          const line = document.createElement('div');
          let className = 'log-line';
          if (tone === 'branch') {
            className += ' log-branch';
          } else if (tone === 'eps') {
            className += ' log-eps';
          } else if (tone === 'accept') {
            className += ' log-accept';
          } else if (tone === 'reject') {
            className += ' log-reject';
          }
          line.className = className;
          line.textContent = message;
          logEl.appendChild(line);
          logEl.scrollTop = logEl.scrollHeight;
        }

        function clearResult() {
          resultEl.textContent = '';
          resultEl.classList.remove('accept', 'reject');
          resultEl.style.display = 'none';
        }

        function renderActiveStates() {
          if (activeStates.size === 0) {
            activeStatesEl.innerHTML = '<span style="color:var(--muted); font-size:0.85rem;">∅ (morto)</span>';
            return;
          }

          activeStatesEl.innerHTML = '';
          Array.from(activeStates)
            .sort()
            .forEach((state) => {
              const bubble = document.createElement('span');
              bubble.className = 'state-bubble';
              if (state === activePreset.initialState) {
                bubble.classList.add('initial');
              }
              if (activePreset.acceptStates.includes(state)) {
                bubble.classList.add('final');
              }
              bubble.textContent = state;
              activeStatesEl.appendChild(bubble);
            });
        }

        function renderTape() {
          tapeEl.innerHTML = '';

          if (currentInput.length === 0) {
            const epsilonCell = document.createElement('span');
            epsilonCell.className = 'tcell';
            epsilonCell.style.fontStyle = 'italic';
            epsilonCell.style.fontSize = '0.85rem';
            epsilonCell.style.color = 'var(--muted)';
            epsilonCell.textContent = 'ε';
            tapeEl.appendChild(epsilonCell);
            return;
          }

          currentInput.split('').forEach((symbol, index) => {
            const cell = document.createElement('span');
            cell.className = 'tcell';
            if (index < currentIndex) {
              cell.classList.add('done');
            } else if (index === currentIndex && running) {
              cell.classList.add('reading');
            } else {
              cell.classList.add('pending');
            }
            cell.textContent = symbol;
            tapeEl.appendChild(cell);
          });
        }

        function drawDiagram() {
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

          const width = 520;
          const height = 210;
          canvasEl.width = width;
          canvasEl.height = height;

          ctx.clearRect(0, 0, width, height);
          ctx.fillStyle = '#f8f4ff';
          ctx.fillRect(0, 0, width, height);

          const drawn = new Set<string>();
          activePreset.states.forEach((fromState) => {
            const fromPos = activePreset.positions[fromState];
            if (!fromPos) {
              return;
            }

            [...activePreset.alphabet, 'ε'].forEach((symbol) => {
              const targets = activePreset.transitions[fromState]?.[symbol] || [];
              targets.forEach((toState) => {
                const toPos = activePreset.positions[toState];
                if (!toPos) {
                  return;
                }

                const edgeKey = `${fromState}->${toState}:${symbol}`;
                if (drawn.has(edgeKey)) {
                  return;
                }
                drawn.add(edgeKey);

                const isEpsilon = symbol === 'ε';
                ctx.strokeStyle = isEpsilon ? '#6c3faa' : '#1a6bcc';
                ctx.fillStyle = ctx.strokeStyle;
                ctx.lineWidth = isEpsilon ? 1.6 : 2;
                if (isEpsilon) {
                  ctx.setLineDash([4, 3]);
                } else {
                  ctx.setLineDash([]);
                }

                if (fromState === toState) {
                  ctx.beginPath();
                  ctx.arc(fromPos.x, fromPos.y - 38, 14, Math.PI * 0.2, Math.PI * 1.8);
                  ctx.stroke();
                  ctx.fillText(symbol, fromPos.x - 4, fromPos.y - 58);
                  return;
                }

                ctx.beginPath();
                ctx.moveTo(fromPos.x + 28, fromPos.y);
                ctx.lineTo(toPos.x - 28, toPos.y);
                ctx.stroke();
                ctx.fillText(symbol, (fromPos.x + toPos.x) / 2 - 6, (fromPos.y + toPos.y) / 2 - 8);
              });
            });
          });
          ctx.setLineDash([]);

          const initialPos = activePreset.positions[activePreset.initialState];
          if (initialPos) {
            ctx.strokeStyle = '#1a6bcc';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(initialPos.x - 62, initialPos.y);
            ctx.lineTo(initialPos.x - 30, initialPos.y);
            ctx.stroke();
          }

          activePreset.states.forEach((state) => {
            const position = activePreset.positions[state];
            if (!position) {
              return;
            }

            const isActive = activeStates.has(state);
            const isFinal = activePreset.acceptStates.includes(state);

            ctx.fillStyle = isActive ? '#f3eeff' : '#ffffff';
            ctx.strokeStyle = isActive ? '#6c3faa' : '#1a6bcc';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(position.x, position.y, 24, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            if (isFinal) {
              ctx.beginPath();
              ctx.arc(position.x, position.y, 18, 0, Math.PI * 2);
              ctx.stroke();
            }

            ctx.fillStyle = '#0d2d6b';
            ctx.font = 'bold 12px "DM Mono", monospace';
            ctx.fillText(state, position.x - 10, position.y + 4);
          });
        }

        function renderAll() {
          renderActiveStates();
          renderTape();
          drawDiagram();
        }

        function showResult(accepted: boolean) {
          resultEl.style.display = 'block';
          resultEl.classList.remove('accept', 'reject');
          resultEl.classList.add(accepted ? 'accept' : 'reject');
          resultEl.textContent = accepted
            ? `ACEITA — "${currentInput || 'ε'}" ∈ L(N)`
            : `REJEITA — "${currentInput || 'ε'}" ∉ L(N)`;
          appendLog(
            accepted
              ? `ACEITA: conjunto final ${setKey(activeStates)} contém estado de aceitação.`
              : `REJEITA: conjunto final ${setKey(activeStates)} não contém estado de aceitação.`,
            accepted ? 'accept' : 'reject'
          );
        }

        function finalize() {
          const accepted = Array.from(activeStates).some((state) => activePreset.acceptStates.includes(state));
          showResult(accepted);
          running = false;
          renderAll();
        }

        function initSession() {
          const rawInput = inputEl.value.trim();
          const invalidChar = rawInput.split('').find((char) => !activePreset.alphabet.includes(char));
          if (invalidChar) {
            clearResult();
            resultEl.style.display = 'block';
            resultEl.classList.remove('accept');
            resultEl.classList.add('reject');
            resultEl.textContent = `Entrada inválida: "${invalidChar}"`;
            appendLog(`Símbolo inválido "${invalidChar}". Use apenas {${activePreset.alphabet.join(', ')}}.`, 'reject');
            running = false;
            return false;
          }

          currentInput = rawInput;
          currentIndex = 0;
          running = true;
          clearResult();
          logEl.innerHTML = '';

          activeStates = epsilonClosure([activePreset.initialState]);
          appendLog(`▶ Estado inicial: ε-closure({${activePreset.initialState}}) = ${setKey(activeStates)}`);
          renderAll();

          if (currentInput.length === 0) {
            finalize();
          }

          return true;
        }

        function stepSession() {
          if (!running) {
            return;
          }
          if (currentIndex >= currentInput.length || activeStates.size === 0) {
            finalize();
            return;
          }

          const symbol = currentInput[currentIndex] || '';
          const moved = move(activeStates, symbol);
          appendLog(`Lê '${symbol}': Move(${setKey(activeStates)}, '${symbol}') = ${setKey(moved)}`, 'branch');
          const closed = epsilonClosure(moved);
          if (closed.size !== moved.size || Array.from(closed).some((state) => !moved.has(state))) {
            appendLog(`ε-closure(${setKey(moved)}) = ${setKey(closed)}`, 'eps');
          }

          activeStates = closed;
          currentIndex += 1;
          renderAll();

          if (currentIndex >= currentInput.length || activeStates.size === 0) {
            finalize();
          }
        }

        function runSession() {
          if (!running) {
            const ok = initSession();
            if (!ok) {
              return;
            }
          }

          let guard = 0;
          while (running && currentIndex < currentInput.length && activeStates.size > 0 && guard < 64) {
            stepSession();
            guard += 1;
          }
          if (running) {
            finalize();
          }
        }

        function resetSession(message = 'Escolha um autômato, digite uma string e clique em Iniciar.') {
          currentInput = '';
          currentIndex = 0;
          running = false;
          inputEl.value = '';
          activeStates = epsilonClosure([activePreset.initialState]);
          clearResult();
          logEl.innerHTML = `<span style="color:var(--muted);">${message}</span>`;
          renderAll();
        }

        function resolvePresetId(button: HTMLButtonElement) {
          const byData = (button.dataset.presetId || '').trim().toLowerCase();
          if (byData.includes('termina')) return 'termina_ab';
          if (byData.includes('contem')) return 'contem_11';
          if (byData.includes('eps')) return 'eps_demo';

          const label = normalizePresetId(button.textContent || '');
          if (label.includes('termina')) return 'termina_ab';
          if (label.includes('contem')) return 'contem_11';
          if (label.includes('eps')) return 'eps_demo';
          return 'termina_ab';
        }

        function resolveAction(button: HTMLButtonElement) {
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

        function applyPreset(rawPresetId: string) {
          activePreset = MODULE_03_AFN_PRESETS[rawPresetId] || MODULE_03_AFN_PRESETS.termina_ab;
          presetDescEl.innerHTML = `<strong>${activePreset.title}:</strong> ${activePreset.description}`;
          inputEl.value = activePreset.defaultInput;

          presetButtons.forEach((button) => {
            button.classList.toggle('active', resolvePresetId(button) === activePreset.id);
          });

          currentInput = '';
          currentIndex = 0;
          running = false;
          activeStates = epsilonClosure([activePreset.initialState]);
          clearResult();
          logEl.innerHTML = `<span style="color:var(--muted);">Preset ativo: ${activePreset.title}.</span>`;
          renderAll();
        }

        function handleAfnClick(event: Event) {
          const target = getEventTargetElement(event);
          if (!target) {
            return;
          }

          const presetButton = target.closest('button.preset-btn') as HTMLButtonElement | null;
          if (presetButton && afnRoot.contains(presetButton)) {
            applyPreset(resolvePresetId(presetButton));
            return;
          }

          const actionButton = target.closest('button.sim-btn') as HTMLButtonElement | null;
          if (!actionButton || !afnRoot.contains(actionButton)) {
            return;
          }

          const action = resolveAction(actionButton);
          if (action === 'init') {
            void initSession();
          } else if (action === 'step') {
            if (!running) {
              const ok = initSession();
              if (!ok) {
                return;
              }
            }
            stepSession();
          } else if (action === 'run') {
            runSession();
          } else if (action === 'reset') {
            resetSession('Execução resetada.');
          }
        }

        afnRoot.addEventListener('click', handleAfnClick);
        cleanups.push(() => afnRoot.removeEventListener('click', handleAfnClick));

        const initialPresetButton = presetButtons.find((button) => button.classList.contains('active')) || presetButtons[0];
        if (initialPresetButton) {
          applyPreset(resolvePresetId(initialPresetButton));
        } else {
          activeStates = epsilonClosure([activePreset.initialState]);
          renderAll();
        }

        actionButtons.forEach((button) => {
          if (!button.getAttribute('type')) {
            button.setAttribute('type', 'button');
          }
        });
      }
    }

    if (subsetRoot) {
      const controls = Array.from(subsetRoot.querySelectorAll<HTMLButtonElement>('button.sim-btn'));
      const stepsEl = subsetRoot.querySelector<HTMLElement>('#subset-steps');
      const tableContainerEl = subsetRoot.querySelector<HTMLElement>('#subset-table-container');
      const statusEl = subsetRoot.querySelector<HTMLElement>('#sb-status');

      if (stepsEl && tableContainerEl && statusEl) {
        const basePreset = MODULE_03_AFN_PRESETS.termina_ab;
        type SubsetEntry = {
          key: string;
          set: Set<string>;
          transitions: Record<string, Set<string> | null>;
          done: boolean;
        };

        const entriesByKey = new Map<string, SubsetEntry>();
        const orderedEntries: SubsetEntry[] = [];
        const pendingKeys: string[] = [];

        function setKey(states: Set<string>) {
          if (states.size === 0) {
            return '∅';
          }
          return `{${Array.from(states).sort().join(', ')}}`;
        }

        function epsilonClosure(states: Iterable<string>) {
          const visited = new Set<string>();
          const queue = Array.from(states);

          queue.forEach((state) => visited.add(state));
          while (queue.length > 0) {
            const state = queue.shift();
            if (!state) {
              continue;
            }

            const epsilonTargets = basePreset.transitions[state]?.ε || [];
            epsilonTargets.forEach((nextState) => {
              if (visited.has(nextState)) {
                return;
              }
              visited.add(nextState);
              queue.push(nextState);
            });
          }

          return visited;
        }

        function move(states: Set<string>, symbol: string) {
          const result = new Set<string>();
          states.forEach((state) => {
            const targets = basePreset.transitions[state]?.[symbol] || [];
            targets.forEach((target) => result.add(target));
          });
          return result;
        }

        function addEntry(states: Set<string>) {
          const key = setKey(states);
          const existing = entriesByKey.get(key);
          if (existing) {
            return { entry: existing, created: false };
          }

          const nextEntry: SubsetEntry = {
            key,
            set: new Set(states),
            transitions: {},
            done: false,
          };
          entriesByKey.set(key, nextEntry);
          orderedEntries.push(nextEntry);
          pendingKeys.push(key);
          return { entry: nextEntry, created: true };
        }

        function appendStep(message: string) {
          const line = document.createElement('div');
          line.className = 'sb-step';
          line.textContent = message;
          stepsEl.appendChild(line);
        }

        function renderTable() {
          let html = '<table class="subset-table"><tr><th>Estado AFD</th>';
          basePreset.alphabet.forEach((symbol) => {
            html += `<th>Lê '${symbol}'</th>`;
          });
          html += '<th>Tipo</th></tr>';

          orderedEntries.forEach((entry, index) => {
            const isInitial = index === 0;
            const isFinal = Array.from(entry.set).some((state) => basePreset.acceptStates.includes(state));
            let rowClass = '';
            if (isFinal) {
              rowClass = 'subset-final';
            } else if (isInitial) {
              rowClass = 'subset-initial';
            } else {
              rowClass = 'subset-new';
            }

            html += `<tr class="${rowClass}"><td><code>${entry.key}</code></td>`;
            basePreset.alphabet.forEach((symbol) => {
              const target = entry.transitions[symbol];
              html += `<td><code>${target ? setKey(target) : '—'}</code></td>`;
            });

            const tag: string[] = [];
            if (isInitial) tag.push('→ inicial');
            if (isFinal) tag.push('★ final');
            if (!entry.done) tag.push('…');
            html += `<td style="font-size:0.82rem;">${tag.join(' ')}</td></tr>`;
          });

          html += '</table>';
          tableContainerEl.innerHTML = html;
        }

        function resetBuilder() {
          entriesByKey.clear();
          orderedEntries.length = 0;
          pendingKeys.length = 0;
          stepsEl.innerHTML = '';
          tableContainerEl.innerHTML = '';

          const initialSet = epsilonClosure([basePreset.initialState]);
          const initial = addEntry(initialSet).entry;
          appendStep(`Estado inicial do AFD: ${initial.key}`);
          renderTable();
          statusEl.textContent = 'Construção iniciada. Clique em "Próximo passo" para expandir.';
        }

        function runBuilderStep() {
          while (pendingKeys.length > 0) {
            const currentKey = pendingKeys.shift() || '';
            const currentEntry = entriesByKey.get(currentKey);
            if (!currentEntry || currentEntry.done) {
              continue;
            }

            basePreset.alphabet.forEach((symbol) => {
              const moved = move(currentEntry.set, symbol);
              const closed = epsilonClosure(moved);
              currentEntry.transitions[symbol] = closed;

              const created = addEntry(closed).created;
              appendStep(`δ(${currentEntry.key}, '${symbol}') = ${setKey(closed)}${created ? ' (novo estado)' : ''}`);
            });

            currentEntry.done = true;
            renderTable();
            statusEl.textContent =
              pendingKeys.length > 0
                ? `Processados ${orderedEntries.filter((entry) => entry.done).length} estado(s).`
                : 'Construção concluída.';
            return true;
          }

          statusEl.textContent = 'Construção concluída.';
          return false;
        }

        function runBuilderAll() {
          let guard = 0;
          while (runBuilderStep() && guard < 64) {
            guard += 1;
          }
        }

        function resolveBuilderAction(button: HTMLButtonElement) {
          const byData = (button.dataset.simAction || '').trim().toLowerCase();
          if (byData === 'subset-step' || byData === 'subset-all' || byData === 'subset-reset') {
            return byData;
          }

          const label = normalizePresetId(button.textContent || '');
          if (label.includes('proximo passo')) return 'subset-step';
          if (label.includes('construir tudo')) return 'subset-all';
          if (label.includes('reset')) return 'subset-reset';
          return '';
        }

        function handleBuilderClick(event: Event) {
          const target = getEventTargetElement(event);
          const button = target?.closest('button.sim-btn') as HTMLButtonElement | null;
          if (!button || !subsetRoot.contains(button)) {
            return;
          }

          const action = resolveBuilderAction(button);
          if (action === 'subset-step') {
            runBuilderStep();
          } else if (action === 'subset-all') {
            runBuilderAll();
          } else if (action === 'subset-reset') {
            resetBuilder();
          }
        }

        subsetRoot.addEventListener('click', handleBuilderClick);
        cleanups.push(() => subsetRoot.removeEventListener('click', handleBuilderClick));

        controls.forEach((button) => {
          if (!button.getAttribute('type')) {
            button.setAttribute('type', 'button');
          }
        });

        resetBuilder();
      }
    }

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [moduleData.slug, source?.html]);

  useEffect(() => {
    if (moduleData.slug !== 'modulo-01') {
      return;
    }

    const root = importBodyRef.current;
    if (!root) {
      return;
    }

    const simulatorRoot = root.querySelector<HTMLElement>('#kleene-sim');
    if (!simulatorRoot) {
      return;
    }

    const sigmaInput = simulatorRoot.querySelector<HTMLInputElement>('#sigmaInput');
    const maxLenInput = simulatorRoot.querySelector<HTMLInputElement>('#maxLen');
    const outputEl = simulatorRoot.querySelector<HTMLElement>('#kleeneOutput');
    const statsEl = simulatorRoot.querySelector<HTMLElement>('#kleeneStats');

    if (!sigmaInput || !maxLenInput || !outputEl || !statsEl) {
      return;
    }

    const LEVEL_CLASSES = ['lvl0', 'lvl1', 'lvl2', 'lvl3', 'lvl4plus'];
    const MAX_SYMBOLS = 4;
    const MAX_N = 5;
    const MAX_CHIPS = 60;

    function parseAlphabet(raw: string) {
      return raw
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0 && item.length <= 3);
    }

    function generateLevel(alphabet: string[], n: number) {
      if (n === 0) {
        return ['ε'];
      }

      let current = [''];
      for (let index = 0; index < n; index += 1) {
        const next: string[] = [];
        current.forEach((word) => {
          alphabet.forEach((symbol) => {
            next.push(word + symbol);
          });
        });
        current = next;
      }
      return current;
    }

    function showSimulatorError(message: string) {
      outputEl.innerHTML = `<p style="color:var(--red);font-size:0.88rem">${message}</p>`;
      statsEl.style.display = 'none';
    }

    function runKleene() {
      const alphabet = parseAlphabet(sigmaInput.value);
      const parsedMaxN = Number.parseInt(maxLenInput.value, 10);
      const maxN = Number.isFinite(parsedMaxN) ? parsedMaxN : 3;

      if (alphabet.length < 1) {
        showSimulatorError('Insira pelo menos um símbolo (ex: a,b)');
        return;
      }

      if (alphabet.length > MAX_SYMBOLS) {
        showSimulatorError('Máximo 4 símbolos para manter a visualização legível.');
        return;
      }

      const clampedN = Math.min(maxN, MAX_N);
      outputEl.innerHTML = '';

      let totalStrings = 0;

      for (let n = 0; n <= clampedN; n += 1) {
        const strings = generateLevel(alphabet, n);
        totalStrings += strings.length;

        const levelEl = document.createElement('div');
        levelEl.className = 'kleene-level';

        const headerEl = document.createElement('div');
        headerEl.className = 'kleene-level-header';
        const count = Math.pow(alphabet.length, n === 0 ? 0 : n);
        headerEl.textContent = `n = ${n}   (${count} string${count > 1 ? 's' : ''})`;
        levelEl.appendChild(headerEl);

        const chipsEl = document.createElement('div');
        chipsEl.className = 'kleene-chips';

        const className = LEVEL_CLASSES[Math.min(n, 4)];
        const limit = Math.min(strings.length, MAX_CHIPS);

        for (let index = 0; index < limit; index += 1) {
          const chipEl = document.createElement('span');
          chipEl.className = `k-chip ${className}`;
          chipEl.textContent = strings[index];
          chipsEl.appendChild(chipEl);
        }

        if (strings.length > MAX_CHIPS) {
          const moreEl = document.createElement('span');
          moreEl.className = 'k-more';
          moreEl.textContent = `+${strings.length - MAX_CHIPS} mais…`;
          chipsEl.appendChild(moreEl);
        }

        levelEl.appendChild(chipsEl);
        outputEl.appendChild(levelEl);
      }

      statsEl.style.display = 'block';
      statsEl.innerHTML = `Σ = {${alphabet.join(
        ', '
      )}} &nbsp;|&nbsp; Strings geradas (n=0 até ${clampedN}): <strong>${totalStrings}</strong> &nbsp;|&nbsp; Σ* total: <strong>∞</strong> (enumerável)`;
    }

    function clearKleene() {
      outputEl.innerHTML = '';
      statsEl.style.display = 'none';
    }

    function handleSimulatorClick(event: Event) {
      const target = getEventTargetElement(event);
      if (!target) {
        return;
      }

      const button = target.closest('button.sim-btn') as HTMLButtonElement | null;
      if (!button || !simulatorRoot.contains(button)) {
        return;
      }

      const text = normalizePresetId(button.textContent || '');
      const isGenerate = button.classList.contains('go') || text.includes('gerar');
      const isClear = button.classList.contains('rst') || text.includes('limpar');

      if (isGenerate) {
        runKleene();
      } else if (isClear) {
        clearKleene();
      }
    }

    simulatorRoot.addEventListener('click', handleSimulatorClick);
    return () => {
      simulatorRoot.removeEventListener('click', handleSimulatorClick);
    };
  }, [moduleData.slug, source?.html]);

  useEffect(() => {
    if (moduleData.slug !== 'f1-2-notacoes-assintoticas') {
      return;
    }

    const root = importBodyRef.current;
    if (!root) {
      return;
    }

    type ImportedInteractiveWindow = Window & {
      toggleAnim?: () => void;
      resetAnim?: () => void;
      updateCounts?: (step: number | string) => void;
      toggleLine?: (idx: number | string) => void;
      toggleDetails?: (triggerEl: Element | null) => void;
      answer?: (qid: string, el: Element | null, chosen: string) => void;
    };

    const win = window as ImportedInteractiveWindow;
    let animFrame: number | null = null;
    let animProgress = 0;
    let animRunning = false;

    function extractQuizChoice(option: HTMLElement) {
      const inlineAction = option.getAttribute('data-inline-onclick') || option.getAttribute('onclick') || '';
      const inlineMatch = inlineAction.match(/'([A-E])'\)/i);
      if (inlineMatch && inlineMatch[1]) {
        return inlineMatch[1].toUpperCase();
      }

      const textMatch = (option.textContent || '').match(/([A-E])\)/i);
      return textMatch && textMatch[1] ? textMatch[1].toUpperCase() : '';
    }

    function deriveFallbackClickAction(node: HTMLElement) {
      if (node.id === 'animPlayBtn') {
        return 'toggleAnim()';
      }

      if (node.matches('.anim-controls .anim-btn')) {
        const label = (node.textContent || '').toLowerCase();
        if (label.includes('reiniciar')) {
          return 'resetAnim()';
        }
        if (label.includes('animar') || label.includes('pausar')) {
          return 'toggleAnim()';
        }
      }

      const codeLine = node.closest<HTMLElement>('#codeAnn .code-line');
      if (codeLine) {
        const lines = Array.from(root.querySelectorAll<HTMLElement>('#codeAnn .code-line'));
        const lineIndex = lines.indexOf(codeLine);
        if (lineIndex >= 0) {
          return `toggleLine(${lineIndex})`;
        }
      }

      const detailsTrigger = node.closest<HTMLElement>('.dt-trigger');
      if (detailsTrigger) {
        return 'toggleDetails(this)';
      }

      const quizOption = node.closest<HTMLElement>('.quiz-box .quiz-option');
      if (quizOption) {
        const qid = quizOption.closest<HTMLElement>('.quiz-box')?.id || '';
        const choice = extractQuizChoice(quizOption);
        if (qid && choice) {
          return `answer('${qid}',this,'${choice}')`;
        }
      }

      return '';
    }

    root.querySelectorAll<HTMLElement>('[onclick]').forEach((node) => {
      const raw = node.getAttribute('onclick') || '';
      if (!/(toggleAnim|resetAnim|toggleLine|toggleDetails|answer)/.test(raw)) {
        return;
      }
      node.setAttribute('data-inline-onclick', raw);
      node.removeAttribute('onclick');
    });

    const sliderWithInline = root.querySelector<HTMLInputElement>('#nSlider');
    if (sliderWithInline) {
      const raw = sliderWithInline.getAttribute('oninput') || '';
      if (raw.includes('updateCounts')) {
        sliderWithInline.setAttribute('data-inline-oninput', raw);
        sliderWithInline.removeAttribute('oninput');
      }
    }

    function fReal(n: number) {
      return 3 * n * n + 5 * n;
    }

    function fCeil(n: number) {
      return 8 * n * n;
    }

    function drawBigOCanvas(progress: number) {
      const canvas = root.querySelector<HTMLCanvasElement>('#bigOCanvas');
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.offsetWidth || 640;
      const height = canvas.offsetHeight || 240;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const padLeft = 50;
      const padRight = 20;
      const padTop = 20;
      const padBottom = 36;
      const graphWidth = width - padLeft - padRight;
      const graphHeight = height - padTop - padBottom;
      const maxN = 20;
      const nCut = Math.floor(progress * maxN);
      const yMax = fCeil(maxN) * 1.05;

      function xOf(n: number) {
        return padLeft + (n / maxN) * graphWidth;
      }

      function yOf(value: number) {
        return padTop + graphHeight - (value / yMax) * graphHeight;
      }

      ctx.strokeStyle = 'rgba(255,255,255,.06)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i += 1) {
        const y = padTop + (i / 4) * graphHeight;
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(width - padRight, y);
        ctx.stroke();

        const value = Math.round((yMax * (4 - i)) / 4);
        ctx.fillStyle = 'rgba(255,255,255,.35)';
        ctx.font = '9px "DM Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(value > 1000 ? `${(value / 1000).toFixed(1)}K` : String(value), padLeft - 5, y + 3);
      }

      for (let n = 0; n <= maxN; n += 5) {
        const x = xOf(n);
        ctx.beginPath();
        ctx.moveTo(x, padTop);
        ctx.lineTo(x, padTop + graphHeight);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,.4)';
        ctx.textAlign = 'center';
        ctx.font = '9px "DM Mono", monospace';
        ctx.fillText(`n=${n}`, x, padTop + graphHeight + 16);
      }

      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.font = '9px "DM Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('operações', padLeft - 38, padTop + graphHeight / 2);
      ctx.fillText('n (tamanho da entrada)', padLeft + graphWidth / 2, height - 4);

      ctx.strokeStyle = '#ff8a65';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      for (let n = 0; n <= nCut; n += 1) {
        const x = xOf(n);
        const y = yOf(fCeil(n));
        if (n === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = '#64b5f6';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let n = 0; n <= nCut; n += 1) {
        const x = xOf(n);
        const y = yOf(fReal(n));
        if (n === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      if (nCut >= 1) {
        const x0 = xOf(1);
        ctx.strokeStyle = '#81c784';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(x0, padTop);
        ctx.lineTo(x0, padTop + graphHeight);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#81c784';
        ctx.font = 'bold 10px "DM Sans", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('n₀=1', x0 + 4, padTop + 14);
      }
    }

    function animStep() {
      animProgress = Math.min(1, animProgress + 0.008);
      drawBigOCanvas(animProgress);
      if (animProgress < 1 && animRunning) {
        animFrame = requestAnimationFrame(animStep);
        return;
      }

      animRunning = false;
      const button = root.querySelector<HTMLButtonElement>('#animPlayBtn');
      if (button) {
        button.textContent = '▶ Animar';
        button.classList.remove('active');
      }
    }

    function toggleAnim() {
      const button = root.querySelector<HTMLButtonElement>('#animPlayBtn');
      if (animRunning) {
        animRunning = false;
        if (animFrame !== null) {
          cancelAnimationFrame(animFrame);
          animFrame = null;
        }
        if (button) {
          button.textContent = '▶ Animar';
          button.classList.remove('active');
        }
        return;
      }

      animRunning = true;
      if (button) {
        button.textContent = '⏸ Pausar';
        button.classList.add('active');
      }
      animFrame = requestAnimationFrame(animStep);
    }

    function resetAnim() {
      animRunning = false;
      if (animFrame !== null) {
        cancelAnimationFrame(animFrame);
        animFrame = null;
      }
      animProgress = 0;
      drawBigOCanvas(0);
      const button = root.querySelector<HTMLButtonElement>('#animPlayBtn');
      if (button) {
        button.textContent = '▶ Animar';
        button.classList.remove('active');
      }
    }

    const N_STEPS = [10, 100, 1000, 10000, 100000];
    const COMPLEXITIES = [
      { label: 'O(1)', color: '#c8f0d8', bg: '#0a2d1a', fn: (_n: number) => 1 },
      { label: 'O(log n)', color: '#bfd8ff', bg: '#0a1a36', fn: (n: number) => Math.round(Math.log2(n) * 10) / 10 },
      { label: 'O(n)', color: '#d4c4ff', bg: '#1a0a36', fn: (n: number) => n },
      { label: 'O(n log n)', color: '#ffe0b0', bg: '#301a00', fn: (n: number) => Math.round(n * Math.log2(n)) },
      { label: 'O(n²)', color: '#ffcccc', bg: '#2d0a0a', fn: (n: number) => n * n },
      { label: 'O(n³)', color: '#ffaaa8', bg: '#3d0505', fn: (n: number) => n * n * n },
      { label: 'O(2ⁿ)', color: '#ff8a80', bg: '#4a0000', fn: (n: number) => (n <= 60 ? Math.pow(2, n) : Number.POSITIVE_INFINITY) },
    ];

    function fmtNum(value: number) {
      if (!Number.isFinite(value) || value > 1e15) return '> 10¹⁵ 🔥';
      if (value >= 1e12) return `${(value / 1e12).toFixed(1)} trilhões`;
      if (value >= 1e9) return `${(value / 1e9).toFixed(1)} bilhões`;
      if (value >= 1e6) return `${(value / 1e6).toFixed(1)} milhões`;
      if (value >= 1e3) return `${(value / 1e3).toFixed(1)} mil`;
      return String(value);
    }

    function updateCounts(step: number | string) {
      const index = Math.max(0, Math.min(N_STEPS.length - 1, Number.parseInt(String(step), 10) - 1));
      const n = N_STEPS[index] || 100;
      const display = root.querySelector<HTMLElement>('#nDisplay');
      if (display) {
        display.textContent = `n = ${n.toLocaleString('pt-BR')}`;
      }

      const grid = root.querySelector<HTMLElement>('#countsGrid');
      if (!grid) return;

      grid.innerHTML = COMPLEXITIES.map((item) => {
        const value = item.fn(n);
        const infeasible = !Number.isFinite(value) || value > 1e15;
        return [
          `<div class="count-card" style="background:${item.bg};border:1px solid rgba(255,255,255,.1)">`,
          `<div class="count-label" style="color:${item.color}">${item.label}</div>`,
          `<div class="count-val" style="color:${infeasible ? '#ff6b6b' : 'white'}">${fmtNum(value)}</div>`,
          '</div>',
        ].join('');
      }).join('');
    }

    function toggleLine(rawIndex: number | string) {
      const index = Number.parseInt(String(rawIndex), 10);
      if (!Number.isFinite(index) || index < 0) {
        return;
      }

      const explanation = root.querySelector<HTMLElement>(`#cl${index}`);
      const lines = Array.from(root.querySelectorAll<HTMLElement>('.code-line'));
      const activeLine = lines[index];
      if (!explanation) {
        return;
      }

      const wasVisible = explanation.classList.contains('show');
      root.querySelectorAll<HTMLElement>('.cl-explain').forEach((item) => item.classList.remove('show'));
      lines.forEach((line) => line.classList.remove('active'));

      if (!wasVisible) {
        explanation.classList.add('show');
        activeLine?.classList.add('active');
      }
    }

    function toggleDetails(triggerEl: Element | null) {
      if (!(triggerEl instanceof HTMLElement)) {
        return;
      }

      const details = triggerEl.nextElementSibling;
      if (!(details instanceof HTMLElement)) {
        return;
      }

      const arrow = triggerEl.querySelector<HTMLElement>('.dt-arrow');
      const shouldOpen = !details.classList.contains('show');
      details.classList.toggle('show', shouldOpen);
      triggerEl.classList.toggle('open', shouldOpen);

      if (arrow) {
        arrow.textContent = shouldOpen ? '▾' : '▸';
      }
    }

    const FEEDBACKS: Record<
      string,
      {
        correct: string;
        ok: string;
        why: Record<string, string>;
      }
    > = {
      q1: {
        correct: 'B',
        ok: 'Correto. O termo dominante em 3n² + 100n + 500 é n², então a classe é O(n²).',
        why: {
          A: 'O(n) ignora o termo quadrático, que domina para n grande.',
          C: 'O(n³) é um limite frouxo; não é a forma mais justa.',
          D: 'O(n² + n) simplifica para O(n²) pelo termo dominante.',
        },
      },
      q2: {
        correct: 'B',
        ok: 'Correto. Θ(n log n) implica simultaneamente O(n log n) e Ω(n log n).',
        why: {
          A: 'O(n) contradiz o piso n log n indicado por Theta.',
          C: 'Dizer apenas O(n²) perde precisão; Theta exige limite superior e inferior na mesma função.',
          D: 'Theta descreve crescimento assintótico, não igualdade exata da fórmula.',
        },
      },
      q3: {
        correct: 'C',
        ok: 'Correto. Loop O(n) com busca binária O(log n) resulta em O(n log n).',
        why: {
          A: 'Faltou multiplicar pelo custo da busca interna.',
          B: 'Esse é o custo de uma busca binária isolada, não do loop completo.',
          D: 'O(n²) ocorreria se a operação interna fosse linear, não logarítmica.',
        },
      },
      q4: {
        correct: 'C',
        ok: 'Correto. Big-O define a existência de uma constante c tal que custo ≤ c·n² para n suficientemente grande.',
        why: {
          A: 'O(n²) não significa custo exato para todas as entradas.',
          B: 'Essa frase descreve Ω(n²), não O(n²).',
          D: 'Se é O(n²), também pode ser O(n³); apenas fica menos justo.',
        },
      },
      q5: {
        correct: 'B',
        ok: 'Correto. A constante é absorvida pelo parâmetro c da definição formal de Big-O.',
        why: {
          A: 'Não depende de a constante ser pequena; depende da definição matemática.',
          C: 'Pior caso não explica a remoção de constantes.',
          D: 'Há justificativa formal: a existência de c > 0.',
        },
      },
    };

    function answer(qid: string, optionEl: Element | null, chosen: string) {
      const box = root.querySelector<HTMLElement>(`#${qid}`);
      if (!box || box.dataset.answered === '1') {
        return;
      }

      const feedback = FEEDBACKS[qid];
      if (!feedback) {
        return;
      }

      box.dataset.answered = '1';
      const correct = feedback.correct;
      const options = Array.from(box.querySelectorAll<HTMLElement>('.quiz-option'));
      options.forEach((option) => {
        option.style.pointerEvents = 'none';
        const choice = extractQuizChoice(option);
        if (choice === correct) {
          option.classList.add('correct');
        }
      });

      const normalizedChosen = String(chosen || '').trim().toUpperCase();
      const isCorrect = normalizedChosen === correct;
      if (!isCorrect && optionEl instanceof HTMLElement) {
        optionEl.classList.add('wrong');
      }

      const feedbackEl = root.querySelector<HTMLElement>(`#${qid}-fb`);
      if (!feedbackEl) {
        return;
      }

      if (isCorrect) {
        feedbackEl.className = 'quiz-feedback show ok';
        feedbackEl.innerHTML = `<strong>✓ Correto!</strong> ${feedback.ok}`;
        return;
      }

      const wrongReason = feedback.why[normalizedChosen] || 'Alternativa incorreta para esta questão.';
      feedbackEl.className = 'quiz-feedback show fail';
      feedbackEl.innerHTML = [
        '<strong>✗ Incorreto.</strong>',
        `<br><br><strong>Por que ${normalizedChosen} está errada:</strong> ${wrongReason}`,
        `<br><br><strong>Por que ${correct} está certa:</strong> ${feedback.ok}`,
      ].join('');
    }

    win.toggleAnim = toggleAnim;
    win.resetAnim = resetAnim;
    win.updateCounts = updateCounts;
    win.toggleLine = toggleLine;
    win.toggleDetails = toggleDetails;
    win.answer = answer;

    const slider = root.querySelector<HTMLInputElement>('#nSlider');
    const handleSliderInput = () => {
      if (slider) updateCounts(slider.value);
    };
    if (slider) {
      slider.addEventListener('input', handleSliderInput);
    }

    function handleInteractiveClick(event: Event) {
      const target = getEventTargetElement(event);
      if (!target) {
        return;
      }

      const clickable = target.closest<HTMLElement>(
        '[data-inline-onclick], #animPlayBtn, .anim-controls .anim-btn, #codeAnn .code-line, .quiz-box .quiz-option, .dt-trigger'
      );
      if (!clickable || !root.contains(clickable)) {
        return;
      }

      const raw = clickable.getAttribute('data-inline-onclick') || deriveFallbackClickAction(clickable);
      if (!raw) {
        return;
      }

      if (raw.includes('toggleAnim')) {
        toggleAnim();
        return;
      }

      if (raw.includes('resetAnim')) {
        resetAnim();
        return;
      }

      const lineMatch = raw.match(/toggleLine\((\d+)\)/);
      if (lineMatch) {
        toggleLine(lineMatch[1] || '');
        return;
      }

      if (raw.includes('toggleDetails')) {
        toggleDetails(clickable);
        return;
      }

      const answerMatch = raw.match(/answer\('([^']+)'\s*,\s*this\s*,\s*'([^']+)'\)/);
      if (answerMatch) {
        answer(answerMatch[1] || '', clickable, answerMatch[2] || '');
      }
    }

    root.addEventListener('click', handleInteractiveClick);

    function handleResize() {
      drawBigOCanvas(animProgress);
    }

    window.addEventListener('resize', handleResize);
    updateCounts(2);
    const initFrame = requestAnimationFrame(() => drawBigOCanvas(animProgress));

    return () => {
      if (slider) {
        slider.removeEventListener('input', handleSliderInput);
      }
      if (animFrame !== null) {
        cancelAnimationFrame(animFrame);
      }
      cancelAnimationFrame(initFrame);
      window.removeEventListener('resize', handleResize);
      root.removeEventListener('click', handleInteractiveClick);

      if (win.toggleAnim === toggleAnim) delete win.toggleAnim;
      if (win.resetAnim === resetAnim) delete win.resetAnim;
      if (win.updateCounts === updateCounts) delete win.updateCounts;
      if (win.toggleLine === toggleLine) delete win.toggleLine;
      if (win.toggleDetails === toggleDetails) delete win.toggleDetails;
      if (win.answer === answer) delete win.answer;
    };
  }, [moduleData.slug, source?.html]);

  useEffect(() => {
    const legacyScriptSlugs = new Set(['f1-1-analise-notacoes', 'f1-3-analise-recorrencias']);
    if (!legacyScriptSlugs.has(moduleData.slug)) {
      return;
    }

    const root = importBodyRef.current;
    const scriptSource = source?.script;
    if (!root || !scriptSource) {
      return;
    }

    const scriptWithInlineFallback = scriptSource.replace(
      /getAttribute\(\s*['"]onclick['"]\s*\)/g,
      "getAttribute('data-inline-onclick') || getAttribute('onclick')"
    );

    const functionNames = Array.from(scriptWithInlineFallback.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g))
      .map((match) => match[1] || '')
      .filter((name, index, list) => name.length > 0 && list.indexOf(name) === index);

    root.querySelectorAll<HTMLElement>('[onclick]').forEach((node) => {
      const raw = (node.getAttribute('onclick') || '').trim();
      if (raw.length > 0) {
        node.setAttribute('data-inline-onclick', raw);
      }
      node.removeAttribute('onclick');
    });

    root.querySelectorAll<HTMLElement>('[onchange]').forEach((node) => {
      const raw = (node.getAttribute('onchange') || '').trim();
      if (raw.length > 0) {
        node.setAttribute('data-inline-onchange', raw);
      }
      node.removeAttribute('onchange');
    });

    root.querySelectorAll<HTMLElement>('[oninput]').forEach((node) => {
      const raw = (node.getAttribute('oninput') || '').trim();
      if (raw.length > 0) {
        node.setAttribute('data-inline-oninput', raw);
      }
      node.removeAttribute('oninput');
    });

    const capturedWindowListeners: Array<{
      type: string;
      listener: EventListenerOrEventListenerObject;
      options: boolean | AddEventListenerOptions | undefined;
    }> = [];

    const originalWindowAdd = window.addEventListener.bind(window);
    window.addEventListener = ((type, listener, options) => {
      capturedWindowListeners.push({ type, listener, options });
      return originalWindowAdd(type, listener, options);
    }) as typeof window.addEventListener;

    const registeredFunctions: Array<{ name: string; fn: (...args: unknown[]) => unknown }> = [];

    try {
      const returnShape = functionNames
        .map((name) => `${name}: typeof ${name} === 'function' ? ${name} : undefined`)
        .join(', ');

      const runtimeFactory = new Function(
        'window',
        'document',
        [
          scriptWithInlineFallback,
          returnShape.length > 0 ? `return { ${returnShape} };` : 'return {};',
        ].join('\n')
      ) as (win: Window, doc: Document) => Record<string, unknown>;

      const exportedFunctions = runtimeFactory(window, document);
      Object.entries(exportedFunctions).forEach(([name, fn]) => {
        if (typeof fn !== 'function') {
          return;
        }

        (window as Record<string, unknown>)[name] = fn;
        registeredFunctions.push({ name, fn: fn as (...args: unknown[]) => unknown });
      });
    } catch (error) {
      console.error(`Falha ao carregar runtime importado do módulo ${moduleData.slug}`, error);
    } finally {
      window.addEventListener = originalWindowAdd;
    }

    function splitInlineArgs(raw: string) {
      const parts: string[] = [];
      let chunk = '';
      let quote: "'" | '"' | null = null;
      let escaped = false;
      let depth = 0;

      for (let index = 0; index < raw.length; index += 1) {
        const char = raw[index] || '';

        if (quote) {
          chunk += char;
          if (escaped) {
            escaped = false;
          } else if (char === '\\') {
            escaped = true;
          } else if (char === quote) {
            quote = null;
          }
          continue;
        }

        if (char === "'" || char === '"') {
          quote = char;
          chunk += char;
          continue;
        }

        if (char === '(' || char === '[' || char === '{') {
          depth += 1;
          chunk += char;
          continue;
        }

        if (char === ')' || char === ']' || char === '}') {
          depth = Math.max(0, depth - 1);
          chunk += char;
          continue;
        }

        if (char === ',' && depth === 0) {
          parts.push(chunk.trim());
          chunk = '';
          continue;
        }

        chunk += char;
      }

      if (chunk.trim().length > 0) {
        parts.push(chunk.trim());
      }

      return parts;
    }

    function parseInlineInvocation(raw: string) {
      const normalized = raw.trim().replace(/;$/, '');
      const match = normalized.match(/^([A-Za-z_$][\w$]*)\s*\(([\s\S]*)\)$/);
      if (!match) {
        return null;
      }

      return {
        name: match[1] || '',
        args: splitInlineArgs(match[2] || ''),
      };
    }

    function parseInlineToken(token: string, sourceEl: HTMLElement) {
      const trimmed = token.trim();
      if (trimmed === 'this') {
        return sourceEl;
      }
      if (trimmed === 'this.value') {
        return (sourceEl as HTMLInputElement).value;
      }
      if (trimmed === 'true') {
        return true;
      }
      if (trimmed === 'false') {
        return false;
      }
      if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
        return Number.parseFloat(trimmed);
      }

      if (trimmed.length >= 2) {
        const quote = trimmed[0];
        const tail = trimmed[trimmed.length - 1];
        if ((quote === "'" || quote === '"') && tail === quote) {
          return trimmed
            .slice(1, -1)
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\'/g, "'")
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
        }
      }

      return trimmed;
    }

    function invokeInlineAction(raw: string, sourceEl: HTMLElement) {
      const invocation = parseInlineInvocation(raw);
      if (!invocation) {
        return;
      }

      const fnRef = (window as Record<string, unknown>)[invocation.name];
      if (typeof fnRef !== 'function') {
        return;
      }

      const args = invocation.args.map((token) => parseInlineToken(token, sourceEl));
      (fnRef as (...callArgs: unknown[]) => unknown)(...args);
    }

    function handleInlineClick(event: Event) {
      const target = getEventTargetElement(event);
      if (!target) {
        return;
      }

      const sourceEl = target.closest<HTMLElement>('[data-inline-onclick]');
      if (!sourceEl || !root.contains(sourceEl)) {
        return;
      }

      const raw = sourceEl.getAttribute('data-inline-onclick') || '';
      if (raw.length > 0) {
        invokeInlineAction(raw, sourceEl);
      }
    }

    function handleInlineChange(event: Event) {
      const target = getEventTargetElement(event);
      if (!target) {
        return;
      }

      const sourceEl = target.closest<HTMLElement>('[data-inline-onchange]');
      if (!sourceEl || !root.contains(sourceEl)) {
        return;
      }

      const raw = sourceEl.getAttribute('data-inline-onchange') || '';
      if (raw.length > 0) {
        invokeInlineAction(raw, sourceEl);
      }
    }

    function handleInlineInput(event: Event) {
      const target = getEventTargetElement(event);
      if (!target) {
        return;
      }

      const sourceEl = target.closest<HTMLElement>('[data-inline-oninput]');
      if (!sourceEl || !root.contains(sourceEl)) {
        return;
      }

      const raw = sourceEl.getAttribute('data-inline-oninput') || '';
      if (raw.length > 0) {
        invokeInlineAction(raw, sourceEl);
      }
    }

    root.addEventListener('click', handleInlineClick);
    root.addEventListener('change', handleInlineChange);
    root.addEventListener('input', handleInlineInput);

    const globals = window as Record<string, unknown>;
    if (moduleData.slug === 'f1-1-analise-notacoes') {
      const fns = ['drawLinear', 'binaryReset', 'bubbleReset', 'treeReset', 'quickReset'];
      fns.forEach((name) => {
        const fnRef = globals[name];
        if (typeof fnRef === 'function') {
          (fnRef as () => void)();
        }
      });
    }

    if (moduleData.slug === 'f1-3-analise-recorrencias') {
      const setPreset = globals.setPreset;
      const setTreeN = globals.setTreeN;
      if (typeof setPreset === 'function') {
        (setPreset as (preset: string) => void)('lin');
      }
      if (typeof setTreeN === 'function') {
        (setTreeN as (n: number) => void)(8);
      }
    }

    return () => {
      root.removeEventListener('click', handleInlineClick);
      root.removeEventListener('change', handleInlineChange);
      root.removeEventListener('input', handleInlineInput);

      capturedWindowListeners.forEach(({ type, listener, options }) => {
        window.removeEventListener(type, listener, options);
      });

      registeredFunctions.forEach(({ name, fn }) => {
        if ((window as Record<string, unknown>)[name] === fn) {
          delete (window as Record<string, unknown>)[name];
        }
      });
    };
  }, [moduleData.slug, source?.html, source?.script]);

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

  const previousHref = moduleData.previousSlug
    ? buildTrackModuleHref(moduleData.trackCode, moduleData.previousSlug)
    : null;
  const nextHref = moduleData.nextSlug ? buildTrackModuleHref(moduleData.trackCode, moduleData.nextSlug) : null;
  const totalModules = parseTrackTotalModules(moduleData.progressLabel, moduleData.order);
  const hasLegacyInlineRuntime = moduleData.slug === 'f1-1-analise-notacoes' || moduleData.slug === 'f1-3-analise-recorrencias';

  return (
    <article className="module-lesson module-import" aria-label={`Módulo ${moduleData.order}`}>
      {hasLegacyInlineRuntime ? (
        <>
          <div id="sidebar" className="module-inline-stub" aria-hidden="true" />
          <div id="progressLine" className="module-inline-stub" aria-hidden="true" />
          <div id="sbOverlay" className="module-inline-stub" aria-hidden="true" />
        </>
      ) : null}
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

      <nav
        ref={sectionNavRef}
        className={`module-section-nav${hasLegacyInlineRuntime ? ' section-nav' : ''}`}
        aria-label="Navegação das seções"
      >
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

      <div id={hasLegacyInlineRuntime ? 'lessonArea' : undefined} className="module-lesson-content">
        {source?.html ? (
          <ImportedBody html={source.html} bodyRef={importBodyRef} />
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
          <span className="module-lesson-progress-frac">{`${moduleData.order} / ${totalModules} módulos`}</span>
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
            <Link
              href={buildTrackModuleHref(moduleData.trackCode, moduleData.previousSlug)}
              className="sim-action-btn sim-action-btn-tertiary"
            >
              Módulo anterior
            </Link>
          ) : null}
          {moduleData.nextSlug ? (
            <Link
              href={buildTrackModuleHref(moduleData.trackCode, moduleData.nextSlug)}
              className="sim-action-btn sim-action-btn-primary"
            >
              Próximo módulo
            </Link>
          ) : null}
        </div>
        {saveMessage ? <p className="mt-2 text-sm text-slate-700">{saveMessage}</p> : null}
      </section>
    </>
  );
}
