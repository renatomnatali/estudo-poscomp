import type { DashboardSummary, StudyTrackCard } from '@/lib/types';

/**
 * Estado discreto do estudante no app, usado para escolher saudação,
 * texto e CTA do cabeçalho do dashboard. Derivado dos dados disponíveis
 * (progresso da trilha de onboarding + se o usuário é premium).
 */
export type DashboardUserState =
  | 'first-visit'
  | 'onboarding-in-progress'
  | 'onboarding-done-free'
  | 'onboarding-done-premium-has-next'
  | 'onboarding-done-premium-no-next';

export interface DashboardHeaderContext {
  state: DashboardUserState;
  /** Trilha de onboarding (porta de entrada do app, decisão de produto). */
  onboarding: StudyTrackCard;
  /** Trilha após a de onboarding na ordem pedagógica, se houver. */
  next: StudyTrackCard | null;
  /** Módulos da trilha de onboarding já concluídos. */
  completedModules: number;
  /** Total de módulos da trilha de onboarding. */
  totalModules: number;
  /**
   * Próximo módulo a ser estudado dentro da trilha de onboarding,
   * quando ela ainda não terminou. `null` se onboarding está completa
   * ou nunca foi iniciada.
   */
  nextModule: { order: number; title: string; slug: string } | null;
  /** Saudação dinâmica calculada no servidor. Ex.: "Bom dia, Renato". */
  greetingTitle: string;
  /** Quantidade de flashcards pendentes para revisão hoje. */
  flashDueCount: number;
}

export function classifyDashboardState({
  completedModules,
  totalModules,
  isPremium,
  hasNextTrack,
}: {
  completedModules: number;
  totalModules: number;
  isPremium: boolean;
  hasNextTrack: boolean;
}): DashboardUserState {
  if (totalModules === 0 || completedModules === 0) return 'first-visit';

  const onboardingDone = completedModules >= totalModules && totalModules > 0;
  if (!onboardingDone) return 'onboarding-in-progress';

  if (!isPremium) return 'onboarding-done-free';
  return hasNextTrack ? 'onboarding-done-premium-has-next' : 'onboarding-done-premium-no-next';
}

export function buildDashboardHeader(ctx: DashboardHeaderContext): {
  greeting: DashboardSummary['greeting'];
  hero: DashboardSummary['hero'];
} {
  const { state, onboarding, next, completedModules, totalModules, nextModule, greetingTitle, flashDueCount } = ctx;

  const onboardingHrefBase = `/trilhas/${onboarding.code.toLowerCase()}`;

  switch (state) {
    case 'first-visit':
      // Sem subtitle: greeting fica só com a saudação. Tudo que precisa
      // ser dito sobre "começar" está no hero.
      return {
        greeting: { title: greetingTitle },
        hero: {
          eyebrow: 'Comece sua jornada',
          title: `${onboarding.code} — ${onboarding.title}`,
          subtitle: `Sua primeira trilha · ${onboarding.estimatedModules} módulos · ~${onboarding.estimatedHours}h`,
          primaryCta: { label: `Começar ${onboarding.code} →`, href: `${onboardingHrefBase}/modulo-01` },
          secondaryCta: { label: 'Ver todas as trilhas', href: '/trilhas' },
        },
      };

    case 'onboarding-in-progress': {
      const remaining = Math.max(0, totalModules - completedModules);
      return {
        greeting: {
          title: greetingTitle,
          subtitle:
            remaining === 1
              ? `Falta 1 módulo para concluir ${onboarding.code}.`
              : `Faltam ${remaining} módulos para concluir ${onboarding.code}.`,
        },
        hero: {
          eyebrow: 'Continue de onde parou',
          title: nextModule
            ? `${onboarding.code} · Módulo ${nextModule.order} — ${nextModule.title}`
            : `${onboarding.code} — ${onboarding.title}`,
          subtitle: `${completedModules} de ${totalModules} módulos concluídos · próximo passo da trilha ${onboarding.title}`,
          primaryCta: {
            label: `Continuar ${onboarding.code} →`,
            href: nextModule ? `${onboardingHrefBase}/${nextModule.slug}` : `${onboardingHrefBase}/modulo-01`,
          },
          secondaryCta: { label: 'Ver toda a trilha', href: '/trilhas' },
        },
      };
    }

    case 'onboarding-done-free':
      return {
        greeting: { title: greetingTitle },
        hero: {
          eyebrow: `${onboarding.code} concluído · ${onboarding.estimatedModules} módulos`,
          title: 'Fixe o que aprendeu',
          subtitle:
            flashDueCount > 0
              ? `${flashDueCount} cartões para revisar hoje · próximas trilhas no Premium`
              : `Cartões prontos para revisão · próximas trilhas no Premium`,
          primaryCta: { label: 'Revisar flashcards →', href: '/flashcards' },
          secondaryCta: { label: 'Conhecer Premium', href: '/premium' },
        },
      };

    case 'onboarding-done-premium-has-next': {
      const target = next!;
      const nextHrefBase = `/trilhas/${target.code.toLowerCase()}`;
      return {
        greeting: { title: greetingTitle },
        hero: {
          eyebrow: `${onboarding.code} concluído · vamos para ${target.code}`,
          title: `${target.code} — ${target.title}`,
          subtitle: `${target.summary} · ${target.estimatedModules} módulos · ~${target.estimatedHours}h`,
          primaryCta: { label: `Começar ${target.code} →`, href: `${nextHrefBase}/modulo-01` },
          secondaryCta: { label: 'Fazer simulado completo', href: '/simulado' },
        },
      };
    }

    case 'onboarding-done-premium-no-next':
      return {
        greeting: { title: greetingTitle },
        hero: {
          eyebrow: 'Trilhas completas',
          title: 'Pronto para o POSCOMP',
          subtitle: 'Faça o simulado completo (70 questões · 4h) e revise os pontos fracos.',
          primaryCta: { label: 'Fazer simulado completo →', href: '/simulado' },
          secondaryCta: { label: 'Revisar flashcards', href: '/flashcards' },
        },
      };
  }
}
