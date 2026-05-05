'use client';

import { useMemo, useState } from 'react';
import { Check } from 'lucide-react';

const FEATURES = [
  '25 tópicos do edital SBC 2025 destrinchados',
  '400+ flashcards com repetição espaçada',
  'Simulado completo (70 questões cronometradas)',
  'Analytics de desempenho por área',
  'Trilhas premium com exercícios resolvidos',
  'Suporte prioritário',
];

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
    <div className="premium-view">
      <section className="premium-hero">
        <span className="premium-eyebrow">Premium · plano completo</span>
        <h2 className="premium-title">
          Vá além com o <span className="accent-em">currículo completo</span> do POSCOMP
        </h2>
        <p className="premium-sub">
          25 tópicos, 400+ flashcards, simulado completo e analytics detalhado de desempenho.
        </p>
      </section>

      <section className="premium-plan-card">
        <div className="premium-plan-strip" aria-hidden="true" />
        <div className="premium-plan-toolbar">
          <div className="premium-billing-switch">
            <button
              type="button"
              className={`premium-billing-pill ${billing === 'monthly' ? 'is-active' : ''}`}
              onClick={() => setBilling('monthly')}
            >
              Mensal
            </button>
            <button
              type="button"
              className={`premium-billing-pill ${billing === 'annual' ? 'is-active' : ''}`}
              onClick={() => setBilling('annual')}
            >
              Anual
            </button>
          </div>
          {billing === 'annual' ? <span className="premium-billing-tag">economize 36%</span> : null}
        </div>

        <p className="premium-plan-eyebrow">Plano Premium</p>
        <div className="premium-plan-price">
          <strong className="premium-plan-value tabular">{pricing.value}</strong>
          <span className="premium-plan-period">{pricing.period}</span>
        </div>
        <p className="premium-plan-note">{pricing.note}</p>

        <ul className="premium-feature-list">
          {FEATURES.map((feature) => (
            <li key={feature}>
              <span className="premium-feature-tick" aria-hidden="true">
                <Check width={12} height={12} strokeWidth={2.5} />
              </span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <button type="button" className="premium-plan-cta">
          {pricing.cta}
        </button>
      </section>
    </div>
  );
}
