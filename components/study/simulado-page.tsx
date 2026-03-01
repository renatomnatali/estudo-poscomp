'use client';

import { useEffect, useMemo, useState } from 'react';

import type { Question, SimuladoConfig } from '@/lib/types';

const MODES: SimuladoConfig[] = [
  { mode: 'partial', questionCount: 20, minutes: 45, premium: false },
  { mode: 'full', questionCount: 70, minutes: 240, premium: true },
  { mode: 'area', questionCount: 25, minutes: 60, premium: true },
];

interface AssessmentPayload {
  score: { total: number; correct: number; accuracy: number };
  recommendedNextTopics: string[];
}

interface SimuladoHistoryItem {
  date: string;
  accuracy: number;
  correct: number;
  total: number;
}

export function SimuladoPage() {
  const [selectedMode, setSelectedMode] = useState<SimuladoConfig>(MODES[0]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AssessmentPayload | null>(null);
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(selectedMode.minutes * 60);
  const [history, setHistory] = useState<SimuladoHistoryItem[]>([]);

  useEffect(() => {
    const raw = window.localStorage.getItem('study:simulado-history');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setHistory(parsed);
    } catch {
      // ignore malformed local history
    }
  }, []);

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
    if (selectedMode.premium) return;

    const response = await fetch(`/api/questions?macroArea=fundamentos&limit=${selectedMode.questionCount}`);
    const payload = (await response.json()) as { items: Question[] };

    setQuestions(Array.isArray(payload.items) ? payload.items.slice(0, selectedMode.questionCount) : []);
    setAnswers({});
    setActiveIndex(0);
    setResult(null);
    setRunning(true);
    setTimeLeft(selectedMode.minutes * 60);
  }

  async function finishSession() {
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

    const nextHistory: SimuladoHistoryItem[] = [
      {
        date: new Date().toISOString(),
        accuracy: payload.score.accuracy,
        correct: payload.score.correct,
        total: payload.score.total,
      },
      ...history,
    ].slice(0, 5);

    setHistory(nextHistory);
    window.localStorage.setItem('study:simulado-history', JSON.stringify(nextHistory));
  }

  return (
    <>
      <section className="section-card">
        <h2 className="text-xl font-bold">Simulado POSCOMP</h2>
        <p className="mt-1 text-sm text-slate-600">70 questões · 4 horas · distribuição fiel ao edital SBC.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {MODES.map((mode) => (
            <button
              key={mode.mode}
              type="button"
              className={`rounded-xl border p-4 text-left ${selectedMode.mode === mode.mode ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white'}`}
              onClick={() => setSelectedMode(mode)}
            >
              <strong className="block text-sm text-slate-900">
                {mode.mode === 'partial' ? 'Simulado Parcial' : mode.mode === 'full' ? 'Simulado Completo' : 'Simulado por Área'}
              </strong>
              <span className="mt-1 block text-xs text-slate-600">
                {mode.questionCount} questões · {mode.minutes} min {mode.premium ? '· Premium' : '· Free'}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            className="sim-action-btn sim-action-btn-primary"
            onClick={() => void startSession()}
            disabled={selectedMode.premium}
          >
            Iniciar simulado
          </button>
          {running ? (
            <button type="button" className="sim-action-btn sim-action-btn-secondary" onClick={() => void finishSession()}>
              Encerrar e corrigir
            </button>
          ) : null}
          <span className="text-sm text-slate-600">Timer: {timerLabel}</span>
        </div>
      </section>

      {running && activeQuestion ? (
        <section className="section-card">
          <h3 className="text-base font-semibold">Questão {activeIndex + 1} de {questions.length}</h3>
          <p className="mt-2 text-sm text-slate-700">{activeQuestion.stem}</p>

          <div className="mt-3 grid gap-2">
            {activeQuestion.options.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`option-btn ${answers[activeQuestion.id] === option.key ? 'is-selected' : ''}`}
                onClick={() => setAnswers((prev) => ({ ...prev, [activeQuestion.id]: option.key }))}
              >
                <strong>{option.key})</strong> {option.text}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
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
        </section>
      ) : null}

      {result ? (
        <section className="section-card">
          <h3 className="text-base font-semibold">Desempenho da sessão</h3>
          <p className="mt-2 text-sm text-slate-700">
            Acertos: {result.score.correct}/{result.score.total} · Acurácia: {Math.round(result.score.accuracy * 100)}%
          </p>
          <p className="mt-2 text-sm text-slate-700">
            Revisões sugeridas: {result.recommendedNextTopics.length > 0 ? result.recommendedNextTopics.join(', ') : 'Nenhuma no momento.'}
          </p>
        </section>
      ) : null}

      <section className="section-card">
        <h3 className="text-base font-semibold">Histórico recente</h3>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Sem simulados concluídos ainda.</p>
        ) : (
          <div className="mt-3 grid gap-2">
            {history.map((item, index) => (
              <article key={`${item.date}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                <strong className="text-slate-900">{new Date(item.date).toLocaleString('pt-BR')}</strong>
                <p className="text-slate-600">
                  {item.correct}/{item.total} · {Math.round(item.accuracy * 100)}%
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
