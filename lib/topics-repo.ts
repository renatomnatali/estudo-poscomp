import { type Difficulty, type MacroArea, Prisma, type TopicIncidence, type TopicProgressStatus } from '@prisma/client';

import { db } from '@/lib/db';
import { loadTopicMaterialPackage } from '@/lib/topic-content';
import type { QuickCheckOption, Topic, TopicProgress } from '@/lib/types';

interface TopicFilters {
  macroArea?: string;
  subTopic?: string;
  difficulty?: string;
  incidence?: string;
  limit?: string;
}

interface SaveTopicProgressInput {
  userId: string;
  topicSlug: string;
  status: TopicProgressStatus;
  score: number | null;
}

const memoryProgress = new Map<string, TopicProgress>();
const QUICK_CHECK_KEYS: QuickCheckOption['key'][] = ['A', 'B', 'C', 'D', 'E'];

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

function parseIncidence(value?: string): TopicIncidence | undefined {
  if (value === 'high' || value === 'medium' || value === 'low') return value;
  return undefined;
}

function normalizeTopic(input: Topic): Topic {
  return {
    ...input,
    prerequisites: Array.isArray(input.prerequisites) ? input.prerequisites : [],
    learningObjectives: Array.isArray(input.learningObjectives) ? input.learningObjectives : [],
    sourceLessons: Array.isArray(input.sourceLessons) ? input.sourceLessons : [],
    sections: Array.isArray(input.sections) ? input.sections : [],
    examples: Array.isArray(input.examples) ? input.examples : [],
    applications: Array.isArray(input.applications) ? input.applications : [],
    references: Array.isArray(input.references) ? input.references : [],
    quickChecks: Array.isArray(input.quickChecks) ? input.quickChecks : [],
  };
}

function applyInMemoryFilters(topics: Topic[], filters: TopicFilters): Topic[] {
  const filtered = topics.filter((topic) => {
    if (filters.macroArea && topic.macroArea !== filters.macroArea) return false;
    if (filters.subTopic && topic.subTopic !== filters.subTopic) return false;
    if (filters.difficulty && topic.difficulty !== filters.difficulty) return false;
    if (filters.incidence && topic.incidence !== filters.incidence) return false;
    return true;
  });

  const limit = parseLimit(filters.limit);
  if (limit > 0) return filtered.slice(0, limit);
  return filtered;
}

function mapSourceLessons(value: unknown): Topic['sourceLessons'] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const source = item as { pdf?: string; pageStart?: number; pageEnd?: number };
      if (!source.pdf) return null;
      return {
        pdf: source.pdf,
        pageStart: Number(source.pageStart ?? 1),
        pageEnd: Number(source.pageEnd ?? 1),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

function mapProgressRecord(userId: string, topicSlug: string, status: TopicProgressStatus, score: number | null, updatedAt: Date): TopicProgress {
  return {
    userId,
    topicSlug,
    status: status as TopicProgress['status'],
    score,
    updatedAt: updatedAt.toISOString(),
  };
}

function isQuickCheckKey(value: unknown): value is QuickCheckOption['key'] {
  return typeof value === 'string' && QUICK_CHECK_KEYS.includes(value as QuickCheckOption['key']);
}

function mapQuickCheckOptions(value: Prisma.JsonValue): QuickCheckOption[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const candidate = entry as { key?: unknown; text?: unknown };
      if (!isQuickCheckKey(candidate.key) || typeof candidate.text !== 'string') return null;
      return {
        key: candidate.key,
        text: candidate.text,
      };
    })
    .filter((item): item is QuickCheckOption => item !== null);
}

function mapQuickCheckAnswerKey(value: string, options: QuickCheckOption[]): QuickCheckOption['key'] {
  if (isQuickCheckKey(value)) return value;
  if (options.length > 0) return options[0].key;
  return 'A';
}

export async function listTopics(filters: TopicFilters = {}): Promise<Topic[]> {
  if (process.env.DATABASE_URL) {
    try {
      const where: Prisma.TopicWhereInput = {};
      if (filters.macroArea) where.macroArea = parseMacroArea(filters.macroArea);
      if (filters.subTopic) where.subTopic = filters.subTopic;
      if (filters.difficulty) where.difficulty = parseDifficulty(filters.difficulty);
      if (filters.incidence) where.incidence = parseIncidence(filters.incidence);

      const take = parseLimit(filters.limit);
      const rows = await db.topic.findMany({
        where,
        orderBy: [{ incidence: 'asc' }, { title: 'asc' }],
        ...(take > 0 ? { take } : {}),
      });

      if (rows.length > 0) {
        return rows.map((row) =>
          normalizeTopic({
            id: row.id,
            slug: row.slug,
            title: row.title,
            macroArea: row.macroArea as Topic['macroArea'],
            subTopic: row.subTopic,
            difficulty: row.difficulty as Topic['difficulty'],
            incidence: row.incidence as Topic['incidence'],
            estimatedMinutes: row.estimatedMinutes,
            prerequisites: row.prerequisites,
            learningObjectives: row.learningObjectives,
            sourceLessons: mapSourceLessons(row.sourceLessons),
            sections: [],
            examples: [],
            applications: [],
            references: [],
            quickChecks: [],
          })
        );
      }
    } catch {
      // fallback em memória
    }
  }

  const packageData = loadTopicMaterialPackage();
  return applyInMemoryFilters(packageData.topics, filters);
}

