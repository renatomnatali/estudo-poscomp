import type {
  DashboardSummary,
  StudyModule,
  StudyTrackCard,
  ModuleQuiz,
} from '@/lib/types';
import { IS_PREMIUM_USER } from '@/lib/auth-config';

const TRACK_CARDS: StudyTrackCard[] = [
  {
    id: 'track-f1',
    code: 'F1',
    title: 'Análise de Algoritmos',
    macroArea: 'fundamentos',
    summary: 'Big-O, Theta, Omega · recorrências · cotas inferiores · algoritmos ótimos',
    estimatedModules: 3,
    estimatedHours: 2,
    status: 'locked',
    free: false,
    progressPercent: 0,
  },
  {
    id: 'track-f2',
    code: 'F2',
    title: 'Algoritmos e Est. de Dados',
    macroArea: 'fundamentos',
    summary: 'Árvores, grafos, hash · ordenação · busca · estruturas avançadas',
    estimatedModules: 4,
    estimatedHours: 3,
    status: 'locked',
    free: false,
    progressPercent: 0,
  },
  {
    id: 'track-f3',
    code: 'F3',
    title: 'Arquitetura de Computadores',
    macroArea: 'fundamentos',
    summary: 'Pipeline, cache, hierarquia de memória · RISC vs CISC · paralelismo',
    estimatedModules: 3,
    estimatedHours: 2.5,
    status: 'locked',
    free: false,
    progressPercent: 0,
  },
  {
    id: 'track-f4',
    code: 'F4',
    title: 'Circuitos Digitais',
    macroArea: 'fundamentos',
    summary: 'Álgebra booleana, Karnaugh, flip-flops · combinacional vs sequencial',
    estimatedModules: 3,
    estimatedHours: 2,
    status: 'locked',
    free: false,
    progressPercent: 0,
  },
  {
    id: 'track-f5',
    code: 'F5',
    title: 'Sistemas Operacionais',
    macroArea: 'fundamentos',
    summary: 'Processos, threads, escalonamento · memória virtual · sistemas de arquivos',
    estimatedModules: 4,
    estimatedHours: 3,
    status: 'locked',
    free: false,
    progressPercent: 0,
  },
  {
    id: 'track-f6',
    code: 'F6',
    title: 'Linguagens Formais e Autômatos',
    macroArea: 'fundamentos',
    summary: 'AFD, AFN, Gramáticas, PDA, MT · Hierarquia de Chomsky · P vs NP · Gödel',
    estimatedModules: 9,
    estimatedHours: 6,
    status: 'done',
    free: true,
    progressPercent: 100,
    href: '/trilhas/f6/modulo-01',
  },
  {
    id: 'track-f7',
    code: 'F7',
    title: 'Compiladores',
    macroArea: 'fundamentos',
    summary: 'Análise léxica, sintática, semântica · geração de código · otimização',
    estimatedModules: 3,
    estimatedHours: 2.5,
    status: 'locked',
    free: false,
    progressPercent: 0,
  },
  {
    id: 'track-f8',
    code: 'F8',
    title: 'Concorrência e Paralelismo',
    macroArea: 'fundamentos',
    summary: 'Semáforos, monitores, deadlock · modelos de memória · MPI, OpenMP',
    estimatedModules: 3,
    estimatedHours: 2,
    status: 'locked',
    free: false,
    progressPercent: 0,
  },
  {
    id: 'track-f9',
    code: 'F9',
    title: 'Segurança Computacional',
    macroArea: 'fundamentos',
    summary: 'Criptografia, protocolos, autenticação · vulnerabilidades · PKI',
    estimatedModules: 3,
    estimatedHours: 2,
    status: 'locked',
    free: false,
    progressPercent: 0,
  },
  {
    id: 'track-f10',
    code: 'F10',
    title: 'Teoria dos Grafos',
    macroArea: 'fundamentos',
    summary: 'Grafos, árvores geradoras, fluxo máximo · coloração · planaridade',
    estimatedModules: 3,
    estimatedHours: 2,
    status: 'locked',
    free: false,
    progressPercent: 0,
  },
  {
    id: 'track-m1',
    code: 'M1',
    title: 'Análise Combinatória',
    macroArea: 'matematica',
    summary: 'Permutações, combinações, arranjos · princípio da inclusão-exclusão · pigeonhole',
    estimatedModules: 2,
    estimatedHours: 1.5,
    status: 'locked',
    free: false,
    progressPercent: 0,
  },
  {
    id: 'track-m2',
    code: 'M2',
    title: 'Álgebra Linear',
    macroArea: 'matematica',
    summary: 'Vetores, matrizes, determinantes · autovalores · transformações lineares',
    estimatedModules: 3,
    estimatedHours: 2.5,
    status: 'locked',
    free: false,
    progressPercent: 0,
  },
  {
    id: 'track-m3',
    code: 'M3',
    title: 'Cálculo Diferencial e Integral',
    macroArea: 'matematica',
    summary: 'Limites, derivadas, integrais · séries de Taylor · equações diferenciais',
    estimatedModules: 3,
    estimatedHours: 2,
    status: 'locked',
    free: false,
    progressPercent: 0,
  },
  {
    id: 'track-m4',
    code: 'M4',
    title: 'Lógica Matemática',
    macroArea: 'matematica',
    summary: 'Proposições, predicados, dedução natural · lógica de primeira ordem · resolução',
    estimatedModules: 3,
    estimatedHours: 2,
    status: 'locked',
    free: false,
    progressPercent: 0,
  },
  {
    id: 'track-m5',
    code: 'M5',
    title: 'Matemática Discreta',
    macroArea: 'matematica',
    summary: 'Indução, relações, funções · teoria dos números · posets · reticulados',
    estimatedModules: 3,
    estimatedHours: 2,
    status: 'locked',
    free: false,
    progressPercent: 0,
  },
  {
    id: 'track-m6',
    code: 'M6',
    title: 'Probabilidade e Estatística',
    macroArea: 'matematica',
    summary: 'Probabilidade, distribuições, inferência · testes de hipótese · regressão',
    estimatedModules: 3,
    estimatedHours: 2,
    status: 'locked',
    free: false,
    progressPercent: 0,
  },
  {
    id: 'track-m7',
    code: 'M7',
    title: 'Geometria Analítica',
    macroArea: 'matematica',
    summary: 'Vetores no espaço, cônicas, quádricas · transformações geométricas · produto vetorial',
    estimatedModules: 2,
    estimatedHours: 1.5,
    status: 'locked',
    free: false,
    progressPercent: 0,
  },
  {
    id: 'track-t1',
    code: 'T1',
    title: 'Banco de Dados',
    macroArea: 'tecnologia',
    summary: 'Modelo relacional, SQL, normalização · transações, ACID · NoSQL',
    estimatedModules: 3,
    estimatedHours: 2.5,
    status: 'locked',
    free: false,
    progressPercent: 0,
  },
  {
    id: 'track-t2',
    code: 'T2',
    title: 'Computação Gráfica',
    macroArea: 'tecnologia',
    summary: 'Pipeline gráfico, transformações 3D, rasterização · ray tracing · shaders',
    estimatedModules: 3,
    estimatedHours: 2,
    status: 'locked',
    free: false,
    progressPercent: 0,
  },
  {
    id: 'track-t3',
    code: 'T3',
    title: 'Engenharia de Software',
    macroArea: 'tecnologia',
    summary: 'Processos ágeis, UML, padrões de projeto · testes · arquitetura de software',
    estimatedModules: 3,
    estimatedHours: 2,
    status: 'locked',
    free: false,
    progressPercent: 0,
  },
  {
    id: 'track-t4',
    code: 'T4',
    title: 'Inteligência Artificial',
    macroArea: 'tecnologia',
    summary: 'Busca, lógica, planejamento · aprendizado de máquina · redes neurais',
    estimatedModules: 4,
    estimatedHours: 3,
    status: 'locked',
    free: false,
    progressPercent: 0,
  },
  {
    id: 'track-t5',
    code: 'T5',
    title: 'Linguagens de Programação',
    macroArea: 'tecnologia',
    summary: 'Paradigmas, tipos, escopo · semântica operacional · cálculo lambda',
    estimatedModules: 3,
    estimatedHours: 2,
    status: 'locked',
    free: false,
    progressPercent: 0,
  },
  {
    id: 'track-t6',
    code: 'T6',
    title: 'Redes de Computadores',
    macroArea: 'tecnologia',
    summary: 'Modelo OSI/TCP-IP, protocolos, roteamento · DNS, HTTP, TLS · redes sem fio',
    estimatedModules: 4,
    estimatedHours: 3,
    status: 'locked',
    free: false,
    progressPercent: 0,
  },
  {
    id: 'track-t7',
    code: 'T7',
    title: 'Sistemas Distribuídos',
    macroArea: 'tecnologia',
    summary: 'Consistência, disponibilidade, partição · Paxos, Raft · clock lógico',
    estimatedModules: 3,
    estimatedHours: 2,
    status: 'locked',
    free: false,
    progressPercent: 0,
  },
  {
    id: 'track-t8',
    code: 'T8',
    title: 'Programação',
    macroArea: 'tecnologia',
    summary: 'Técnicas de programação · programação dinâmica · algoritmos gulosos · backtracking',
    estimatedModules: 3,
    estimatedHours: 2,
    status: 'locked',
    free: false,
    progressPercent: 0,
  },
];

