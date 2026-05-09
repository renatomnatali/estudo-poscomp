import { db } from '@/lib/db';
import type {
  SimuladoAttempt,
  SimuladoAttemptInput,
  SimuladoAttemptsSummary,
  SimuladoMode,
} from '@/lib/types';

interface ListSimuladoAttemptsInput {
  userId: string;
  limit?: string | number;
}

const VALID_MODES: SimuladoMode[] = ['partial', 'full', 'area'];
const memoryAttempts: SimuladoAttempt[] = [];

function isSimuladoMode(value: string): value is SimuladoMode {
  return VALID_MODES.includes(value as SimuladoMode);
}

function parseLimit(limitValue?: string | number): number {
  const parsed = Number(limitValue ?? 0);
  if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
  return 5;
}

function normalizeRecommendedTopics(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => String(entry || '').trim())
    .filter((entry) => entry.length > 0);
}

function mapAttemptRow(row: {
  id: string;
  userId: string;
  mode: string;
  total: number;
  correct: number;
  accuracy: number;
  durationSeconds: number | null;
  recommendedNextTopics: unknown;
  createdAt: Date;
}): SimuladoAttempt {
  return {
    id: row.id,
    userId: row.userId,
    mode: isSimuladoMode(row.mode) ? row.mode : 'partial',
    total: row.total,
    correct: row.correct,
    accuracy: row.accuracy,
    durationSeconds: row.durationSeconds,
    recommendedNextTopics: normalizeRecommendedTopics(row.recommendedNextTopics),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function createSimuladoAttempt(input: SimuladoAttemptInput): Promise<SimuladoAttempt> {
  const payload = {
    userId: input.userId,
    mode: input.mode,
    total: input.total,
    correct: input.correct,
    accuracy: input.accuracy,
    durationSeconds: input.durationSeconds ?? null,
    recommendedNextTopics: input.recommendedNextTopics,
  };

  if (process.env.DATABASE_URL) {
    try {
      const row = await db.userSimuladoAttempt.create({ data: payload });
      return mapAttemptRow(row);
    } catch {
      // fallback em memória
    }
  }

  const attempt: SimuladoAttempt = {
    id: `simulado-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: payload.userId,
    mode: payload.mode,
    total: payload.total,
    correct: payload.correct,
    accuracy: payload.accuracy,
    durationSeconds: payload.durationSeconds,
    recommendedNextTopics: payload.recommendedNextTopics,
    createdAt: new Date().toISOString(),
  };

  memoryAttempts.unshift(attempt);
  return attempt;
}

export async function listSimuladoAttempts(
  input: ListSimuladoAttemptsInput
): Promise<SimuladoAttemptsSummary> {
  const limit = parseLimit(input.limit);

  if (process.env.DATABASE_URL) {
    try {
      const rows = await db.userSimuladoAttempt.findMany({
        where: { userId: input.userId },
        orderBy: [{ createdAt: 'desc' }],
        take: limit,
      });

      return {
        userId: input.userId,
        items: rows.map(mapAttemptRow),
      };
    } catch {
      // fallback em memória
    }
  }

  const items = memoryAttempts
    .filter((attempt) => attempt.userId === input.userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);

  return {
    userId: input.userId,
    items,
  };
}

export async function countSimuladoAttempts(userId: string): Promise<number> {
  if (process.env.DATABASE_URL) {
    try {
      return await db.userSimuladoAttempt.count({ where: { userId } });
    } catch {
      // fallback em memória
    }
  }

  return memoryAttempts.filter((attempt) => attempt.userId === userId).length;
}
