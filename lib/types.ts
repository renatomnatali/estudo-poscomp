export type MacroArea = 'fundamentos' | 'matematica' | 'tecnologia';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type SimulationStatus = 'queued' | 'running' | 'completed' | 'failed' | 'canceled';

export interface Topic {
  id: string;
  slug: string;
  title: string;
  macroArea: MacroArea;
  subTopic: string;
  difficulty: Difficulty;
  incidence: 'high' | 'medium' | 'low';
  learningObjectives: string[];
  sourceLessons: Array<{ pdf: string; pageStart: number; pageEnd: number }>;
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