export async function getTopicBySlug(slug: string): Promise<Topic | null> {
  if (process.env.DATABASE_URL) {
    try {
      const row = await db.topic.findUnique({
        where: { slug },
        include: {
          sections: { orderBy: { order: 'asc' } },
          examples: { orderBy: { order: 'asc' } },
          applications: { orderBy: { order: 'asc' } },
          references: { orderBy: { order: 'asc' } },
          quickChecks: { orderBy: { order: 'asc' } },
        },
      });

      if (row) {
        return normalizeTopic({
          id: row.id,
          slug: row.slug,
          title: row.title,
          macroArea: row.macroArea as Topic['macroArea'],
          subTopic: row.subTopic,
          difficulty: row.difficulty as Topic['difficulty'],
          incidence: row.incidence as Topic['incidence'],
          estimatedMinutes: row.estimatedMinutes,
          prerequisites: row.prerequisites,
          learningObjectives: row.learningObjectives,
          sourceLessons: mapSourceLessons(row.sourceLessons),
          sections: row.sections.map((item) => ({
            id: item.id,
            kind: item.kind as Topic['sections'][number]['kind'],
            title: item.title,
            content: item.content,
            order: item.order,
          })),
          examples: row.examples.map((item) => ({
            id: item.id,
            title: item.title,
            problem: item.problem,
            strategy: item.strategy,
            solution: item.solution,
            takeaway: item.takeaway,
            order: item.order,
          })),
          applications: row.applications.map((item) => ({
            id: item.id,
            title: item.title,
            context: item.context,
            howItApplies: item.howItApplies,
            order: item.order,
          })),
          references: row.references.map((item) => ({
            id: item.id,
            label: item.label,
            url: item.url,
            order: item.order,
          })),
          quickChecks: row.quickChecks.map((item) => {
            const options = mapQuickCheckOptions(item.options as Prisma.JsonValue);
            return {
              id: item.id,
              prompt: item.prompt,
              options,
              answerKey: mapQuickCheckAnswerKey(item.answerKey, options),
              explanation: item.explanation,
              order: item.order,
            };
          }),
        });
      }
    } catch {
      // fallback em memória
    }
  }

  const packageData = loadTopicMaterialPackage();
  return packageData.topics.find((topic) => topic.slug === slug) ?? null;
}

export async function listTopicQuickChecks(slug: string) {
  const topic = await getTopicBySlug(slug);
  if (!topic) return null;
  return topic.quickChecks;
}

export async function saveTopicProgress(input: SaveTopicProgressInput): Promise<TopicProgress | null> {
  const topic = await getTopicBySlug(input.topicSlug);
  if (!topic) return null;

  if (process.env.DATABASE_URL) {
    try {
      const row = await db.userTopicProgress.upsert({
        where: {
          userId_topicId: {
            userId: input.userId,
            topicId: topic.id,
          },
        },
        update: {
          status: input.status,
          score: input.score,
        },
        create: {
          userId: input.userId,
          topicId: topic.id,
          status: input.status,
          score: input.score,
        },
      });

      return mapProgressRecord(row.userId, topic.slug, row.status, row.score, row.updatedAt);
    } catch {
      // fallback em memória
    }
  }

  const memoryValue = mapProgressRecord(
    input.userId,
    topic.slug,
    input.status,
    input.score,
    new Date()
  );
  memoryProgress.set(`${input.userId}:${topic.slug}`, memoryValue);
  return memoryValue;
}

export async function getTopicProgress(userId: string, topicSlug: string): Promise<TopicProgress | null> {
  const topic = await getTopicBySlug(topicSlug);
  if (!topic) return null;

  if (process.env.DATABASE_URL) {
    try {
      const row = await db.userTopicProgress.findUnique({
        where: {
          userId_topicId: {
            userId,
            topicId: topic.id,
          },
        },
      });

      if (row) {
        return mapProgressRecord(row.userId, topic.slug, row.status, row.score, row.updatedAt);
      }
    } catch {
      // fallback em memória
    }
  }

  return memoryProgress.get(`${userId}:${topicSlug}`) ?? null;
}