const MODULE_TOPIC_MAP: Record<string, string> = {
  'modulo-01': 'linguagens-formais-e-operacoes',
  'modulo-02': 'automatos-finitos-afd',
  'modulo-03': 'afn-com-epsilon',
  'modulo-04': 'conversao-afn-para-afd',
  'modulo-05': 'minimizacao-de-afd',
  'modulo-06': 'expressoes-regulares',
  'modulo-07': 'gramaticas-e-derivacao',
  'modulo-08': 'glc-e-automatos-com-pilha',
  'modulo-09': 'maquinas-de-turing-e-decidibilidade',
};

const MODULES: StudyModule[] = [
  {
    slug: 'modulo-01',
    order: 1,
    title: 'Entendendo a Funcao de Transicao',
    subtitle: 'Do zero absoluto ate dominar o papel de delta em AFD.',
    trackCode: 'F6',
    progressLabel: 'Modulo 1 de 9',
    chapters: [
      {
        id: 'fundamentos',
        title: 'Fundamentos matematicos necessarios',
        content:
          'Conjuntos, produto cartesiano e funcao sao a base para interpretar delta: E x Sigma -> E.',
      },
      {
        id: 'componentes',
        title: 'Componentes do AFD',
        content:
          'Um AFD e definido pela 5-tupla (Q, Sigma, delta, q0, F), com transicao deterministica para cada simbolo.',
      },
      {
        id: 'executando',
        title: 'Execucao passo a passo',
        content:
          'A leitura da palavra aplica delta de forma sequencial ate decidir entre aceitar ou rejeitar.',
      },
    ],
    quiz: [
      {
        id: 'm1-q1',
        prompt: 'Em um AFD, delta(q, a) retorna quantos estados de destino?',
        options: [
          { key: 'A', text: 'Zero ou mais estados.' },
          { key: 'B', text: 'Exatamente um estado.' },
          { key: 'C', text: 'Apenas estados finais.' },
          { key: 'D', text: 'Dois estados no minimo.' },
          { key: 'E', text: 'Depende do tamanho da palavra.' },
        ],
        answerKey: 'B',
        explanation: 'No AFD, cada par (estado, simbolo) tem exatamente um destino.',
      },
    ],
    previousSlug: null,
    nextSlug: 'modulo-02',
  },
  {
    slug: 'modulo-02',
    order: 2,
    title: 'Automato Finito Deterministico',
    subtitle: 'Modelagem completa, tabela de transicao e estado morto.',
    trackCode: 'F6',
    progressLabel: 'Modulo 2 de 9',
    chapters: [
      {
        id: 'definicao',
        title: 'Definicao formal',
        content:
          'Determinismo garante previsibilidade de execucao e permite simulacao eficiente de palavras.',
      },
      {
        id: 'tabela',
        title: 'Tabela de transicao',
        content:
          'A tabela delta consolida o comportamento da maquina para cada estado e simbolo.',
      },
      {
        id: 'estado-morto',
        title: 'Estado morto',
        content:
          'O estado sumidouro torna a funcao delta total e explicita rejeicoes.',
      },
    ],
    quiz: [
      {
        id: 'm2-q1',
        prompt: 'Qual objetivo principal do estado morto em um AFD?',
        options: [
          { key: 'A', text: 'Reduzir o numero de simbolos.' },
          { key: 'B', text: 'Eliminar estados finais.' },
          { key: 'C', text: 'Manter delta total para entradas invalidas.' },
          { key: 'D', text: 'Converter AFD em AFN.' },
          { key: 'E', text: 'Aumentar a taxa de aceitacao.' },
        ],
        answerKey: 'C',
        explanation: 'Com estado morto, toda combinacao de entrada possui transicao definida.',
      },
    ],
    previousSlug: 'modulo-01',
    nextSlug: 'modulo-03',
  },
  {
    slug: 'modulo-03',
    order: 3,
    title: 'AFN e epsilon-Transicoes',
    subtitle: 'Nao determinismo, fecho epsilon e construcao por subconjuntos.',
    trackCode: 'F6',
    progressLabel: 'Modulo 3 de 9',
    chapters: [
      {
        id: 'intuicao',
        title: 'Intuicao do nao determinismo',
        content:
          'No AFN, uma entrada pode seguir multiplos caminhos de processamento em paralelo.',
      },
      {
        id: 'epsilon',
        title: 'Fecho epsilon',
        content:
          'Fecho epsilon identifica todos os estados alcancaveis sem consumir simbolos.',
      },
      {
        id: 'subconjuntos',
        title: 'AFN para AFD',
        content:
          'A construcao de subconjuntos transforma conjuntos de estados do AFN em estados do AFD.',
      },
    ],
    quiz: [
      {
        id: 'm3-q1',
        prompt: 'Todo AFN pode ser convertido para um AFD equivalente?',
        options: [
          { key: 'A', text: 'Nao, sao modelos incomparaveis.' },
          { key: 'B', text: 'Sim, pela construcao de subconjuntos.' },
          { key: 'C', text: 'So se nao houver epsilon.' },
          { key: 'D', text: 'Apenas para alfabetos binarios.' },
          { key: 'E', text: 'Somente em maquinas minimizadas.' },
        ],
        answerKey: 'B',
        explanation: 'AFN e AFD reconhecem as mesmas linguagens regulares.',
      },
    ],
    previousSlug: 'modulo-02',
    nextSlug: 'modulo-04',
  },
  {
    slug: 'modulo-04',
    order: 4,
    title: 'Operacoes e Fechamento',
    subtitle: 'Uniao, intersecao, complemento e concatenacao de linguagens regulares.',
    trackCode: 'F6',
    progressLabel: 'Modulo 4 de 9',
    chapters: [
      {
        id: 'panorama',
        title: 'Panorama das operacoes',
        content: 'As linguagens regulares sao fechadas para operacoes classicas.',
      },
      {
        id: 'produto',
        title: 'Produto cartesiano',
        content: 'Intersecao e uniao podem ser obtidas por produto de automatos.',
      },
      {
        id: 'de-morgan',
        title: 'Leis de De Morgan',
        content: 'Complemento combinado com uniao/intersecao simplifica provas de fechamento.',
      },
    ],
    quiz: [
      {
        id: 'm4-q1',
        prompt: 'Linguagens regulares sao fechadas por complemento?',
        options: [
          { key: 'A', text: 'Nao.' },
          { key: 'B', text: 'Sim, em AFD completo invertendo finais.' },
          { key: 'C', text: 'So em AFN.' },
          { key: 'D', text: 'Apenas para linguagens finitas.' },
          { key: 'E', text: 'Depende da cardinalidade de Sigma.' },
        ],
        answerKey: 'B',
        explanation: 'A inversao de finais em AFD completo produz o complemento.',
      },
    ],
    previousSlug: 'modulo-03',
    nextSlug: 'modulo-05',
  },
  {
    slug: 'modulo-05',
    order: 5,
    title: 'Minimizacao de AFD',
    subtitle: 'Estados equivalentes e algoritmo de particionamento.',
    trackCode: 'F6',
    progressLabel: 'Modulo 5 de 9',
    chapters: [
      {
        id: 'motivacao',
        title: 'Por que minimizar',
        content: 'AFD minimo simplifica comparacao de linguagens e implementacao.',
      },
      {
        id: 'equivalencia',
        title: 'Equivalencia de estados',
        content: 'Estados indistinguiveis para todas as palavras podem ser fundidos.',
      },
      {
        id: 'algoritmo',
        title: 'Particoes iterativas',
        content: 'Refinamento de particoes ate convergencia gera o automato minimo.',
      },
    ],
    quiz: [
      {
        id: 'm5-q1',
        prompt: 'Qual etapa vem antes da fusao de estados?',
        options: [
          { key: 'A', text: 'Adicionar epsilon-transicoes.' },
          { key: 'B', text: 'Eliminar estado inicial.' },
          { key: 'C', text: 'Remover inalcançaveis e refinar particoes.' },
          { key: 'D', text: 'Trocar o alfabeto.' },
          { key: 'E', text: 'Converter para regex.' },
        ],
        answerKey: 'C',
        explanation: 'Minimizacao exige remover inalcançaveis e estabilizar particoes.',
      },
    ],
    previousSlug: 'modulo-04',
    nextSlug: 'modulo-06',
  },
  {
    slug: 'modulo-06',
    order: 6,
    title: 'Expressoes Regulares',
    subtitle: 'Sintaxe, semantica e equivalencia com automatos.',
    trackCode: 'F6',
    progressLabel: 'Modulo 6 de 9',
    chapters: [
      {
        id: 'sintaxe',
        title: 'Sintaxe e precedencia',
        content: 'Operadores de uniao, concatenacao e estrela definem ERs.',
      },
      {
        id: 'thompson',
        title: 'Thompson',
        content: 'Construcao mecanica de ER para AFN com epsilon-transicoes.',
      },
      {
        id: 'equivalencia',
        title: 'Triangulo de equivalencias',
        content: 'ER, AFN e AFD sao modelos equivalentes para linguagens regulares.',
      },
    ],
    quiz: [
      {
        id: 'm6-q1',
        prompt: 'Qual operacao tem maior precedencia em ER?',
        options: [
          { key: 'A', text: 'Uniao' },
          { key: 'B', text: 'Concatenacao' },
          { key: 'C', text: 'Estrela de Kleene' },
          { key: 'D', text: 'Parenteses' },
          { key: 'E', text: 'Todas iguais' },
        ],
        answerKey: 'C',
        explanation: 'Estrela e aplicada antes de concatenacao e uniao.',
      },
    ],
    previousSlug: 'modulo-05',
    nextSlug: 'modulo-07',
  },
  {
    slug: 'modulo-07',
    order: 7,
    title: 'GLC e Automatos de Pilha',
    subtitle: 'Derivacao, arvores sintaticas e PDA para LLC.',
    trackCode: 'F6',
    progressLabel: 'Modulo 7 de 9',
    chapters: [
      {
        id: 'glc',
        title: 'Gramaticas livres de contexto',
        content: 'Producoes modelam linguagens que exigem memoria de pilha.',
      },
      {
        id: 'derivacao',
        title: 'Derivacao e ambiguidade',
        content: 'Derivacoes diferentes podem gerar a mesma string em gramatica ambigua.',
      },
      {
        id: 'pda',
        title: 'PDA',
        content: 'PDA reconhece LLC usando pilha para casar dependencias.',
      },
    ],
    quiz: [
      {
        id: 'm7-q1',
        prompt: 'Qual estrutura extra diferencia PDA de AFD?',
        options: [
          { key: 'A', text: 'Fila' },
          { key: 'B', text: 'Pilha' },
          { key: 'C', text: 'Heap' },
          { key: 'D', text: 'Cache' },
          { key: 'E', text: 'Semaforo' },
        ],
        answerKey: 'B',
        explanation: 'PDA adiciona pilha para reconhecer linguagens livres de contexto.',
      },
    ],
    previousSlug: 'modulo-06',
    nextSlug: 'modulo-08',
  },
  {
    slug: 'modulo-08',
    order: 8,
    title: 'Bombeamento, Chomsky e Computabilidade',
    subtitle: 'Lemas de bombeamento, hierarquia e limite da computacao.',
    trackCode: 'F6',
    progressLabel: 'Modulo 8 de 9',
    chapters: [
      {
        id: 'pump',
        title: 'Lema do bombeamento',
        content: 'Ferramenta para provar nao regularidade por contradicao.',
      },
      {
        id: 'chomsky',
        title: 'Hierarquia de Chomsky',
        content: 'Classifica linguagens por poder de expressao.',
      },
      {
        id: 'halting',
        title: 'Computabilidade e parada',
        content: 'Problema da parada mostra limites da decidibilidade.',
      },
    ],
    quiz: [
      {
        id: 'm8-q1',
        prompt: 'O problema da parada e decidivel?',
        options: [
          { key: 'A', text: 'Sim, para qualquer programa.' },
          { key: 'B', text: 'Nao, e indecidivel.' },
          { key: 'C', text: 'Somente para AFD.' },
          { key: 'D', text: 'Depende da linguagem fonte.' },
          { key: 'E', text: 'Somente para entrada vazia.' },
        ],
        answerKey: 'B',
        explanation: 'Nao existe algoritmo geral que decida parada para todo programa/entrada.',
      },
    ],
    previousSlug: 'modulo-07',
    nextSlug: 'modulo-09',
  },
  {
    slug: 'modulo-09',
    order: 9,
    title: 'P, NP, NP-Completo e Godel',
    subtitle: 'Complexidade, reducoes polinomiais e limites formais.',
    trackCode: 'F6',
    progressLabel: 'Modulo 9 de 9',
    chapters: [
      {
        id: 'classes',
        title: 'Classes P e NP',
        content: 'P modela resolucao eficiente; NP modela verificacao eficiente.',
      },
      {
        id: 'npc',
        title: 'NP-completo e reducoes',
        content: 'Reducao polinomial conecta problemas e prova dificuldade.',
      },
      {
        id: 'godel',
        title: 'Incompletude de Godel',
        content: 'Sistemas formais suficientemente expressivos possuem verdades nao demonstraveis.',
      },
    ],
    quiz: [
      {
        id: 'm9-q1',
        prompt: 'Um problema NP-completo esta em qual conjunto?',
        options: [
          { key: 'A', text: 'Somente em P' },
          { key: 'B', text: 'Em NP e NP-dificil' },
          { key: 'C', text: 'Somente fora de NP' },
          { key: 'D', text: 'Apenas em co-NP' },
          { key: 'E', text: 'Nao pertence a classes de complexidade' },
        ],
        answerKey: 'B',
        explanation: 'NP-completo e a intersecao entre NP e NP-dificil.',
      },
    ],
    previousSlug: 'modulo-08',
    nextSlug: null,
  },
];

