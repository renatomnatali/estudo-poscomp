import fs from 'node:fs';
import path from 'node:path';

import { type Difficulty, type MacroArea, Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import type { Question } from '@/lib/types';

const FALLBACK_DATASET_PATH = path.resolve(
  process.cwd(),
  'data',
  'questions',
  'automata',
  'poscomp-automata-v1.json'
);

export function loadQuestionsDataset(): { version: number; generatedAt: string; questions: Question[] } {
  const raw = fs.readFileSync(FALLBACK_DATASET_PATH, 'utf8');
  return JSON.parse(raw);
}

interface QuestionFilters {
  year?: string;
  macroArea?: string;
  subTopic?: string;
  difficulty?: string;
  limit?: string;
}

function parseLimit(limitValue?: string): number {
  const limit = Number(limitValue ?? 0);
  if (Number.isFinite(limit) && limit > 0) return Math.floor(limit);
  return 0;
}

function applyInMemoryFilters(questions: Question[], filters: QuestionFilters): Question[] {
  const filtered = questions.filter((question) => {
    if (filters.year && Number(question.year) !== Number(filters.year)) return false;
    if (filters.macroArea && question.macroArea !== filters.macroArea) return false;
    if (filters.subTopic && question.subTopic !== filters.subTopic) return false;
    if (filters.difficulty && question.difficulty !== filters.difficulty) return false;
    return true;
  });

  const limit = parseLimit(filters.limit);
  if (limit > 0) {
    return filtered.slice(0, limit);
  }

  return filtered;
}

function normalizeAnswerKey(value: string): Question['answerKey'] {
  if (value === 'A' || value === 'B' || value === 'C' || value === 'D' || value === 'E' || value === '*') {
    return value;
  }
  return '*';
}

function normalizeOptionExplanations(value: unknown): Question['optionExplanations'] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([key]) => ['A', 'B', 'C', 'D', 'E'].includes(key))
    .map(([key, item]) => [key, String(item)]);

  if (entries.length === 0) return undefined;
  return Object.fromEntries(entries);
}

function parseMacroArea(value?: string): MacroArea | undefined {
  if (value === 'fundamentos' || value === 'matematica' || value === 'tecnologia') {
    return value;
  }
  return undefined;
}

function parseDifficulty(value?: string): Difficulty | undefined {
  if (value === 'easy' || value === 'medium' || value === 'hard') {
    return value;
  }
  return undefined;
}

async function listQuestionsFromDatabase(filters: QuestionFilters): Promise<Question[]> {
  if (!process.env.DATABASE_URL) return [];

  try {
    const where: Prisma.QuestionWhereInput = {};

    if (filters.year) where.year = Number(filters.year);
    if (filters.macroArea) where.macroArea = parseMacroArea(filters.macroArea);
    if (filters.subTopic) where.subTopic = filters.subTopic;
    if (filters.difficulty) where.difficulty = parseDifficulty(filters.difficulty);

    const take = parseLimit(filters.limit);

    const rows = await db.question.findMany({
      where,
      include: {
        options: {
          orderBy: { key: 'asc' },
        },
      },
      orderBy: [{ year: 'desc' }, { number: 'asc' }],
      ...(take > 0 ? { take } : {}),
    });

    if (rows.length === 0) return [];

    return rows.map((row) => ({
      id: row.id,
      year: row.year,
      source: row.source,
      number: row.number,
      macroArea: row.macroArea as Question['macroArea'],
      subTopic: row.subTopic,
      difficulty: row.difficulty as Question['difficulty'],
      stem: row.stem,
      options: row.options.map((option) => ({
        key: option.key as Question['options'][number]['key'],
        text: option.text,
      })),
      answerKey: normalizeAnswerKey(row.answerKey),
      tags: row.tags,
      explanation: row.explanation ?? undefined,
      optionExplanations: normalizeOptionExplanations(row.optionExplanations),
    }));
  } catch {
    return [];
  }
}

export async function listQuestions(filters: QuestionFilters = {}): Promise<Question[]> {
  const fromDatabase = await listQuestionsFromDatabase(filters);
  if (fromDatabase.length > 0) return fromDatabase;

  const dataset = loadQuestionsDataset();
  const questions = Array.isArray(dataset.questions) ? dataset.questions : [];
  return applyInMemoryFilters(questions, filters);
}

export async function getQuestionMap(): Promise<Map<string, Question>> {
  const map = new Map<string, Question>();
  const questions = await listQuestions();
  questions.forEach((question) => {
    map.set(question.id, question);
  });
  return map;
}
