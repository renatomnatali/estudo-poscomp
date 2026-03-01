'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

import { isClerkEnabledClient } from '@/lib/auth-config';
import type { DashboardStat, DashboardSummary } from '@/lib/types';

const ACTIVITY_LEVEL_CLASS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: '',
  1: 'lvl-1',
  2: 'lvl-2',
  3: 'lvl-3',
  4: 'lvl-4',
};

const STAT_VALUE_CLASS: Record<DashboardStat['tone'], string> = {
  default: '',
  sap: 'blue',
  em: 'green',
  amb: 'amber',
};

const STAT_DELTA_CLASS: Record<DashboardStat['deltaTone'], string> = {
  up: 'up',
  warn: 'warn',
  muted: 'muted',
};

const TRACK_TAG_CLASS: Record<DashboardSummary['tracks'][number]['tagTone'], string> = {
  done: 'tag-done',
  next: 'tag-next',
  locked: 'tag-lock',
  progress: 'tag-prog',
};

const TRACK_ICON_CLASS: Record<DashboardSummary['tracks'][number]['iconTone'], string> = {
  sap: 'tone-sap',
  em: 'tone-em',
  muted: 'tone-muted',
};

const COVERAGE_TONE_CLASS: Record<DashboardSummary['coverage']['rows'][number]['tone'], string> = {
  sap: 'tone-sap',
  amb: 'tone-amb',
  coral: 'tone-coral',
};

const UPCOMING_TONE_CLASS: Record<DashboardSummary['upcoming'][number]['tone'], string> = {
  sap: 'tone-sap',
  em: 'tone-em',
  amb: 'tone-amb',
};

function extractDisplayNameFromGreeting(greetingTitle: string) {
  if (!greetingTitle.trim()) return 'Estudante';

  const [firstChunk, secondChunk] = greetingTitle.split(',');
  if (secondChunk?.trim()) return secondChunk.trim();

  if (firstChunk?.toLowerCase().startsWith('bom dia')) {
    return firstChunk.replace(/bom dia/i, '').replace(/[,:]/g, '').trim() || 'Estudante';
  }

  return firstChunk.trim() || 'Estudante';
}