export function getStudyTrackCards(): StudyTrackCard[] {
  if (!IS_PREMIUM_USER) {
    return TRACK_CARDS;
  }
  return TRACK_CARDS.map((card) => {
    if (card.status === 'done' || card.status === 'in_progress') {
      return card;
    }
    return { ...card, free: true, status: 'in_progress' as const };
  });
}

function buildDashboardSummary(): DashboardSummary {
  return {
    greeting: {
      title: 'Bom dia, Renato',
      subtitle: 'Linguagens Formais concluído · Próximo: Análise de Algoritmos',
      cta: { label: '▶ Continuar estudando', href: '/trilhas/f6/modulo-01' },
    },
    hero: {
      eyebrow: 'Linguagens Formais concluído · 9 módulos ✓',
      title: 'Pronto para o próximo tópico?',
      subtitle: 'F1 — Análise de Algoritmos · Big-O, recorrências, cotas inferiores',
      primaryCta: { label: 'Começar F1 →', href: '/trilhas' },
      secondaryCta: { label: 'Ver currículo', href: '/trilhas' },
    },
    stats: [
      {
        id: 'modules',
        label: 'Módulos concluídos',
        value: '9',
        helper: 'de ~200 no currículo',
        delta: '↑ +9 este mês',
        tone: 'default',
        deltaTone: 'up',
      },
      {
        id: 'coverage',
        label: 'Currículo coberto',
        value: '4%',
        helper: '1 de 25 tópicos',
        delta: '24 tópicos restantes',
        tone: 'sap',
        deltaTone: 'warn',
      },
      {
        id: 'mock',
        label: 'Simulados realizados',
        value: '0',
        helper: 'Nenhum ainda',
        delta: 'Disponível após F1',
        tone: 'em',
        deltaTone: 'muted',
      },
      {
        id: 'streak',
        label: 'Sequência de estudo',
        value: '3',
        helper: 'dias seguidos',
        delta: '↑ Recorde pessoal',
        tone: 'amb',
        deltaTone: 'up',
      },
    ],
    tracks: [
      {
        id: 'f6',
        code: 'F6',
        title: 'Ling. Formais e Autômatos',
        subtitle: '9 módulos · ~6h de estudo',
        progressPercent: 100,
        tagLabel: '✓ Completo',
        tagTone: 'done',
        href: '/trilhas/f6/modulo-01',
        iconTone: 'em',
      },
      {
        id: 'f1',
        code: 'F1',
        title: 'Análise de Algoritmos',
        subtitle: 'Big-O, recorrências · 2–3 módulos',
        progressPercent: 0,
        tagLabel: '→ Próximo',
        tagTone: 'next',
        href: '/trilhas',
        iconTone: 'sap',
      },
      {
        id: 'f2',
        code: 'F2',
        title: 'Algoritmos e Est. de Dados',
        subtitle: 'Árvores, hash, ordenação',
        tagLabel: '🔒 Premium',
        tagTone: 'locked',
        href: '/premium',
        iconTone: 'muted',
      },
      {
        id: 'f3',
        code: 'F3',
        title: 'Arquitetura de Computadores',
        subtitle: 'Pipeline, cache, memória',
        tagLabel: '🔒 Premium',
        tagTone: 'locked',
        href: '/premium',
        iconTone: 'muted',
      },
    ],
    activity: {
      title: 'Atividade — últimas 4 semanas',
      subtitle: 'módulos estudados/dia',
      days: [
        { id: 'd1', label: 'S', levels: [0, 0, 0, 0, 1, 2, 0] },
        { id: 'd2', label: 'T', levels: [0, 1, 0, 2, 3, 2, 0] },
        { id: 'd3', label: 'Q', levels: [1, 0, 2, 3, 4, 3, 1] },
        { id: 'd4', label: 'Q', levels: [0, 2, 1, 3, 4, 2, 0] },
        { id: 'd5', label: 'S', levels: [2, 3, 4, 2, 3, 4, 2] },
        { id: 'd6', label: 'S', levels: [1, 2, 3, 0, 2, 3, 4] },
        { id: 'd7', label: 'D', levels: [0, 1, 0, 2, 0, 1, 3] },
      ],
      legendStart: 'Menos',
      legendEnd: 'Mais',
    },
    coverage: {
      title: 'Cobertura por área',
      rows: [
        {
          id: 'fundamentos',
          label: 'Fundamentos (F1–F10)',
          percentage: 10,
          caption: '1 de 10 tópicos',
          tone: 'sap',
        },
        {
          id: 'matematica',
          label: 'Matemática (M1–M7)',
          percentage: 0,
          caption: '0 de 7 tópicos',
          tone: 'amb',
        },
        {
          id: 'tecnologia',
          label: 'Tecnologia (T1–T8)',
          percentage: 0,
          caption: '0 de 8 tópicos',
          tone: 'coral',
        },
      ],
    },
    flashcards: {
      eyebrow: 'Flashcards',
      title: 'Linguagens Formais prontos para revisão',
      subtitle: 'Spaced repetition ativado · ~15 min/dia',
      cta: { label: 'Revisar agora →', href: '/flashcards' },
      count: 47,
      countLabel: 'cartões',
    },
    upcoming: [
      {
        id: 'start-f1',
        icon: '📚',
        title: 'Começar F1 — Análise',
        subtitle: 'Módulo 1 de 3 · ~35 min',
        actionLabel: 'Iniciar →',
        href: '/trilhas',
        tone: 'sap',
      },
      {
        id: 'review-f6',
        icon: '🃏',
        title: 'Revisar flashcards F6',
        subtitle: '47 cartões · ~15 min',
        actionLabel: 'Revisar →',
        href: '/flashcards',
        tone: 'em',
      },
      {
        id: 'mock-f6',
        icon: '⏱️',
        title: 'Simulado parcial F6',
        subtitle: '20 questões · ~45 min',
        actionLabel: 'Fazer →',
        href: '/simulado',
        tone: 'amb',
      },
    ],
  };
}

