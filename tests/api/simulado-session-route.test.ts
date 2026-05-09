import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const entitlementSpy = vi.fn();
const questionsSpy = vi.fn();

vi.mock('@/lib/entitlements', () => ({
  resolveUserEntitlements: entitlementSpy,
}));

vi.mock('@/lib/questions-repo', () => ({
  listQuestions: questionsSpy,
}));

describe('rota de sessão de simulado', () => {
  const originalPk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const originalSk = process.env.CLERK_SECRET_KEY;

  beforeEach(() => {
    vi.resetModules();
    entitlementSpy.mockReset();
    questionsSpy.mockReset();
    questionsSpy.mockResolvedValue([
      {
        id: 'q-1',
        year: 2025,
        source: 'POSCOMP',
        number: 1,
        macroArea: 'fundamentos',
        subTopic: 'automatos-finitos-afd',
        difficulty: 'medium',
        stem: 'Pergunta',
        options: [
          { key: 'A', text: 'A' },
          { key: 'B', text: 'B' },
        ],
        answerKey: 'B',
        tags: [],
      },
    ]);

    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    delete process.env.CLERK_SECRET_KEY;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = originalPk;
    process.env.CLERK_SECRET_KEY = originalSk;
  });

  it('bloqueia modo full para usuário free', async () => {
    entitlementSpy.mockResolvedValue({ isPremium: false, source: 'none', planLabel: 'Plano Free' });

    const routeModule = await import('@/app/api/simulado/session/route');
    const response = await routeModule.POST(
      new NextRequest('http://localhost/api/simulado/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'user-free' },
        body: JSON.stringify({ mode: 'full' }),
      })
    );

    expect(response.status).toBe(403);
    expect(questionsSpy).not.toHaveBeenCalled();
  });

  it('inicia modo partial sem exigir premium', async () => {
    const routeModule = await import('@/app/api/simulado/session/route');
    const response = await routeModule.POST(
      new NextRequest('http://localhost/api/simulado/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'user-local' },
        body: JSON.stringify({ mode: 'partial' }),
      })
    );

    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.mode).toBe('partial');
    expect(Array.isArray(payload.items)).toBe(true);
    expect(payload.items).toHaveLength(1);
  });
});
