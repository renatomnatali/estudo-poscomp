'use client';

import { useMemo, useState } from 'react';

interface PlanFeature {
  label: string;
  available: boolean;
}

const FREE_FEATURES: PlanFeature[] = [
  { label: '5 trilhas free + 5 simulados parciais (20q)', available: true },
  { label: '47 flashcards de Linguagens Formais', available: true },
  { label: 'Dashboard com progresso individual', available: true },
  { label: 'Trilhas premium e simulado completo', available: false },
  { label: 'Analytics por área e exportação', available: false },
];

const PREMIUM_FEATURES: PlanFeature[] = [
  { label: '25 tópicos do edital SBC 2025', available: true },
  { label: '400+ flashcards com SRS adaptativo', available: true },
  { label: 'Simulado completo (70q · 4h)', available: true },
  { label: 'Analytics por área + recomendações', available: true },
  { label: 'Exportação de progresso', available: true },
];

const ANNUAL_FEATURES: PlanFeature[] = [
  { label: 'Tudo do plano Premium', available: true },
  { label: 'Economia de R$169 frente ao mensal', available: true },
  { label: 'Suporte prioritário', available: true },
  { label: 'Acesso antecipado a novas trilhas', available: true },
];

export function PremiumPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual');

  const premiumPricing = useMemo(() => {
    if (billing === 'annual') {
      return {
        value: 'R$25',
        period: '/mês',
        note: 'cobrado anualmente — R$299/ano',
        cta: 'Assinar Premium · R$299/ano',
        ctaClass: 'plan-cta is-annual',
      };
    }
    return {
      value: 'R$39',
      period: '/mês',
      note: 'cobrado mensalmente, cancele quando quiser',
      cta: 'Assinar Premium · R$39/mês',
      ctaClass: 'plan-cta is-premium',
    };
  }, [billing]);

  const annualPricing = {
    value: 'R$299',
    period: '/ano',
    note: '~R$25/mês · economiza R$169 vs mensal',
    cta: 'Assinar Anual · R$299',
    ctaClass: 'plan-cta is-annual',
  };

  return (
    <div className="plans-section">
      <header className="premium-hero">
        <span className="ph-badge">⭐ Premium · plano completo</span>
        <h2 className="ph-title">
          Vá além com o currículo <span className="em">completo</span> do POSCOMP
        </h2>
        <p className="ph-sub">
          25 tópicos, 400+ flashcards, simulado completo cronometrado e analytics detalhado.
          Tudo baseado no edital SBC 2025.
        </p>

        <div className="ph-trust">
          <span className="ph-trust-item">
            <span className="dot" /> baseado no edital SBC 2025
          </span>
          <span className="ph-trust-item">
            <span className="dot" /> cancelamento simples
          </span>
          <span className="ph-trust-item">
            <span className="dot" /> garantia de 7 dias
          </span>
        </div>

        <div className="billing-toggle" role="group" aria-label="Periodicidade de cobrança">
          <button
            type="button"
            className={`toggle-opt ${billing === 'monthly' ? 'active' : ''}`}
            onClick={() => setBilling('monthly')}
          >
            Mensal
          </button>
          <button
            type="button"
            className={`toggle-opt ${billing === 'annual' ? 'active' : ''}`}
            onClick={() => setBilling('annual')}
          >
            Anual
            <span className="toggle-save">−36%</span>
          </button>
        </div>
      </header>

      <div className="plans-grid">
        <article className="plan-card">
          <span className="plan-strip" aria-hidden="true" />
          <p className="plan-badge">Free</p>
          <h3 className="plan-name">Plano Free</h3>
          <div className="plan-price-row">
            <strong className="plan-price tabular">R$0</strong>
            <span className="plan-period">para sempre</span>
          </div>
          <p className="plan-price-note">acesso parcial · sem cartão</p>
          <div className="plan-sep" />
          <ul className="plan-features">
            {FREE_FEATURES.map((feat) => (
              <li key={feat.label} className="plan-feature-row">
                <span className={feat.available ? 'pf-check' : 'pf-lock'} aria-hidden="true">
                  {feat.available ? '✓' : '✕'}
                </span>
                <span>{feat.label}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="plan-cta is-free" disabled>
            Plano atual
          </button>
        </article>

        <article className="plan-card featured">
          <span className="plan-strip" aria-hidden="true" />
          <p className="plan-badge">
            Premium <span className="plan-popular">Mais escolhido</span>
          </p>
          <h3 className="plan-name">Plano Premium</h3>
          <div className="plan-price-row">
            <strong className="plan-price tabular">{premiumPricing.value}</strong>
            <span className="plan-period">{premiumPricing.period}</span>
          </div>
          <p className="plan-price-note">{premiumPricing.note}</p>
          <div className="plan-sep" />
          <ul className="plan-features">
            {PREMIUM_FEATURES.map((feat) => (
              <li key={feat.label} className="plan-feature-row">
                <span className="pf-check" aria-hidden="true">
                  ✓
                </span>
                <span>{feat.label}</span>
              </li>
            ))}
          </ul>
          <button type="button" className={premiumPricing.ctaClass}>
            {premiumPricing.cta}
          </button>
        </article>

        <article className="plan-card">
          <span className="plan-strip" aria-hidden="true" />
          <p className="plan-badge">Anual</p>
          <h3 className="plan-name">Plano Anual</h3>
          <div className="plan-price-row">
            <strong className="plan-price tabular">{annualPricing.value}</strong>
            <span className="plan-period">{annualPricing.period}</span>
          </div>
          <p className="plan-price-note">{annualPricing.note}</p>
          <div className="plan-sep" />
          <ul className="plan-features">
            {ANNUAL_FEATURES.map((feat) => (
              <li key={feat.label} className="plan-feature-row">
                <span className="pf-check" aria-hidden="true">
                  ✓
                </span>
                <span>{feat.label}</span>
              </li>
            ))}
          </ul>
          <button type="button" className={annualPricing.ctaClass}>
            {annualPricing.cta}
          </button>
        </article>
      </div>
    </div>
  );
}