export function getDashboardSummary(): DashboardSummary {
  const summary = buildDashboardSummary();
  if (!IS_PREMIUM_USER) {
    return summary;
  }
  return {
    ...summary,
    tracks: summary.tracks.map((track) => {
      if (track.tagTone !== 'locked') return track;
      return {
        ...track,
        tagLabel: 'Em construção',
        tagTone: 'next',
        href: '/trilhas',
        iconTone: 'sap',
      };
    }),
  };
}

export function getStudyModule(slug: string): StudyModule | null {
  return MODULES.find((studyModule) => studyModule.slug === slug) ?? null;
}

export function getStudyModules() {
  return MODULES;
}

export function gradeModuleQuiz(
  slug: string,
  questionId: string,
  choice: string
): { correct: boolean; answerKey: ModuleQuiz['answerKey']; explanation: string } | null {
  const studyModule = getStudyModule(slug);
  if (!studyModule) return null;

  const question = studyModule.quiz.find((item) => item.id === questionId);
  if (!question) return null;

  return {
    correct: choice === question.answerKey,
    answerKey: question.answerKey,
    explanation: question.explanation,
  };
}

export function mapModuleSlugToTopicSlug(moduleSlug: string): string | null {
  return MODULE_TOPIC_MAP[moduleSlug] ?? null;
}