function DashboardContent({ summary, displayName }: { summary: DashboardSummary; displayName: string }) {
  return (
    <div className="dash-view">
      <div className="dash-page-header">
        <div>
          <h2 className="dash-page-title">Bom dia, {displayName}</h2>
          <p className="dash-page-sub">{summary.greeting.subtitle}</p>
        </div>
        <Link href={summary.greeting.cta.href} className="dash-btn-primary">
          {summary.greeting.cta.label}
        </Link>
      </div>

      <div className="dash-hero-card">
        <div className="dash-hero-text">
          <p className="dash-hero-eyebrow">{summary.hero.eyebrow}</p>
          <h3 className="dash-hero-title">{summary.hero.title}</h3>
          <p className="dash-hero-sub">{summary.hero.subtitle}</p>
        </div>
        <div className="dash-hero-actions">
          <Link href={summary.hero.primaryCta.href} className="dash-btn-hero">
            {summary.hero.primaryCta.label}
          </Link>
          <Link href={summary.hero.secondaryCta.href} className="dash-btn-hero-ghost">
            {summary.hero.secondaryCta.label}
          </Link>
        </div>
      </div>

      <div className="dash-stats-row">
        {summary.stats.map((stat) => (
          <article key={stat.id} className="dash-stat-card">
            <p className="dash-s-eyebrow">{stat.label}</p>
            <p className={`dash-s-value ${STAT_VALUE_CLASS[stat.tone]}`}>{stat.value}</p>
            <p className="dash-s-label">{stat.helper}</p>
            <p className={`dash-s-delta ${STAT_DELTA_CLASS[stat.deltaTone]}`}>{stat.delta}</p>
          </article>
        ))}
      </div>

      <div className="dash-main-grid">
        <div className="dash-col">
          <article className="dash-card">
            <div className="dash-card-header">
              <h4 className="dash-card-title">Trilhas de estudo</h4>
              <Link href="/trilhas" className="dash-card-link">
                Ver todas →
              </Link>
            </div>

            {summary.tracks.map((track) => (
              <Link key={track.id} href={track.href} className="dash-module-row">
                <div className={`dash-module-icon ${TRACK_ICON_CLASS[track.iconTone]}`}>{track.code}</div>
                <div className="dash-module-info">
                  <p className="dash-module-name">{track.title}</p>
                  <p className="dash-module-sub">{track.subtitle}</p>
                  {track.progressPercent !== undefined ? (
                    <div className="dash-module-prog">
                      <div className="dash-module-prog-fill" style={{ width: `${track.progressPercent}%` }} />
                    </div>
                  ) : null}
                </div>
                <span className={`dash-module-tag ${TRACK_TAG_CLASS[track.tagTone]}`}>{track.tagLabel}</span>
              </Link>
            ))}
          </article>

          <article className="dash-card">
            <div className="dash-card-header">
              <h4 className="dash-card-title">{summary.activity.title}</h4>
              <span className="dash-activity-subtitle">{summary.activity.subtitle}</span>
            </div>

            <div className="dash-activity-grid">
              {summary.activity.days.map((day) => (
                <div key={day.id} className="dash-day-col">
                  {day.levels.map((level, index) => (
                    <div key={`${day.id}-${index}`} className={`dash-day-cell ${ACTIVITY_LEVEL_CLASS[level]}`} />
                  ))}
                  <span className="dash-day-label">{day.label}</span>
                </div>
              ))}
            </div>

            <div className="dash-activity-legend">
              <span>{summary.activity.legendStart}</span>
              <div className="dash-leg-cells">
                <div className="dash-leg-cell" />
                <div className="dash-leg-cell lvl-1" />
                <div className="dash-leg-cell lvl-2" />
                <div className="dash-leg-cell lvl-3" />
                <div className="dash-leg-cell lvl-4" />
              </div>
              <span>{summary.activity.legendEnd}</span>
            </div>
          </article>
        </div>

        <div className="dash-col">
          <article className="dash-card">
            <div className="dash-card-header">
              <h4 className="dash-card-title">{summary.coverage.title}</h4>
            </div>

            {summary.coverage.rows.map((row) => (
              <div key={row.id} className="dash-area-row">
                <div className="dash-area-hrow">
                  <span className="dash-area-name">{row.label}</span>
                  <span className={`dash-area-pct ${COVERAGE_TONE_CLASS[row.tone]}`}>{row.percentage}%</span>
                </div>
                <div className="dash-area-bar-bg">
                  <div
                    className={`dash-area-bar-fill ${COVERAGE_TONE_CLASS[row.tone]}`}
                    style={{ width: `${Math.max(0, Math.min(100, row.percentage))}%` }}
                  />
                </div>
                <p className="dash-area-caption">{row.caption}</p>
              </div>
            ))}
          </article>

          <article className="dash-flash-widget">
            <div className="dash-flash-left">
              <p className="dash-flash-label">{summary.flashcards.eyebrow}</p>
              <h4 className="dash-flash-title">{summary.flashcards.title}</h4>
              <p className="dash-flash-sub">{summary.flashcards.subtitle}</p>
              <Link href={summary.flashcards.cta.href} className="dash-btn-sm">
                {summary.flashcards.cta.label}
              </Link>
            </div>
            <div className="dash-flash-count">
              <p className="dash-flash-num">{summary.flashcards.count}</p>
              <p className="dash-flash-num-label">{summary.flashcards.countLabel}</p>
            </div>
          </article>

          <article className="dash-card">
            <div className="dash-card-header">
              <h4 className="dash-card-title">Próximas ações</h4>
            </div>

            {summary.upcoming.map((item) => (
              <div key={item.id} className="dash-upcoming-row">
                <div className={`dash-upcoming-icon ${UPCOMING_TONE_CLASS[item.tone]}`}>{item.icon}</div>
                <div className="dash-upcoming-info">
                  <p className="dash-upcoming-name">{item.title}</p>
                  <p className="dash-upcoming-sub">{item.subtitle}</p>
                </div>
                <Link href={item.href} className="dash-upcoming-action">
                  {item.actionLabel}
                </Link>
              </div>
            ))}
          </article>
        </div>
      </div>
    </div>
  );
}

function DashboardPageWithUser({ summary }: { summary: DashboardSummary }) {
  const { user } = useUser();

  if (!user) {
    return <section className="section-card">Carregando dashboard...</section>;
  }

  const displayName =
    user.fullName?.trim() ||
    user.firstName?.trim() ||
    user.username?.trim() ||
    user.primaryEmailAddress?.emailAddress.split('@')[0]?.trim() ||
    user.id;

  return <DashboardContent summary={summary} displayName={displayName} />;
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    async function loadSummary() {
      const response = await fetch('/api/study/dashboard/summary');
      const payload = (await response.json()) as DashboardSummary;
      setSummary(payload);
    }

    void loadSummary();
  }, []);

  if (!summary) {
    return <section className="section-card">Carregando dashboard...</section>;
  }

  if (!isClerkEnabledClient()) {
    const fallbackName = extractDisplayNameFromGreeting(summary.greeting.title);
    return <DashboardContent summary={summary} displayName={fallbackName} />;
  }

  return <DashboardPageWithUser summary={summary} />;
}
