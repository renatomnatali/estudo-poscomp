import {
  type Difficulty,
  type MacroArea,
  Prisma,
} from '@prisma/client';

import { db } from '@/lib/db';
import { loadFlashcardMaterialPackage } from '@/lib/flashcard-content';
import type {
  Flashcard,
  FlashcardDeck,
  FlashcardMode,
  FlashcardProgressSummary,
  FlashcardQueue,
  FlashcardRating,
  FlashcardReviewOutcome,
} from '@/lib/types';

interface FlashcardDeckFilters {
  macroArea?: string;
  subTopic?: string;
  difficulty?: string;
  limit?: string;
}

interface FlashcardQueueInput {
  mode: FlashcardMode;
  userId?: string;
  topicSlug?: string;
  limit?: string;
}

interface FlashcardReviewInput {
  userId: string;
  flashcardId: string;
  rating: FlashcardRating;
  sessionId?: string;
}

interface ProgressState {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  dueAt: Date;
  lastReviewedAt: Date | null;
  lastRating: FlashcardRating | null;
}

interface FlashcardCandidate extends Flashcard {
  order: number;
  dueAtDate: Date;
}

const memoryProgress = new Map<string, ProgressState>();
const memoryReviewEvents: Array<{ userId: string; reviewedAt: Date }> = [];

const RATING_VALUES: FlashcardRating[] = ['again', 'hard', 'good', 'easy'];

function parseLimit(limitValue?: string): number {
  const limit = Number(limitValue ?? 0);
  if (Number.isFinite(limit) && limit > 0) return Math.floor(limit);
  return 0;
}

function parseMacroArea(value?: string): MacroArea | undefined {
  if (value === 'fundamentos' || value === 'matematica' || value === 'tecnologia') return value;
  return undefined;
}

function parseDifficulty(value?: string): Difficulty | undefined {
  if (value === 'easy' || value === 'medium' || value === 'hard') return value;
  return undefined;
}

function isFlashcardRating(value: unknown): value is FlashcardRating {
  return typeof value === 'string' && RATING_VALUES.includes(value as FlashcardRating);
}

