import { describe, expect, it } from 'vitest';

import { buildDashboardHeader, classifyDashboardState } from '@/lib/dashboard-state';
import { getNextTrackAfter, getOnboardingTrack, getStudyTrackCards } from '@/lib/study-data';

describe('design system — invariante de onboarding', () => {
  it('tem exatamente uma trilha marcada como isOnboarding', () => {
    const candidates = getStudyTrackCards().filter((track) => track.isOnboarding);
    expect(candidates).toHaveLength(1);
  });

  it('a trilha de onboarding tem pedagogicalOrder definido', () => {
    const onboarding = getOnboardingTrack();
    expect(onboarding.pedagogicalOrder).toBeTypeOf('number');
  });

  it('todas as pedagogicalOrder são únicas', () => {
    const orders = getStudyTrackCards()
      .map((track) => track.pedagogicalOrder)
      .filter((value): value is number => typeof value === 'number');
    const unique = new Set(orders);
    expect(unique.size).toBe(orders.length);
  });

  it('a onboarding efetiva sempre tem contentReady=true (com fallback)', () => {
    // getOnboardingTrack pode aplicar fallback se a marcada não tem
    // contentReady. Em qualquer caso, a trilha retornada tem que estar
    // pronta para o usuário estudar de fato.
    const effective = getOnboardingTrack();
    expect(effective.contentReady).toBe(true);
  });
});

describe('classifyDashboardState', () => {
  it('first-visit quando não há módulos concluídos', () => {
    expect(
      classifyDashboardState({ completedModules: 0, totalModules: 9, isPremium: false, hasNextTrack: true }),
    ).toBe('first-visit');
  });

  it('onboarding-in-progress quando há módulos parciais', () => {
    expect(
      classifyDashboardState({ completedModules: 4, totalModules: 9, isPremium: false, hasNextTrack: true }),
    ).toBe('onboarding-in-progress');
  });

  it('onboarding-done-free quando completo e free', () => {
    expect(
      classifyDashboardState({ completedModules: 9, totalModules: 9, isPremium: false, hasNextTrack: true }),
    ).toBe('onboarding-done-free');
  });

  it('onboarding-done-premium-has-next quando completo + premium + tem next', () => {
    expect(
      classifyDashboardState({ completedModules: 9, totalModules: 9, isPremium: true, hasNextTrack: true }),
    ).toBe('onboarding-done-premium-has-next');
  });

  it('onboarding-done-premium-no-next quando completo + premium + sem next', () => {
    expect(
      classifyDashboardState({ completedModules: 9, totalModules: 9, isPremium: true, hasNextTrack: false }),
    ).toBe('onboarding-done-premium-no-next');
  });
});

describe('buildDashboardHeader — não vaza referências hardcoded à trilha de onboarding', () => {
  it('estado in-progress mostra código real da trilha (não "F6" hardcoded)', () => {
    const onboarding = getOnboardingTrack();
    const next = getNextTrackAfter(onboarding.code);

    const { greeting, hero } = buildDashboardHeader({
      state: 'onboarding-in-progress',
      onboarding,
      next,
      completedModules: 4,
      totalModules: 9,
      nextModule: { order: 5, title: 'Funções de Transição', slug: 'modulo-05' },
      greetingTitle: 'Bom dia, Estudante',
      flashDueCount: 0,
    });

    expect(greeting.subtitle).toContain(onboarding.code);
    expect(hero.title).toContain(onboarding.code);
    expect(hero.primaryCta.label).toContain(onboarding.code);
    expect(hero.primaryCta.href).toContain(`/trilhas/${onboarding.code.toLowerCase()}/`);
  });

  it('estado done-premium-has-next aponta para a próxima trilha', () => {
    const onboarding = getOnboardingTrack();
    const next = getNextTrackAfter(onboarding.code);
    if (!next) return; // skip se config ainda não tem next pedagogical

    const { hero } = buildDashboardHeader({
      state: 'onboarding-done-premium-has-next',
      onboarding,
      next,
      completedModules: 9,
      totalModules: 9,
      nextModule: null,
      greetingTitle: 'Boa tarde, Estudante',
      flashDueCount: 0,
    });

    expect(hero.title).toContain(next.code);
    expect(hero.primaryCta.href).toContain(`/trilhas/${next.code.toLowerCase()}/`);
  });
});
