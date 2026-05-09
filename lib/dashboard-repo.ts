import {
  buildDashboardHeader,
  classifyDashboardState,
} from '@/lib/dashboard-state';
import { getFlashcardProgressSummary, listFlashcardReviewActivity } from '@/lib/flashcards-repo';
import { countSimuladoAttempts, listSimuladoAttempts } from '@/lib/simulado-attempts-repo';
import {
  getNextTrackAfter,
  getOnboardingTrack,
  getStudyModules,
  mapModuleSlugToTopicSlug,
} from '@/lib/study-data';
import { listTopicProgressByUser } from '@/lib/topics-repo';
import type { DashboardSummary } from '@/lib/types';

const TOTAL_CURRICULUM_TOPICS = 25;
const TRACK_TOTAL_BY_AREA = {
  fundamentos: 10,
  matematica: 7,
  tecnologia: 8,
} as const;

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function safeDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toActivityLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

function weekdaySlot(day: number) {
  if (day === 0) return 6; // domingo
  return day - 1; // segunda=0 ... sábado=5
}

function computeStreak(activityByDate: Map<string, number>) {
  const current = new Date();
  current.setHours(0, 0, 0, 0);

  let streak = 0;
  for (let offset = 0; offset < 366; offset += 1) {
    const candidate = new Date(current);
    candidate.setDate(current.getDate() - offset);
    const key = toDateKey(candidate);
    const count = activityByDate.get(key) ?? 0;
    if (count <= 0) break;
    streak += 1;
  }
  return streak;
}

const ACTIVITY_WEEKS = 8;

function buildActivityHeatmap(activityByDate: Map<string, number>): DashboardSummary['activity'] {
  const labels = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
  const totalDays = ACTIVITY_WEEKS * 7;
  const columns: Array<Array<0 | 1 | 2 | 3 | 4>> = Array.from({ length: 7 }, () =>
    Array(ACTIVITY_WEEKS).fill(0),
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = totalDays - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const weekIndex = Math.floor((totalDays - 1 - offset) / 7);
    const slot = weekdaySlot(date.getDay());
    const count = activityByDate.get(toDateKey(date)) ?? 0;
    columns[slot][weekIndex] = toActivityLevel(count);
  }

  return {
    title: `Atividade — últimas ${ACTIVITY_WEEKS} semanas`,
    subtitle: 'cada célula = 1 dia · cor = nº de módulos concluídos',
    days: labels.map((label, index) => ({
      id: `d${index + 1}`,
      label,
      levels: columns[index],
    })),
    legendStart: '0 módulos',
    legendEnd: '4+ módulos',
  };
}

function addActivityEvent(activityByDate: Map<string, number>, date: Date | null, weight = 1) {
  if (!date) return;
  const key = toDateKey(date);
  activityByDate.set(key, (activityByDate.get(key) ?? 0) + weight);
}