function startOfToday() {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function defaultProgress(now: Date): ProgressState {
  return {
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
    lapses: 0,
    dueAt: now,
    lastReviewedAt: null,
    lastRating: null,
  };
}

function scheduleNext(previous: ProgressState | null, rating: FlashcardRating, now: Date): ProgressState {
  const current = previous ?? defaultProgress(now);
  let easeFactor = current.easeFactor;
  let repetitions = current.repetitions;
  let intervalDays = current.intervalDays;
  let lapses = current.lapses;

  if (rating === 'again') {
    repetitions = 0;
    intervalDays = 1;
    lapses += 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else if (rating === 'hard') {
    repetitions += 1;
    intervalDays = repetitions <= 1 ? 2 : Math.max(2, Math.round(Math.max(1, intervalDays) * 1.2));
    easeFactor = Math.max(1.3, easeFactor - 0.15);
  } else if (rating === 'good') {
    repetitions += 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 3;
    else intervalDays = Math.max(3, Math.round(Math.max(1, intervalDays) * easeFactor));
  } else {
    repetitions += 1;
    if (repetitions === 1) intervalDays = 3;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.max(6, Math.round(Math.max(1, intervalDays) * easeFactor * 1.3));
    easeFactor = Math.min(3.0, easeFactor + 0.15);
  }

  return {
    easeFactor,
    repetitions,
    intervalDays,
    lapses,
    dueAt: addDays(now, intervalDays),
    lastReviewedAt: now,
    lastRating: rating,
  };
}

function mapDeckFromRow(row: {
  id: string;
  slug: string;
  title: string;
  macroArea: MacroArea;
  subTopic: string;
  difficulty: Difficulty;
  description: string;
  estimatedMinutes: number;
  _count?: { cards: number };
}): FlashcardDeck {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    macroArea: row.macroArea,
    subTopic: row.subTopic,
    difficulty: row.difficulty,
    description: row.description,
    estimatedMinutes: row.estimatedMinutes,
    cardsCount: row._count?.cards ?? 0,
  };
}

function mapProgressFromRow(row: {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  dueAt: Date;
  lastReviewedAt: Date | null;
  lastRating: FlashcardRating | null;
}): ProgressState {
  return {
    easeFactor: row.easeFactor,
    intervalDays: row.intervalDays,
    repetitions: row.repetitions,
    lapses: row.lapses,
    dueAt: row.dueAt,
    lastReviewedAt: row.lastReviewedAt,
    lastRating: row.lastRating,
  };
}

async function loadCandidatesFromDatabase(userId?: string): Promise<FlashcardCandidate[]> {
  const rows = await db.flashcard.findMany({
    include: { deck: true },
    orderBy: [{ deck: { title: 'asc' } }, { order: 'asc' }],
  });
  if (rows.length === 0) return [];

  const progressMap = new Map<string, ProgressState>();
  if (userId) {
    const progressRows = await db.userFlashcardProgress.findMany({
      where: { userId, flashcardId: { in: rows.map((row) => row.id) } },
    });
    progressRows.forEach((row) => {
      progressMap.set(row.flashcardId, mapProgressFromRow(row));
    });
  }

  const now = new Date();
  return rows.map((row) => {
    const progress = progressMap.get(row.id) ?? defaultProgress(now);
    return {
      id: row.id,
      deckId: row.deckId,
      deckSlug: row.deck.slug,
      front: row.front,
      back: row.back,
      explanation: row.explanation,
      subTopic: row.deck.subTopic,
      sourceTopicSlug: row.sourceTopicSlug ?? undefined,
      sourceQuestionId: row.sourceQuestionId ?? undefined,
      dueAt: progress.dueAt.toISOString(),
      dueAtDate: progress.dueAt,
      lapses: progress.lapses,
      repetitions: progress.repetitions,
      order: row.order,
    };
  });
}

function loadCandidatesFromMemory(userId?: string): FlashcardCandidate[] {
  const payload = loadFlashcardMaterialPackage();
  const now = new Date();
  const candidates: FlashcardCandidate[] = [];

  payload.decks.forEach((deck) => {
    deck.cards.forEach((card) => {
      const key = userId ? `${userId}:${card.id}` : '';
      const progress = key ? memoryProgress.get(key) : null;
      const base = progress ?? defaultProgress(now);
      candidates.push({
        id: card.id,
        deckId: deck.id,
        deckSlug: deck.slug,
        front: card.front,
        back: card.back,
        explanation: card.explanation,
        subTopic: deck.subTopic,
        sourceTopicSlug: card.sourceTopicSlug,
        sourceQuestionId: card.sourceQuestionId,
        dueAt: base.dueAt.toISOString(),
        dueAtDate: base.dueAt,
        lapses: base.lapses,
        repetitions: base.repetitions,
        order: card.order,
      });
    });
  });

  return candidates;
}

async function loadFlashcardCandidates(userId?: string): Promise<FlashcardCandidate[]> {
  if (process.env.DATABASE_URL) {
    try {
      const rows = await loadCandidatesFromDatabase(userId);
      if (rows.length > 0) return rows;
    } catch {
      // fallback em memória
    }
  }

  return loadCandidatesFromMemory(userId);
}

function applyQueueFilters(candidates: FlashcardCandidate[], input: FlashcardQueueInput): FlashcardCandidate[] {
  const now = new Date();
  let filtered = candidates.slice();

  if (input.mode === 'topic' && input.topicSlug) {
    filtered = filtered.filter(
      (item) => item.sourceTopicSlug === input.topicSlug || item.subTopic === input.topicSlug
    );
  }

  if (input.mode === 'mistakes') {
    filtered = filtered.filter((item) => item.lapses > 0);
  }

  if (input.mode === 'today') {
    const dueOnly = filtered.filter((item) => item.dueAtDate <= now);
    filtered = dueOnly.length > 0 ? dueOnly : filtered;
  }

  filtered.sort((a, b) => {
    const byDue = a.dueAtDate.getTime() - b.dueAtDate.getTime();
    if (byDue !== 0) return byDue;
    const byLapses = b.lapses - a.lapses;
    if (byLapses !== 0) return byLapses;
    return a.order - b.order;
  });

  const limit = parseLimit(input.limit);
  if (limit > 0) return filtered.slice(0, limit);
  return filtered;
}

export async function listFlashcardDecks(filters: FlashcardDeckFilters = {}): Promise<FlashcardDeck[]> {
  if (process.env.DATABASE_URL) {
    try {
      const where: Prisma.FlashcardDeckWhereInput = {};
      if (filters.macroArea) where.macroArea = parseMacroArea(filters.macroArea);
      if (filters.subTopic) where.subTopic = filters.subTopic;
      if (filters.difficulty) where.difficulty = parseDifficulty(filters.difficulty);
      const limit = parseLimit(filters.limit);

      const rows = await db.flashcardDeck.findMany({
        where,
        include: { _count: { select: { cards: true } } },
        orderBy: [{ title: 'asc' }],
        ...(limit > 0 ? { take: limit } : {}),
      });

      if (rows.length > 0) return rows.map(mapDeckFromRow);
    } catch {
      // fallback em memória
    }
  }

  const payload = loadFlashcardMaterialPackage();
  let items = payload.decks.map((deck) => ({
    id: deck.id,
    slug: deck.slug,
    title: deck.title,
    macroArea: deck.macroArea,
    subTopic: deck.subTopic,
    difficulty: deck.difficulty,
    description: deck.description,
    estimatedMinutes: deck.estimatedMinutes,
    cardsCount: deck.cards.length,
  }));

  if (filters.macroArea) items = items.filter((item) => item.macroArea === filters.macroArea);
  if (filters.subTopic) items = items.filter((item) => item.subTopic === filters.subTopic);
  if (filters.difficulty) items = items.filter((item) => item.difficulty === filters.difficulty);
  const limit = parseLimit(filters.limit);
  if (limit > 0) items = items.slice(0, limit);
  return items;
}

export async function getFlashcardQueue(input: FlashcardQueueInput): Promise<FlashcardQueue> {
  const mode = input.mode;
  const items = applyQueueFilters(await loadFlashcardCandidates(input.userId), input).map((item) => ({
    id: item.id,
    deckId: item.deckId,
    deckSlug: item.deckSlug,
    front: item.front,
    back: item.back,
    explanation: item.explanation,
    subTopic: item.subTopic,
    sourceTopicSlug: item.sourceTopicSlug,
    sourceQuestionId: item.sourceQuestionId,
    dueAt: item.dueAt,
    lapses: item.lapses,
    repetitions: item.repetitions,
  }));

  return {
    sessionId: `fc-${Date.now()}`,
    mode,
    total: items.length,
    items,
  };
}

async function getFlashcardById(flashcardId: string) {
  if (process.env.DATABASE_URL) {
    try {
      const row = await db.flashcard.findUnique({
        where: { id: flashcardId },
      });
      if (row) return { id: row.id };
    } catch {
      // fallback em memória
    }
  }

  const payload = loadFlashcardMaterialPackage();
  for (const deck of payload.decks) {
    const card = deck.cards.find((item) => item.id === flashcardId);
    if (card) return { id: card.id };
  }
  return null;
}

export async function reviewFlashcard(input: FlashcardReviewInput): Promise<FlashcardReviewOutcome | null> {
  if (!isFlashcardRating(input.rating)) return null;
  const card = await getFlashcardById(input.flashcardId);
  if (!card) return null;

  const now = new Date();

  if (process.env.DATABASE_URL) {
    try {
      const previous = await db.userFlashcardProgress.findUnique({
        where: {
          userId_flashcardId: {
            userId: input.userId,
            flashcardId: input.flashcardId,
          },
        },
      });

      const nextState = scheduleNext(previous ? mapProgressFromRow(previous) : null, input.rating, now);

      await db.userFlashcardProgress.upsert({
        where: {
          userId_flashcardId: {
            userId: input.userId,
            flashcardId: input.flashcardId,
          },
        },
        update: {
          easeFactor: nextState.easeFactor,
          intervalDays: nextState.intervalDays,
          repetitions: nextState.repetitions,
          lapses: nextState.lapses,
          dueAt: nextState.dueAt,
          lastReviewedAt: nextState.lastReviewedAt,
          lastRating: nextState.lastRating,
        },
        create: {
          userId: input.userId,
          flashcardId: input.flashcardId,
          easeFactor: nextState.easeFactor,
          intervalDays: nextState.intervalDays,
          repetitions: nextState.repetitions,
          lapses: nextState.lapses,
          dueAt: nextState.dueAt,
          lastReviewedAt: nextState.lastReviewedAt,
          lastRating: nextState.lastRating,
        },
      });

      await db.flashcardReviewEvent.create({
        data: {
          userId: input.userId,
          flashcardId: input.flashcardId,
          rating: input.rating,
          sessionId: input.sessionId || null,
        },
      });

      return {
        flashcardId: input.flashcardId,
        rating: input.rating,
        easeFactor: nextState.easeFactor,
        intervalDays: nextState.intervalDays,
        repetitions: nextState.repetitions,
        lapses: nextState.lapses,
        nextDueAt: nextState.dueAt.toISOString(),
      };
    } catch {
      // fallback em memória
    }
  }

  const memoryKey = `${input.userId}:${input.flashcardId}`;
  const previous = memoryProgress.get(memoryKey) ?? null;
  const nextState = scheduleNext(previous, input.rating, now);
  memoryProgress.set(memoryKey, nextState);
  memoryReviewEvents.push({ userId: input.userId, reviewedAt: now });

  return {
    flashcardId: input.flashcardId,
    rating: input.rating,
    easeFactor: nextState.easeFactor,
    intervalDays: nextState.intervalDays,
    repetitions: nextState.repetitions,
    lapses: nextState.lapses,
    nextDueAt: nextState.dueAt.toISOString(),
  };
}

export async function getFlashcardProgressSummary(userId: string): Promise<FlashcardProgressSummary> {
  const now = new Date();
  const dayStart = startOfToday();

  if (process.env.DATABASE_URL) {
    try {
      const [dueCount, masteredCount, reviewedToday] = await Promise.all([
        db.userFlashcardProgress.count({
          where: { userId, dueAt: { lte: now } },
        }),
        db.userFlashcardProgress.count({
          where: { userId, repetitions: { gte: 3 } },
        }),
        db.flashcardReviewEvent.count({
          where: { userId, reviewedAt: { gte: dayStart } },
        }),
      ]);

      return {
        userId,
        dueCount,
        masteredCount,
        reviewedToday,
      };
    } catch {
      // fallback em memória
    }
  }

  let dueCount = 0;
  let masteredCount = 0;

  memoryProgress.forEach((value, key) => {
    if (!key.startsWith(`${userId}:`)) return;
    if (value.dueAt <= now) dueCount += 1;
    if (value.repetitions >= 3) masteredCount += 1;
  });

  const reviewedToday = memoryReviewEvents.filter(
    (event) => event.userId === userId && event.reviewedAt >= dayStart
  ).length;

  return {
    userId,
    dueCount,
    masteredCount,
    reviewedToday,
  };
}
