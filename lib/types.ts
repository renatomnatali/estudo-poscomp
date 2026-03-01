export type MacroArea = 'fundamentos' | 'matematica' | 'tecnologia';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type SimulationStatus = 'queued' | 'running' | 'completed' | 'failed' | 'canceled';

export type TopicIncidence = 'high' | 'medium' | 'low';

export type TopicSectionKind = 'essential' | 'advanced' | 'summary';

export type TopicProgressStatus = 'not_started' | 'in_progress' | 'completed';
export type FlashcardMode = 'today' | 'topic' | 'mistakes';
export type FlashcardRating = 'again' | 'hard' | 'good' | 'easy';

export interface Topic {
  id: string;
  slug: string;
  title: string;
  macroArea: MacroArea;
  subTopic: string;
  difficulty: Difficulty;
  incidence: TopicIncidence;
  estimatedMinutes: number;
  prerequisites: string[];
  learningObjectives: string[];
  sourceLessons: Array<{ pdf: string; pageStart: number; pageEnd: number }>;
  sections: TopicSection[];
  examples: WorkedExample[];
  applications: ApplicationCase[];
  references: TopicReference[];
  quickChecks: QuickCheckItem[];
}

export interface TopicSection {
  id: string;
  kind: TopicSectionKind;
  title: string;
  content: string;
  order: number;
}

export interface WorkedExample {
  id: string;
  title: string;
  problem: string;
  strategy: string;
  solution: string;
  takeaway: string;
  order: number;
}

export interface ApplicationCase {
  id: string;
  title: string;
  context: string;
  howItApplies: string;
  order: number;
}

export interface TopicReference {
  id: string;
  label: string;
  url: string;
  order: number;
}

export interface QuickCheckOption {
  key: 'A' | 'B' | 'C' | 'D' | 'E';
  text: string;
}

export interface QuickCheckItem {
  id: string;
  prompt: string;
  options: QuickCheckOption[];
  answerKey: QuickCheckOption['key'];
  explanation: string;
  order: number;
}

export interface TopicProgress {
  userId: string;
  topicSlug: string;
  status: TopicProgressStatus;
  score: number | null;
  updatedAt: string;
}

export type StudyCardStatus = 'done' | 'in_progress' | 'locked' | 'free';

export interface StudyTrackCard {
  id: string;
  code: string;
  title: string;
  macroArea: MacroArea;
  summary: string;
  estimatedModules: number;
  estimatedHours: number;
  status: StudyCardStatus;
  free: boolean;
  progressPercent: number;
  href?: string;
}

export interface DashboardStat {
  id: string;
  label: string;
  value: string;
  helper: string;
  delta: string;
  tone: 'default' | 'sap' | 'em' | 'amb';
  deltaTone: 'up' | 'warn' | 'muted';
}

export interface DashboardSummary {
  greeting: {
    title: string;
    subtitle: string;
    cta: { label: string; href: string };
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
  };
  stats: DashboardStat[];
  tracks: Array<{
    id: string;
    code: string;
    title: string;
    subtitle: string;
    progressPercent?: number;
    tagLabel: string;
    tagTone: 'done' | 'next' | 'locked' | 'progress';
    href: string;
    iconTone: 'sap' | 'em' | 'muted';
  }>;
  activity: {
    title: string;
    subtitle: string;
    days: Array<{
      id: string;
      label: string;
      levels: Array<0 | 1 | 2 | 3 | 4>;
    }>;
    legendStart: string;
    legendEnd: string;
  };
  coverage: {
    title: string;
    rows: Array<{
      id: string;
      label: string;
      percentage: number;
      caption: string;
      tone: 'sap' | 'amb' | 'coral';
    }>;
  };
  flashcards: {
    eyebrow: string;
    title: string;
    subtitle: string;
    cta: { label: string; href: string };
    count: number;
    countLabel: string;
  };
  upcoming: Array<{
    id: string;
    icon: string;
    title: string;
    subtitle: string;
    actionLabel: string;
    href: string;
    tone: 'sap' | 'em' | 'amb';
  }>;
}

export interface ModuleChapter {
  id: string;
  title: string;
  content: string;
}