export async function getDashboardSummaryForUser(
  userId: string,
  opts: { isPremium?: boolean; greetingTitle?: string } = {},
): Promise<DashboardSummary> {
  const [topicProgressList, flashSummary, flashActivity, simuladoCount, simuladoHistory] = await Promise.all([
    listTopicProgressByUser(userId),
    getFlashcardProgressSummary(userId),
    listFlashcardReviewActivity(userId, 28),
    countSimuladoAttempts(userId),
    listSimuladoAttempts({ userId, limit: 200 }),
  ]);

  const onboarding = getOnboardingTrack();
  const next = getNextTrackAfter(onboarding.code);

  const modules = getStudyModules()
    .filter((moduleData) => moduleData.trackCode === onboarding.code)
    .sort((a, b) => a.order - b.order);

  const progressByTopic = new Map(
    topicProgressList.map((progressItem) => [progressItem.topicSlug, progressItem])
  );

  const completedModuleSlugs = new Set<string>();
  modules.forEach((moduleData) => {
    const topicSlug = mapModuleSlugToTopicSlug(moduleData.slug);
    if (!topicSlug) return;
    const progress = progressByTopic.get(topicSlug);
    if (progress?.status === 'completed') {
      completedModuleSlugs.add(moduleData.slug);
    }
  });

  const completedModules = completedModuleSlugs.size;
  const totalModules = modules.length;
  const modulePercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  const onboardingDone = completedModules === totalModules && totalModules > 0;
  const completedTopics = onboardingDone ? 1 : 0;
  const curriculumPercent = Math.round((completedTopics / TOTAL_CURRICULUM_TOPICS) * 100);

  const nextModuleData = modules.find((moduleData) => !completedModuleSlugs.has(moduleData.slug)) ?? null;
  const nextModule = nextModuleData
    ? { order: nextModuleData.order, title: nextModuleData.title, slug: nextModuleData.slug }
    : null;

  const activityByDate = new Map<string, number>();
  topicProgressList.forEach((progressItem) => addActivityEvent(activityByDate, safeDate(progressItem.updatedAt), 2));
  flashActivity.forEach((activityItem) => addActivityEvent(activityByDate, safeDate(activityItem.date), activityItem.count));
  simuladoHistory.items.forEach((attempt) => addActivityEvent(activityByDate, safeDate(attempt.createdAt), 2));

  const streakDays = computeStreak(activityByDate);
  const activity = buildActivityHeatmap(activityByDate);
  const latestAttempt = simuladoHistory.items[0] ?? null;

  const userState = classifyDashboardState({
    completedModules,
    totalModules,
    isPremium: opts.isPremium ?? false,
    hasNextTrack: Boolean(next),
  });

  const { greeting, hero } = buildDashboardHeader({
    state: userState,
    onboarding,
    next,
    completedModules,
    totalModules,
    nextModule,
    greetingTitle: opts.greetingTitle ?? 'Bom dia, Estudante',
    flashDueCount: flashSummary.dueCount,
  });

  return {
    greeting,
    hero,
    stats: [
      {
        id: 'modules',
        label: 'Módulos concluídos',
        value: String(completedModules),
        helper: `de ${totalModules} na trilha F6`,
        delta: completedModules > 0 ? `↑ ${completedModules} concluído(s)` : 'Nenhum concluído ainda',
        tone: 'default',
        deltaTone: completedModules > 0 ? 'up' : 'muted',
      },
      {
        id: 'coverage',
        label: 'Currículo coberto',
        value: `${curriculumPercent}%`,
        helper: `${completedTopics} de ${TOTAL_CURRICULUM_TOPICS} tópicos`,
        delta: `${TOTAL_CURRICULUM_TOPICS - completedTopics} tópicos restantes`,
        tone: 'sap',
        deltaTone: 'warn',
      },
      {
        id: 'mock',
        label: 'Simulados realizados',
        value: String(simuladoCount),
        helper: simuladoCount > 0 ? `${simuladoCount} sessão(ões) finalizada(s)` : 'Nenhum ainda',
        delta: simuladoCount > 0 ? 'Histórico disponível' : 'Comece pelo simulado parcial',
        tone: 'em',
        deltaTone: simuladoCount > 0 ? 'up' : 'muted',
      },
      {
        id: 'streak',
        label: 'Sequência de estudo',
        value: String(streakDays),
        helper: 'dias seguidos',
        delta: streakDays > 0 ? 'Mantenha o ritmo diário' : 'Inicie hoje para criar sequência',
        tone: 'amb',
        deltaTone: streakDays > 0 ? 'up' : 'muted',
      },
    ],
    tracks: [
      {
        id: onboarding.id,
        code: onboarding.code,
        title: onboarding.title,
        subtitle: `${totalModules} módulos · ~${onboarding.estimatedHours}h de estudo`,
        progressPercent: modulePercent,
        tagLabel: onboardingDone ? 'Completo' : modulePercent > 0 ? 'Em progresso' : 'Começar',
        tagTone: onboardingDone ? 'done' : modulePercent > 0 ? 'progress' : 'next',
        href: nextModule
          ? `/trilhas/${onboarding.code.toLowerCase()}/${nextModule.slug}`
          : `/trilhas/${onboarding.code.toLowerCase()}/modulo-01`,
        iconTone: onboardingDone ? 'em' : 'sap',
      },
      ...(next
        ? [
            {
              id: next.id,
              code: next.code,
              title: next.title,
              subtitle: next.summary,
              progressPercent: 0,
              tagLabel: opts.isPremium ? 'Próximo' : 'Premium',
              tagTone: (opts.isPremium ? 'next' : 'locked') as 'next' | 'locked',
              href: opts.isPremium ? `/trilhas/${next.code.toLowerCase()}/modulo-01` : '/premium',
              iconTone: (opts.isPremium ? 'sap' : 'muted') as 'sap' | 'muted',
            },
          ]
        : []),
    ],
    activity,
    coverage: {
      title: 'Cobertura por área',
      rows: [
        {
          id: 'fundamentos',
          label: 'Fundamentos (F1–F10)',
          percentage: Math.round((completedTopics / TRACK_TOTAL_BY_AREA.fundamentos) * 100),
          caption: `${completedTopics} de ${TRACK_TOTAL_BY_AREA.fundamentos} tópicos`,
          tone: 'sap',
        },
        {
          id: 'matematica',
          label: 'Matemática (M1–M7)',
          percentage: 0,
          caption: `0 de ${TRACK_TOTAL_BY_AREA.matematica} tópicos`,
          tone: 'amb',
        },
        {
          id: 'tecnologia',
          label: 'Tecnologia (T1–T8)',
          percentage: 0,
          caption: `0 de ${TRACK_TOTAL_BY_AREA.tecnologia} tópicos`,
          tone: 'coral',
        },
      ],
    },
    flashcards: {
      eyebrow: 'Flashcards',
      title:
        flashSummary.dueCount > 0
          ? `${flashSummary.dueCount} revisão(ões) pendente(s) hoje`
          : 'Nenhuma revisão pendente no momento',
      subtitle:
        flashSummary.dueCount > 0
          ? 'Spaced repetition ativado · priorize os cartões vencidos'
          : 'Abra a sessão para manter sua retenção em dia',
      cta: { label: flashSummary.dueCount > 0 ? 'Revisar agora →' : 'Abrir flashcards →', href: '/flashcards' },
      count: flashSummary.dueCount,
      countLabel: 'pendentes',
    },
    upcoming: [
      {
        id: 'next-module',
        iconKey: 'book-open',
        title: nextModule
          ? `Continuar ${onboarding.code} — Módulo ${nextModule.order}`
          : next
            ? `Começar ${next.code} — ${next.title}`
            : `Revisar ${onboarding.code}`,
        subtitle: nextModule
          ? `${nextModule.title} · ${completedModules} de ${totalModules} concluídos`
          : next
            ? `${next.estimatedModules} módulos · ~${next.estimatedHours}h`
            : `${onboarding.estimatedModules} módulos concluídos`,
        actionLabel: nextModule ? 'Continuar →' : 'Iniciar →',
        href: nextModule
          ? `/trilhas/${onboarding.code.toLowerCase()}/${nextModule.slug}`
          : '/trilhas',
        tone: 'sap',
      },
      {
        id: 'flashcards-review',
        iconKey: 'layers',
        title: flashSummary.dueCount > 0 ? 'Revisar flashcards pendentes' : 'Sem revisões vencidas',
        subtitle:
          flashSummary.dueCount > 0
            ? `${flashSummary.dueCount} cartões para hoje`
            : 'Abra a sessão para revisar opcionalmente',
        actionLabel: 'Revisar →',
        href: '/flashcards',
        tone: 'em',
      },
      {
        id: 'simulado',
        iconKey: 'timer',
        title: simuladoCount > 0 ? 'Refazer simulado parcial' : 'Fazer primeiro simulado parcial',
        subtitle: latestAttempt
          ? `Último resultado: ${Math.round(latestAttempt.accuracy * 100)}% em ${latestAttempt.total} questões`
          : '20 questões · ~45 min',
        actionLabel: 'Fazer →',
        href: '/simulado',
        tone: 'amb',
      },
    ],
  };
}
