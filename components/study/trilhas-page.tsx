'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import type { StudyTrackCard } from '@/lib/types';

type FilterId = 'all' | 'free' | 'done' | 'fund' | 'mat' | 'tec';
type VisualStatus = 'done' | 'next' | 'progress' | 'locked';

const FILTERS: Array<{ id: FilterId; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'free', label: 'Free' },
  { id: 'done', label: 'Concluídos' },
  { id: 'fund', label: 'Fundamentos' },
  { id: 'mat', label: 'Matemática' },
  { id: 'tec', label: 'Tecnologia' },
];

const AREA_ORDER: StudyTrackCard['macroArea'][] = ['fundamentos', 'matematica', 'tecnologia'];

const AREA_META: Record<
  StudyTrackCard['macroArea'],
  { key: FilterId; title: string; toneClass: string }
> = {
  fundamentos: {
    key: 'fund',
    title: 'Fundamentos da Computação',
    toneClass: 'tone-sap',
  },
  matematica: {
    key: 'mat',
    title: 'Matemática para Computação',
    toneClass: 'tone-amb',
  },
  tecnologia: {
    key: 'tec',
    title: 'Tecnologia da Computação',
    toneClass: 'tone-coral',
  },
};

const LEVEL_BY_CODE: Record<string, string> = {
  F1: 'Nível médio',
  F2: 'Nível médio',
  F3: 'Nível médio',
  F4: 'Iniciante',
  F5: 'Nível médio',
  F7: 'Avançado',
};

function toCodeSortValue(code: string) {
  const prefix = code.charCodeAt(0) || 0;
  const number = Number.parseInt(code.slice(1), 10) || 0;
  return prefix * 100 + number;
}

function getVisualStatus(item: StudyTrackCard): VisualStatus {
  if (item.status === 'done') return 'done';
  if (item.code === 'F7') return 'next';
  if (item.status === 'in_progress') return 'progress';
  return 'locked';
}

function getStatusLabel(item: StudyTrackCard) {
  const visualStatus = getVisualStatus(item);
  if (visualStatus === 'done') return '✓ Concluído';
  if (visualStatus === 'next') return '→ Próximo';
  if (visualStatus === 'progress') return 'Em progresso';
  return 'Premium';
}

function getStatusClass(item: StudyTrackCard) {
  const visualStatus = getVisualStatus(item);
  if (visualStatus === 'done') return 'ts-done';
  if (visualStatus === 'next') return 'ts-next';
  if (visualStatus === 'progress') return 'ts-prog';
  return 'ts-lock';
}

