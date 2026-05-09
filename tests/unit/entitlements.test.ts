import { describe, expect, it } from 'vitest';

import {
  resolvePremiumAccessFromRecords,
  type SubscriptionRecord,
  type AccessGrantRecord,
} from '@/lib/entitlements';

function at(value: string) {
  return new Date(value);
}

describe('entitlements', () => {
  it('prioriza assinatura premium ativa (billing)', () => {
    const subscriptions: SubscriptionRecord[] = [
      {
        planCode: 'premium',
        status: 'active',
        currentPeriodEnd: at('2027-01-01T00:00:00.000Z'),
      },
    ];

    const access = resolvePremiumAccessFromRecords({
      subscriptions,
      grants: [],
      now: at('2026-03-06T12:00:00.000Z'),
    });

    expect(access.isPremium).toBe(true);
    expect(access.source).toBe('billing');
    expect(access.planLabel).toBe('Plano Premium');
    expect(access.expiresAt).toBe('2027-01-01T00:00:00.000Z');
  });

  it('libera premium por grant VIP ativo quando não há assinatura ativa', () => {
    const grants: AccessGrantRecord[] = [
      {
        scope: 'premium_access',
        grantType: 'vip',
        startsAt: at('2026-01-01T00:00:00.000Z'),
        endsAt: null,
        revokedAt: null,
      },
    ];

    const access = resolvePremiumAccessFromRecords({
      subscriptions: [],
      grants,
      now: at('2026-03-06T12:00:00.000Z'),
    });

    expect(access.isPremium).toBe(true);
    expect(access.source).toBe('vip');
    expect(access.planLabel).toBe('Plano VIP');
  });

  it('mantém usuário free quando assinatura expirada e grant revogado', () => {
    const subscriptions: SubscriptionRecord[] = [
      {
        planCode: 'premium',
        status: 'expired',
        currentPeriodEnd: at('2026-02-01T00:00:00.000Z'),
      },
    ];

    const grants: AccessGrantRecord[] = [
      {
        scope: 'premium_access',
        grantType: 'vip',
        startsAt: at('2026-01-01T00:00:00.000Z'),
        endsAt: null,
        revokedAt: at('2026-02-15T00:00:00.000Z'),
      },
    ];

    const access = resolvePremiumAccessFromRecords({
      subscriptions,
      grants,
      now: at('2026-03-06T12:00:00.000Z'),
    });

    expect(access.isPremium).toBe(false);
    expect(access.source).toBe('none');
    expect(access.planLabel).toBe('Plano Free');
  });
});
