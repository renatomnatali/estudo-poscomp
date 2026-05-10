import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const authSpy = vi.fn();
const listSpy = vi.fn();
const setVipSpy = vi.fn();

vi.mock('@/lib/admin-auth', () => ({
  resolveAdminAccess: authSpy,
}));

vi.mock('@/lib/admin-users-repo', () => ({
  listAdminUsers: listSpy,
  setUserVipAccess: setVipSpy,
}));

describe('admin users VIP routes', () => {
  beforeEach(() => {
    vi.resetModules();
    authSpy.mockReset();
    listSpy.mockReset();
    setVipSpy.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lista usuários quando admin autenticado', async () => {
    authSpy.mockResolvedValue({ allowed: true, adminEmail: 'admin@example.com' });
    listSpy.mockResolvedValue({
      items: [
        {
          key: 'email:joao@example.com',
          email: 'joao@example.com',
          userId: null,
          isPremium: false,
          source: 'none',
          planLabel: 'Plano Free',
          vipActive: false,
          expiresAt: null,
        },
      ],
    });

    const routeModule = await import('@/app/api/admin/users/route');
    const response = await routeModule.GET(new NextRequest('http://localhost/api/admin/users'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.items).toHaveLength(1);
  });

  it('marca VIP quando admin envia toggle', async () => {
    authSpy.mockResolvedValue({ allowed: true, adminEmail: 'admin@example.com' });
    setVipSpy.mockResolvedValue({
      key: 'email:joao@example.com',
      email: 'joao@example.com',
      userId: null,
      isPremium: true,
      source: 'vip',
      planLabel: 'Plano VIP',
      vipActive: true,
      expiresAt: null,
    });

    const routeModule = await import('@/app/api/admin/users/vip/route');
    const response = await routeModule.POST(
      new NextRequest('http://localhost/api/admin/users/vip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'joao@example.com', enabled: true, reason: 'Suporte' }),
      })
    );

    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.planLabel).toBe('Plano VIP');
  });
});