function getCardClassName(item: StudyTrackCard) {
  const visualStatus = getVisualStatus(item);
  return [
    'tracks-topic-card',
    visualStatus === 'locked' ? 'locked' : '',
    visualStatus === 'done' ? 'completed' : '',
    visualStatus === 'next' ? 'active-next' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function getIdToneClass(item: StudyTrackCard) {
  const visualStatus = getVisualStatus(item);
  if (visualStatus === 'done') return 'tone-em';
  if (visualStatus === 'next' || visualStatus === 'progress') return 'tone-sap';
  return 'tone-muted';
}

function getProgressToneClass(item: StudyTrackCard) {
  const visualStatus = getVisualStatus(item);
  if (visualStatus === 'done') return 'tone-em';
  if (visualStatus === 'next' || visualStatus === 'progress') return 'tone-sap';
  return 'tone-muted';
}

function formatHours(hours: number) {
  return Number.isInteger(hours) ? `${hours}h` : `${hours}h`;
}

function matchesFilter(item: StudyTrackCard, filter: FilterId) {
  if (filter === 'all') return true;
  if (filter === 'free') return item.free;
  if (filter === 'done') return item.status === 'done';
  if (filter === 'fund') return item.macroArea === 'fundamentos';
  if (filter === 'mat') return item.macroArea === 'matematica';
  if (filter === 'tec') return item.macroArea === 'tecnologia';
  return true;
}

export function TrilhasPage() {
  const [filter, setFilter] = useState<FilterId>('all');
  const [items, setItems] = useState<StudyTrackCard[] | null>(null);

  useEffect(() => {
    async function loadTracks() {
      const response = await fetch('/api/study/tracks/catalog?filter=all');
      const payload = (await response.json()) as { items: StudyTrackCard[] };
      setItems(Array.isArray(payload.items) ? payload.items : []);
    }

    void loadTracks();
  }, []);

  const allItems = useMemo(
    () =>
      [...(items ?? [])].sort((a, b) => toCodeSortValue(a.code) - toCodeSortValue(b.code)),
    [items]
  );

  const visibleItems = useMemo(
    () => allItems.filter((item) => matchesFilter(item, filter)),
    [allItems, filter]
  );

  const globalSummary = useMemo(() => {
    const done = allItems.filter((item) => item.status === 'done').length;
    const inProgress = allItems.filter((item) => item.status === 'in_progress').length;
    const locked = allItems.filter((item) => item.status === 'locked').length;
    const coveragePercent = allItems.length > 0 ? Math.round((done / allItems.length) * 100) : 0;

    return { done, inProgress, locked, coveragePercent };
  }, [allItems]);

  const sectionRows = useMemo(() => {
    return AREA_ORDER.map((area) => {
      const fromAll = allItems.filter((item) => item.macroArea === area);
      const fromVisible = visibleItems.filter((item) => item.macroArea === area);
      const done = fromAll.filter((item) => item.status === 'done').length;
      const percent = fromAll.length > 0 ? Math.round((done / fromAll.length) * 100) : 0;

      return {
        area,
        meta: AREA_META[area],
        total: fromAll.length,
        done,
        percent,
        cards: fromVisible,
      };
    }).filter((row) => row.cards.length > 0);
  }, [allItems, visibleItems]);

  if (!items) {
    return <section className="section-card">Carregando trilhas...</section>;
  }

  return (
    <div className="tracks-view">
      <section className="tracks-page-header">
        <div>
          <h2 className="tracks-page-title">Trilhas de Estudo</h2>
          <p className="tracks-page-sub">
            25 tópicos do edital SBC organizados em trilhas sequenciais
          </p>
        </div>

        <div className="tracks-filter-bar">
          {FILTERS.map((item, index) => (
            <div key={item.id} className="tracks-filter-group">
              {index === 3 ? <div className="tracks-filter-sep" /> : null}
              <button
                type="button"
                className={`tracks-filter-btn ${filter === item.id ? 'active' : ''}`}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="tracks-summary-strip" aria-label="Resumo geral">
        <article className="tracks-sum-card">
          <div className="tracks-sum-icon tone-em">✅</div>
          <div>
            <p className="tracks-sum-val tone-em">{globalSummary.done}</p>
            <p className="tracks-sum-label">Tópico concluído</p>
          </div>
        </article>
        <article className="tracks-sum-card">
          <div className="tracks-sum-icon tone-sap">📖</div>
          <div>
            <p className="tracks-sum-val tone-sap">{globalSummary.inProgress}</p>
            <p className="tracks-sum-label">Em progresso</p>
          </div>
        </article>
        <article className="tracks-sum-card">
          <div className="tracks-sum-icon tone-muted">🔒</div>
          <div>
            <p className="tracks-sum-val tone-muted">{globalSummary.locked}</p>
            <p className="tracks-sum-label">Bloqueados</p>
          </div>
        </article>
        <article className="tracks-sum-card">
          <div className="tracks-sum-icon tone-amb">🎯</div>
          <div>
            <p className="tracks-sum-val tone-amb">{globalSummary.coveragePercent}%</p>
            <p className="tracks-sum-label">Currículo coberto</p>
          </div>
        </article>
      </section>

      {sectionRows.map((section) => (
        <section key={section.area} className="tracks-area-section" data-area={section.meta.key}>
          <header className="tracks-area-header">
            <div className={`tracks-area-dot ${section.meta.toneClass}`} />
            <h3 className="tracks-area-name">{section.meta.title}</h3>
            <p className="tracks-area-meta">
              · {section.total} tópicos · {section.done} concluído{section.done === 1 ? '' : 's'}
            </p>
            <div className="tracks-area-prog-wrap">
              <div className="tracks-area-prog-bar">
                <div
                  className={`tracks-area-prog-fill ${section.meta.toneClass}`}
                  style={{ width: `${section.percent}%` }}
                />
              </div>
              <span className={`tracks-area-pct ${section.meta.toneClass}`}>{section.percent}%</span>
            </div>
          </header>

          <div className="tracks-topic-grid">
            {section.cards.map((item) => {
              const visualStatus = getVisualStatus(item);
              const cardContent = (
                <article className={getCardClassName(item)} data-status={visualStatus}>
                  <div className="tracks-topic-card-head">
                    <div className={`tracks-topic-id-badge ${getIdToneClass(item)}`}>{item.code}</div>
                    <span className={`tracks-topic-status ${getStatusClass(item)}`}>
                      {getStatusLabel(item)}
                    </span>
                  </div>

                  <h4 className="tracks-topic-name">{item.title}</h4>
                  <p className="tracks-topic-sub">{item.summary}</p>

                  <div className="tracks-topic-meta">
                    <span className="tracks-meta-pill">
                      {item.code === 'F6' ? `${item.estimatedModules} módulos` : `~${item.estimatedModules} módulos`}
                    </span>
                    <span className="tracks-meta-pill">~{formatHours(item.estimatedHours)}</span>
                    {LEVEL_BY_CODE[item.code] ? (
                      <span className="tracks-meta-pill">{LEVEL_BY_CODE[item.code]}</span>
                    ) : null}
                    {item.free ? (
                      <span className="tracks-meta-pill free">Free ✓</span>
                    ) : null}
                  </div>

                  <div className="tracks-topic-prog">
                    <div
                      className={`tracks-topic-prog-fill ${getProgressToneClass(item)}`}
                      style={{ width: `${item.progressPercent}%` }}
                    />
                  </div>

                  {visualStatus !== 'done' ? <div className="tracks-lock-overlay">🔒</div> : null}
                </article>
              );

              if (item.href && visualStatus === 'done') {
                return (
                  <Link key={item.id} href={item.href} className="tracks-topic-link">
                    {cardContent}
                  </Link>
                );
              }

              return <div key={item.id}>{cardContent}</div>;
            })}
          </div>
        </section>
      ))}

      <section className="tracks-premium-banner">
        <div>
          <p className="tracks-premium-eyebrow">Premium</p>
          <h3 className="tracks-premium-title">Desbloqueie os 24 tópicos restantes</h3>
          <p className="tracks-premium-sub">
            Acesso completo a todas as trilhas, simulado completo e flashcards por R$39/mês
          </p>
        </div>
        <Link href="/premium" className="tracks-premium-cta">
          Assinar Premium →
        </Link>
      </section>
    </div>
  );
}
