/** @vitest-environment jsdom */

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminUsersPage } from '@/components/admin/admin-users-page';

describe('admin users page', () => {
  beforeEach(() => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes('/api/admin/users') && (!init || !init.method || init.method === 'GET')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
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
          }),
        };
      }

      if (url.includes('/api/admin/users/vip') && init?.method === 'POST') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            key: 'email:joao@example.com',
            email: 'joao@example.com',
            userId: null,
            isPremium: true,
            source: 'vip',
            planLabel: 'Plano VIP',
            vipActive: true,
            expiresAt: null,
          }),
        };
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({ error: 'not-found' }),
      };
    });

    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('lista usuários e permite marcar VIP', async () => {
    const user = userEvent.setup();

    render(<AdminUsersPage />);

    expect(await screen.findByRole('heading', { name: /administração de acesso premium/i })).toBeInTheDocument();
    expect(await screen.findByText('joao@example.com')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /marcar vip/i }));

    expect(await screen.findByText(/plano vip/i)).toBeInTheDocument();
  });
});
