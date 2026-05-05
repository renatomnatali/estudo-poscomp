'use client';

import { useEffect, useMemo, useState } from 'react';

import { isClerkEnabledClient } from '@/lib/auth-config';
import type { Question, SimuladoAttempt, SimuladoConfig } from '@/lib/types';

const MODES: SimuladoConfig[] = [
  { mode: 'partial', questionCount: 20, minutes: 45, premium: false },
  { mode: 'full', questionCount: 70, minutes: 240, premium: true },
  { mode: 'area', questionCount: 25, minutes: 60, premium: true },
];

interface AssessmentPayload {
  score: { total: number; correct: number; accuracy: number };
  recommendedNextTopics: string[];
}

interface SimuladoPageProps {
  userId?: string;
  userEmail?: string;
  isPremiumUser?: boolean;
}

function formatAttemptDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR');
}

function formatDuration(seconds: number | null) {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return '—';
  const mins = Math.floor(seconds / 60);
  return `${mins} min`;
}

export function SimuladoPage({ userId, userEmail, isPremiumUser = false }: SimuladoPageProps) {
  const [selectedMode, setSelectedMode] = useState<SimuladoConfig>(MODES[0]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AssessmentPayload | null>(null);
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(selectedMode.minutes * 60);
  const [history, setHistory] = useState<SimuladoAttempt[]>([]);
  const [sessionError, setSessionError] = useState<string | null>(null);

  async function loadHistory() {
    const query = !isClerkEnabledClient() && userId ? `?userId=${encodeURIComponent(userId)}&limit=5` : '?limit=5';
    const response = await fetch(`/api/simulado/attempts${query}`, {
      cache: 'no-store',
      headers: {
        ...(userId ? { 'x-user-id': userId } : {}),
        ...(userEmail ? { 'x-user-email': userEmail } : {}),
      },
    });
    if (!response.ok) return;

    const payload = (await response.json()) as { items?: SimuladoAttempt[] };
    setHistory(Array.isArray(payload.items) ? payload.items : []);
  }

  useEffect(() => {
    void loadHistory();
    // userId altera contexto de sessão em dev sem Clerk
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (!running) return;

    const timer = window.setInterval(() => {
      setTimeLeft((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running]);

  const activeQuestion = questions[activeIndex] ?? null;

  const timerLabel = useMemo(() => {
    const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const secs = Math.floor(timeLeft % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }, [timeLeft]);

  async function startSession() {
    if (selectedMode.premium && !isPremiumUser) return;
    setSessionError(null);

    const response = await fetch('/api/simulado/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(userId ? { 'x-user-id': userId } : {}),
        ...(userEmail ? { 'x-user-email': userEmail } : {}),
      },
      body: JSON.stringify({
        mode: selectedMode.mode,
        userId,
        email: userEmail,
        macroArea: 'fundamentos',
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setSessionError(payload?.error || 'Não foi possível iniciar o simulado.');
      return;
    }

    const payload = (await response.json()) as { items: Question[] };

    setQuestions(Array.isArray(payload.items) ? payload.items.slice(0, selectedMode.questionCount) : []);
    setAnswers({});
    setActiveIndex(0);
    setResult(null);
    setRunning(true);
    setTimeLeft(selectedMode.minutes * 60);
  }

  async function finishSession() {
    const startedDurationSeconds = selectedMode.minutes * 60;
    const elapsedSeconds = Math.max(0, startedDurationSeconds - timeLeft);

    const response = await fetch('/api/assessment/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attemptId: `simulado-${Date.now()}`,
        answers: Object.entries(answers).map(([questionId, choice]) => ({ questionId, choice })),
      }),
    });

    const payload = (await response.json()) as AssessmentPayload;
    setResult(payload);
    setRunning(false);

    await fetch('/api/simulado/attempts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(userId ? { 'x-user-id': userId } : {}),
        ...(userEmail ? { 'x-user-email': userEmail } : {}),
      },
      body: JSON.stringify({
        userId,
        email: userEmail,
        mode: selectedMode.mode,
        total: payload.score.total,
        correct: payload.score.correct,
        accuracy: payload.score.accuracy,
        durationSeconds: elapsedSeconds,
        recommendedNextTopics: payload.recommendedNextTopics,
      }),
    }).catch(() => null);

    await loadHistory();
  }

  const isTimerWarning = running && timeLeft <= 5 * 60;

  function modeDetails(mode: SimuladoConfig) {
    if (mode.mode === 'partial') {
      return {
        icon: '📝',
        name: 'Simulado Parcial',
        desc: `${mode.questionCount} questões em ${mode.minutes} min — calibração rápida.`,
      };
    }
    if (mode.mode === 'full') {
      return {
        icon: '⏱️',
        name: 'Simulado Completo',
        desc: `${mode.questionCount} questões cronometradas em ${Math.round(mode.minutes / 60)} h — distribuição fiel ao edital.`,
      };
    }
    return {
      icon: '🎯',
      name: 'Simulado por Área',
      desc: `${mode.questionCount} questões em ${mode.minutes} min — foco em uma macro-área.`,
    };
  }

  function attemptScoreTone(accuracy: number) {
    if (accuracy >= 0.7) return 'tone-em';
    if (accuracy >= 0.4) return 'tone-sap';
    return 'tone-coral';
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">Simulado POSCOMP</h2>
          <p className="page-sub">70 questões · 4 horas · distribuição fiel ao edital SBC.</p>
        </div>
      </div>

      <section className="section-card">
        <p className="eyebrow" style={{ marginBottom: '0.8rem' }}>
          Escolha a modalidade
        </p>
        <div className="sim-grid">
          {MODES.map((mode) => {
            const detail = modeDetails(mode);
            const locked = mode.premium && !isPremiumUser;
            const isSelected = selectedMode.mode === mode.mode;
            return (
              <button
                key={mode.mode}
                type="button"
                className={`sim-option ${isSelected ? 'selected' : ''} ${locked ? 'locked' : ''}`}
                onClick={() => {
                  if (locked) return;
                  setSelectedMode(mode);
                }}
                aria-pressed={isSelected}
                aria-disabled={locked}
              >
                {locked ? <span className="sim-lock-badge">Premium</span> : null}
                <span className="sim-icon" aria-hidden="true">
                  {detail.icon}
                </span>
                <div className="sim-name">{detail.name}</div>
                <p className="sim-desc">{detail.desc}</p>
                <div className="sim-pills">
                  <span className="sim-pill">{mode.questionCount}q</span>
                  <span className="sim-pill">{mode.minutes} min</span>
                  <span className="sim-pill">{mode.premium ? 'Premium' : 'Free'}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="sim-action-row" style={{ marginTop: '1.1rem' }}>
          <button
            type="button"
            className="sim-action-btn sim-action-btn-primary"
            onClick={() => void startSession()}
            disabled={selectedMode.premium && !isPremiumUser}
          >
            Iniciar simulado
          </button>
          {running ? (
            <button
              type="button"
              className="sim-action-btn sim-action-btn-secondary"
              onClick={() => void finishSession()}
            >
              Encerrar e corrigir
            </button>
          ) : null}
          {running ? (
            <span className={`simulado-timer ${isTimerWarning ? 'is-warning' : ''}`}>⏱ {timerLabel}</span>
          ) : null}
        </div>
        {sessionError ? (
          <p
            style={{
              marginTop: '0.8rem',
              fontSize: '0.85rem',
              color: 'var(--coral)',
            }}
          >
            {sessionError}
          </p>
        ) : null}
      </section>

      {running && activeQuestion ? (
        <article className="sim-active-card">
          <div className="sim-progress-bar">
            <div
              className="sim-progress-fill"
              style={{ width: `${((activeIndex + 1) / Math.max(1, questions.length)) * 100}%` }}
            />
          </div>
          <p className="sim-question-num">
            Questão {activeIndex + 1} de {questions.length}
          </p>
          <h3 className="sim-question-text">{activeQuestion.stem}</h3>

          <div className="sim-options-list">
            {activeQuestion.options.map((option) => {
              const selected = answers[activeQuestion.id] === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  className={`sim-option-row ${selected ? 'selected' : ''}`}
                  onClick={() =>
                    setAnswers((prev) => ({ ...prev, [activeQuestion.id]: option.key }))
                  }
                >
                  <strong>{option.key})</strong> {option.text}
                </button>
              );
            })}
          </div>

          <div className="sim-action-row">
            <button
              type="button"
              className="sim-action-btn sim-action-btn-tertiary"
              onClick={() => setActiveIndex((value) => Math.max(0, value - 1))}
              disabled={activeIndex === 0}
            >
              Anterior
            </button>
            <button
              type="button"
              className="sim-action-btn sim-action-btn-tertiary"
              onClick={() => setActiveIndex((value) => Math.min(questions.length - 1, value + 1))}
              disabled={activeIndex >= questions.length - 1}
            >
              Próxima
            </button>
          </div>
        </article>
      ) : null}

      {result ? (
        <section className="section-card">
          <h3 className="page-title" style={{ fontSize: '1.05rem' }}>
            Desempenho da sessão
          </h3>
          <p className="page-sub tabular">
            {result.score.correct}/{result.score.total} · {Math.round(result.score.accuracy * 100)}% — acertos e acurácia
          </p>
          <p className="page-sub" style={{ marginTop: '0.4rem' }}>
            Revisões sugeridas:{' '}
            {result.recommendedNextTopics.length > 0
              ? result.recommendedNextTopics.join(', ')
              : 'Nenhuma no momento.'}
          </p>
        </section>
      ) : null}

      <section className="section-card">
        <p className="eyebrow" style={{ marginBottom: '0.8rem' }}>
          Histórico recente
        </p>
        {history.length === 0 ? (
          <p className="page-sub">Sem simulados concluídos ainda.</p>
        ) : (
          <div>
            {history.map((item, index) => (
              <div key={`${item.id}-${index}`} className="sim-history-row">
                <div className={`sim-history-score ${attemptScoreTone(item.accuracy)}`}>
                  <span className="tabular">{Math.round(item.accuracy * 100)}</span>
                </div>
                <div className="sim-history-info">
                  <p className="sim-history-name">{formatAttemptDate(item.createdAt)}</p>
                  <p className="sim-history-meta">
                    {item.correct}/{item.total} · {formatDuration(item.durationSeconds)}
                  </p>
                </div>
                <div className="sim-history-detail">
                  <p className={`sim-history-pct accent-sap`}>
                    <span className="tabular">{Math.round(item.accuracy * 100)}%</span>
                  </p>
                  <p className="sim-history-time">{item.mode}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
