export type MacroArea = 'fundamentos' | 'matematica' | 'tecnologia';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type SimulationStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'canceled';

export interface Topic {
  id: string;
  slug: string;
  title: string;
  macroArea: MacroArea;
  subTopic: string;
  prerequisites: string[];
  difficulty: Difficulty;
}

export interface LessonUnit {
  topicId: string;
  sourcePdf: string;
  pageStart: number;
  pageEnd: number;
  learningObjectives: string[];
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
  stem: string;
  options: QuestionOption[];
  answerKey: 'A' | 'B' | 'C' | 'D' | 'E';
  tags: string[];
  explanation?: string;
}

export interface AutomatonDefinition {
  alphabet: string[];
  states: string[];
  initialState: string;
  acceptStates: string[];
  transitions: Record<string, Record<string, string | string[]>>;
}

export interface SimulationTraceStep {
  stepIndex: number;
  fromState: string;
  symbol: string;
  toState: string;
}

export interface SimulationSession {
  id: string;
  inputWord: string;
  currentState: string;
  stepIndex: number;
  status: SimulationStatus;
  trace: SimulationTraceStep[];
  result: 'ACEITA' | 'REJEITA' | 'PENDENTE' | 'INVÁLIDA' | 'CANCELADA';
}

export interface StudyPlan {
  userId: string;
  targets: string[];
  weeklyLoad: number;
  priorityTopics: string[];
  reviewQueue: string[];
}
