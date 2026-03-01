'use client';

import { useMemo, useState } from 'react';

export function PremiumPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual');

  const pricing = useMemo(() => {
    if (billing === 'annual') {
      return {
        value: 'R$25',
        period: '/mês',
        note: 'cobrado anualmente — R$299/ano',
        cta: 'Assinar — R$299/ano',
      };
    }

    return {
      value: 'R$39',
      period: '/mês',
      note: 'cobrado mensalmente',
      cta: 'Assinar — R$39/mês',
    };
  }, [billing]);

  return (
    <>
      <section className="section-card bg-slate-900 text-white">
        <p className="text-xs uppercase tracking-wide text-amber-300">Premium</p>
        <h2 className="mt-2 text-3xl font-bold">Desbloqueie o currículo completo do POSCOMP</h2>
        <p className="mt-2 text-sm text-white/75">
          25 tópicos, 400+ flashcards, simulado completo e analytics detalhado de desempenho.
        </p>
      </section>

      <section className="section-card">
        <div className="inline-flex rounded-full border border-slate-200 p-1">
          <button
            type="button"
            className={`rounded-full px-3 py-1 text-sm ${billing === 'monthly' ? 'bg-slate-900 text-white' : 'text-slate-700'}`}
            onClick={() => setBilling('monthly')}
          >
            Mensal
          </button>
          <button
            type="button"
            className={`rounded-full px-3 py-1 text-sm ${billing === 'annual' ? 'bg-slate-900 text-white' : 'text-slate-700'}`}
            onClick={() => setBilling('annual')}
          >
            Anual
          </button>
        </div>

        <article className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Plano Premium</p>
          <div className="mt-2 flex items-end gap-2">
            <strong className="text-4xl text-slate-900">{pricing.value}</strong>
            <span className="text-slate-500">{pricing.period}</span>
          </div>
          <p className="mt-2 text-sm text-slate-600">{pricing.note}</p>
          <button type="button" className="sim-action-btn sim-action-btn-primary mt-4">
            {pricing.cta}
          </button>
        </article>
      </section>
    </>
  );
}