export interface ModuleQuizOption {
  key: 'A' | 'B' | 'C' | 'D' | 'E';
  text: string;
}

export interface ModuleQuiz {
  id: string;
  prompt: string;
  options: ModuleQuizOption[];
  answerKey: ModuleQuizOption['key'];
  explanation: string;
}

export interface StudyModule {
  slug: string;
  order: number;
  title: string;
  subtitle: string;
  trackCode: string;
  progressLabel: string;
  chapters: ModuleChapter[];
  quiz: ModuleQuiz[];
  previousSlug: string | null;
  nextSlug: string | null;
}

export interface SimuladoConfig {
  mode: 'partial' | 'full' | 'area';
  questionCount: number;
  minutes: number;
  premium: boolean;
}

export interface TopicMaterial {
  version: number;
  generatedAt: string;
  topics: Topic[];
}

export interface FlashcardDeck {
  id: string;
  slug: string;
  title: string;
  macroArea: MacroArea;
  subTopic: string;
  difficulty: Difficulty;
  description: string;
  estimatedMinutes: number;
  cardsCount: number;
}

export interface Flashcard {
  id: string;
  deckId: string;
  deckSlug: string;
  front: string;
  back: string;
  explanation: string;
  subTopic: string;
  sourceTopicSlug?: string;
  sourceQuestionId?: string;
  dueAt?: string;
  lapses: number;
  repetitions: number;
}

export interface FlashcardQueue {
  sessionId: string;
  mode: FlashcardMode;
  total: number;
  items: Flashcard[];
}

export interface FlashcardReviewOutcome {
  flashcardId: string;
  rating: FlashcardRating;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  nextDueAt: string;
}

export interface FlashcardProgressSummary {
  userId: string;
  dueCount: number;
  reviewedToday: number;
  masteredCount: number;
}

export interface FlashcardSeedCard {
  id: string;
  front: string;
  back: string;
  explanation: string;
  tags: string[];
  sourceTopicSlug?: string;
  sourceQuestionId?: string;
  order: number;
}

export interface FlashcardSeedDeck {
  id: string;
  slug: string;
  title: string;
  macroArea: MacroArea;
  subTopic: string;
  difficulty: Difficulty;
  description: string;
  estimatedMinutes: number;
  cards: FlashcardSeedCard[];
}

export interface FlashcardMaterial {
  version: number;
  generatedAt: string;
  decks: FlashcardSeedDeck[];
}

export interface QuestionOption {
  key: 'A' | 'B' | 'C' | 'D' | 'E';
  text: string;
}

export interface Question {
  id: string;
  year: number;
  source: string;
  number: number;
  macroArea: MacroArea;
  subTopic: string;
  difficulty: Difficulty;
  stem: string;
  options: QuestionOption[];
  answerKey: 'A' | 'B' | 'C' | 'D' | 'E' | '*';
  tags: string[];
  explanation?: string;
  optionExplanations?: Record<string, string>;
}

export interface DfaDefinition {
  alphabet: string[];
  states: string[];
  initialState: string;
  acceptStates: string[];
  transitions: Record<string, Record<string, string>>;
}

export interface NfaDefinition {
  alphabet: string[];
  states: string[];
  initialState: string;
  acceptStates: string[];
  transitions: Record<string, Record<string, string[]>>;
}

export interface DfaTraceStep {
  stepIndex: number;
  fromState: string;
  symbol: string;
  toState: string;
}

export interface DfaSimulationResult {
  status: 'completed' | 'failed';
  result: 'ACEITA' | 'REJEITA' | 'INVÁLIDA';
  finalState: string | null;
  trace: DfaTraceStep[];
  accepted?: boolean;
  error?: string;
}

export interface NfaTraceStep {
  stepIndex: number;
  symbol: string;
  fromStates: string[];
  toStates: string[];
}

export interface NfaSimulationResult {
  status: 'completed' | 'failed';
  accepted: boolean;
  currentStates: string[];
  trace: NfaTraceStep[];
  error?: string;
}

export interface MinimizeResult {
  reachableStates: string[];
  removedUnreachable: string[];
  partitions: string[][][];
  minimized: DfaDefinition;
  stateMap: Record<string, string>;
  mergedStates: string[][];
}
