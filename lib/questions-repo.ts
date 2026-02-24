import fs from 'node:fs';
import path from 'node:path';

import type { Question } from '@/lib/types';

const DATASET_PATH = path.resolve(
  process.cwd(),
  'data',
  'questions',
  'automata',
  'poscomp-automata-v1.json'
);

export function loadQuestionsDataset(): { version: number; generatedAt: string; questions: Question[] } {
  const raw = fs.readFileSync(DATASET_PATH, 'utf8');
  return JSON.parse(raw);
}

interface QuestionFilters {
  year?: string;
  macroArea?: string;
  subTopic?: string;
  difficulty?: string;
  limit?: string;
}

export function listQuestions(filters: QuestionFilters = {}): Question[] {
  const dataset = loadQuestionsDataset();
  const questions = Array.isArray(dataset.questions) ? dataset.questions : [];

  const filtered = questions.filter((question) => {
    if (filters.year && Number(question.year) !== Number(filters.year)) return false;
    if (filters.macroArea && question.macroArea !== filters.macroArea) return false;
    if (filters.subTopic && question.subTopic !== filters.subTopic) return false;
    if (filters.difficulty && question.difficulty !== filters.difficulty) return false;
    return true;
  });

  const limit = Number(filters.limit ?? 0);
  if (Number.isFinite(limit) && limit > 0) {
    return filtered.slice(0, limit);
  }

  return filtered;
}

export function getQuestionMap(): Map<string, Question> {
  const dataset = loadQuestionsDataset();
  const map = new Map<string, Question>();
  (dataset.questions || []).forEach((question) => {
    map.set(question.id, question);
  });
  return map;
}
