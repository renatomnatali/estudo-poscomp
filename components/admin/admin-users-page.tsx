'use client';

import { useEffect, useMemo, useState } from 'react';

import type { AdminUserSummary } from '@/lib/admin-types';

type PlanFilter = 'all' | 'free' | 'premium' | 'vip';

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR');
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export function AdminUsersPage() {
  const [items, setItems] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [filter, setFilter] = useState<PlanFilter>('all');
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadUsers(searchValue = query) {
    setLoading(true);
    setErrorMessage(null);

    const params = searchValue.trim().length > 0 ? `?q=${encodeURIComponent(searchValue.trim())}` : '';
    const response = await fetch(`/api/admin/users${params}`, { cache: 'no-store' });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setItems([]);
      setErrorMessage(payload?.error || 'Não foi possível carregar usuários.');
      setLoading(false);
      return;
    }

    const payload = (await response.json()) as { items?: AdminUserSummary[] };
    setItems(Array.isArray(payload.items) ? payload.items : []);
    setLoading(false);
  }

  useEffect(() => {
    void loadUsers('');
    // load inicial único
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleItems = useMemo(() => {
    const normalized = normalizeSearch(query);

    return items.filter((entry) => {
      if (filter === 'vip' && !entry.vipActive) return false;
      if (filter === 'premium' && entry.source !== 'billing') return false;
      if (filter === 'free' && entry.isPremium) return false;

      if (!normalized) return true;

      const text = `${entry.email || ''} ${entry.userId || ''}`.toLowerCase();
      return text.includes(normalized);
    });
  }, [items, filter, query]);

  async function toggleVip(entry: AdminUserSummary) {
    if (entry.source === 'billing' && !entry.vipActive) return;

    setPendingKey(entry.key);
    setErrorMessage(null);

    const response = await fetch('/api/admin/users/vip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: entry.email,
        userId: entry.userId,
        enabled: !entry.vipActive,
        reason: 'Ajuste manual via tela administrativa',
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setErrorMessage(payload?.error || 'Falha ao atualizar VIP.');
      setPendingKey(null);
      return;
    }

    const updated = (await response.json()) as AdminUserSummary;
    setItems((previous) => previous.map((item) => (item.key === entry.key ? updated : item)));
    setPendingKey(null);
  }

  return (
    <section className="section-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Administração de acesso premium</h2>
          <p className="mt-1 text-sm text-slate-600">
            Gestão de usuários com entitlement Free, Premium Pago e VIP.
          </p>
        </div>
        <button
          type="button"
          className="sim-action-btn sim-action-btn-tertiary"
          onClick={() => void loadUsers()}
          disabled={loading}
        >
          Atualizar lista
        </button>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end">
        <label className="block text-sm text-slate-600" htmlFor="admin-user-search">
          Buscar por e-mail ou userId
          <input
            id="admin-user-search"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder="renato@dominio.com"
          />
        </label>

        <label className="block text-sm text-slate-600" htmlFor="admin-plan-filter">
          Filtro
          <select
            id="admin-plan-filter"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            value={filter}
            onChange={(event) => setFilter(event.target.value as PlanFilter)}
          >
            <option value="all">Todos</option>
            <option value="free">Free</option>
            <option value="premium">Premium Pago</option>
            <option value="vip">VIP</option>
          </select>
        </label>

        <button
          type="button"
          className="sim-action-btn sim-action-btn-primary"
          onClick={() => {
            const normalized = queryInput.trim();
            setQuery(normalized);
            void loadUsers(normalized);
          }}
          disabled={loading}
        >
          Buscar
        </button>
      </div>

      {errorMessage ? <p className="mt-3 text-sm text-rose-700">{errorMessage}</p> : null}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-2 py-2 font-semibold">Usuário</th>
              <th className="px-2 py-2 font-semibold">Plano</th>
              <th className="px-2 py-2 font-semibold">Origem</th>
              <th className="px-2 py-2 font-semibold">Expira em</th>
              <th className="px-2 py-2 font-semibold">Atualizado</th>
              <th className="px-2 py-2 font-semibold">Ação VIP</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((entry) => {
              const actionDisabled = pendingKey === entry.key || (entry.source === 'billing' && !entry.vipActive);
              const actionLabel =
                entry.source === 'billing' && !entry.vipActive
                  ? 'VIP não necessário'
                  : entry.vipActive
                    ? 'Desmarcar VIP'
                    : 'Marcar VIP';

              return (
                <tr key={entry.key} className="border-b border-slate-100">
                  <td className="px-2 py-3">
                    <div className="font-medium text-slate-900">{entry.email || '—'}</div>
                    <div className="text-xs text-slate-500">{entry.userId || 'Sem userId'}</div>
                  </td>
                  <td className="px-2 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        entry.planLabel === 'Plano VIP'
                          ? 'bg-emerald-100 text-emerald-800'
                          : entry.planLabel === 'Plano Premium'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {entry.planLabel}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-slate-700">{entry.source}</td>
                  <td className="px-2 py-3 text-slate-700">{formatDate(entry.expiresAt)}</td>
                  <td className="px-2 py-3 text-slate-700">{formatDate(entry.updatedAt)}</td>
                  <td className="px-2 py-3">
                    <button
                      type="button"
                      className={`sim-action-btn ${
                        entry.vipActive ? 'sim-action-btn-secondary' : 'sim-action-btn-primary'
                      }`}
                      onClick={() => void toggleVip(entry)}
                      disabled={actionDisabled}
                    >
                      {pendingKey === entry.key ? 'Salvando...' : actionLabel}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!loading && visibleItems.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Nenhum usuário encontrado com os filtros atuais.</p>
      ) : null}
    </section>
  );
}
