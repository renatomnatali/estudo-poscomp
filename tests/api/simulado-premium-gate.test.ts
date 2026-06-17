import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const entitlementSpy = vi.fn();

vi.mock('@/lib/entitlements', () => ({
  resolveUserEntitlements: entitlementSpy,
}));

describe('simulado premium gate no backend', () => {
  const originalPk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const originalSk = process.env.CLERK_SECRET_KEY;

  beforeEach(() => {
    vi.resetModules();
    entitlementSpy.mockReset();
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    delete process.env.CLERK_SECRET_KEY;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = originalPk;
    process.env.CLERK_SECRET_KEY = originalSk;
  });

  it('retorna 403 para modo premium quando usuário é free', async () => {
    entitlementSpy.mockResolvedValue({
      isPremium: false,
      source: 'none',
      planLabel: 'Plano Free',
    });

    const routeModule = await import('@/app/api/simulado/attempts/route');
    const response = await routeModule.POST(
      new NextRequest('http://localhost/api/simulado/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'user-free' },
        body: JSON.stringify({
          mode: 'full',
          total: 70,
          correct: 50,
          accuracy: 0.71,
          recommendedNextTopics: [],
        }),
      })
    );

    const payload = await response.json();
    expect(response.status).toBe(403);
    expect(payload.error).toMatch(/premium/i);
  });

  it('permite modo premium quando usuário tem grant VIP', async () => {
    entitlementSpy.mockResolvedValue({
      isPremium: true,
      source: 'vip',
      planLabel: 'Plano VIP',
    });

    const routeModule = await import('@/app/api/simulado/attempts/route');
    const response = await routeModule.POST(
      new NextRequest('http://localhost/api/simulado/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'user-vip' },
        body: JSON.stringify({
          mode: 'full',
          total: 70,
          correct: 50,
          accuracy: 0.71,
          recommendedNextTopics: [],
        }),
      })
    );

    expect(response.status).toBe(201);
  });
});
