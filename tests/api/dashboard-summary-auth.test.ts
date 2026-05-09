import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

describe('dashboard summary com Clerk habilitado', () => {
  const originalPk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const originalSk = process.env.CLERK_SECRET_KEY;

  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_dashboard';
    process.env.CLERK_SECRET_KEY = 'sk_test_dashboard';
  });

  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = originalPk;
    process.env.CLERK_SECRET_KEY = originalSk;
  });

  it('retorna 401 quando não existe sessão autenticada', async () => {
    vi.doMock('@clerk/nextjs/server', () => ({
      auth: async () => ({ userId: null }),
    }));

    const routeModule = await import('@/app/api/study/dashboard/summary/route');
    const response = await routeModule.GET(
      new NextRequest('http://localhost/api/study/dashboard/summary')
    );

    expect(response.status).toBe(401);
  });
});
