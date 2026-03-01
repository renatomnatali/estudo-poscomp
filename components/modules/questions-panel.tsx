'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Question } from '@/lib/types';

const TOPIC_LABELS: Record<string, string> = {
  afd_modelagem_execucao: 'AFD modelagem e execução',
  minimizacao_afd: 'Minimização de AFD',
  afn_epsilon: 'AFN com ε',
  conversao_afn_afd: 'Conversão AFN→AFD',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Fácil',
  medium: 'Média',
  hard: 'Difícil',
};

interface AssessmentPayload {
  score: { total: number; correct: number; accuracy: number };
  byTopic: Record<string, { answered: number; correct: number; accuracy: number; status: string }>;
  recommendedNextTopics: string[];
  recommendedActivities: Array<{ subTopic: string; activities: string[] }>;
  gradedAnswers: Array<{
    questionId: string;
    status?: 'not_found';
    subTopic?: string;
    choice?: string;
    answerKey?: string;
    correct?: boolean;
    explanation?: string;
  }>;
}

interface QuestionFeedback {
  tone: 'success' | 'error' | 'info';
  message: string;
  suggestion?: string;
}

function normalizeFeedbackMessage(rawMessage: string | undefined): string {
  const source = (rawMessage || '').trim();
  if (!source) return 'Sem explicação adicional cadastrada.';

  const compact = source
    .replace(/\bResposta\s+(?:correta|incorreta)\.?\s*/gi, '')
    .replace(/\bGabarito\s+oficial:\s*[A-E*]\.?\s*/gi, '')
    .replace(/\n{2,}/g, '\n')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return compact || 'Sem explicação adicional cadastrada.';
}

export function QuestionsPanel() {
  const [year, setYear] = useState('all');
  const [subTopic, setSubTopic] = useState('all');
  const [difficulty, setDifficulty] = useState('all');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [answersMap, setAnswersMap] = useState<Record<string, string>>({});
  const [feedbackByQuestion, setFeedbackByQuestion] = useState<Record<string, QuestionFeedback>>({});

  const [assessment, setAssessment] = useState<AssessmentPayload | null>(null);

  const currentQuestion = useMemo(() => questions[currentIndex] || null, [questions, currentIndex]);

  const answeredCount = useMemo(() => {
    const ids = new Set(questions.map((question) => question.id));
    return Object.keys(answersMap).filter((id) => ids.has(id)).length;
  }, [answersMap, questions]);

  const progressCorrectCount = assessment?.score.correct ?? 0;
  const progressRatio = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  const loadQuestions = useCallback(async () => {
    const query = new URLSearchParams();
    if (year !== 'all') query.set('year', year);
    if (subTopic !== 'all') query.set('subTopic', subTopic);
    if (difficulty !== 'all') query.set('difficulty', difficulty);

    const response = await fetch(`/api/questions${query.toString() ? `?${query.toString()}` : ''}`);
    const payload = (await response.json()) as { items: Question[] };

    const nextQuestions = payload.items || [];

    setQuestions(nextQuestions);
    setCurrentIndex(0);
    setSelectedChoice(null);
  }, [year, subTopic, difficulty]);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  useEffect(() => {
    if (!currentQuestion) {
      setSelectedChoice(null);
      return;
    }

    setSelectedChoice(answersMap[currentQuestion.id] || null);
  }, [currentQuestion, answersMap]);

  function setQuestionFeedback(questionId: string, value: QuestionFeedback) {
    setFeedbackByQuestion((previous) => ({
      ...previous,
      [questionId]: value,
    }));
  }

  async function submitAnswer() {
    if (!currentQuestion) return;

    if (!selectedChoice) {
      setQuestionFeedback(currentQuestion.id, {
        tone: 'info',
        message: 'Selecione uma alternativa antes de corrigir.',
      });
      return;
    }

    const nextAnswers = {
      ...answersMap,
      [currentQuestion.id]: selectedChoice,
    };

    setAnswersMap(nextAnswers);

    const answers = Object.entries(nextAnswers).map(([questionId, choice]) => ({ questionId, choice }));

    const response = await fetch('/api/assessment/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attemptId: 'frontend-session', answers }),
    });

    const payload = (await response.json()) as AssessmentPayload & { error?: string };
    if (!response.ok) {
      setQuestionFeedback(currentQuestion.id, {
        tone: 'error',
        message: payload.error || 'Falha ao corrigir.',
      });
      return;
    }

    setAssessment(payload);

    const graded = payload.gradedAnswers.find((entry) => entry.questionId === currentQuestion.id);

    if (!graded || graded.status === 'not_found') {
      setQuestionFeedback(currentQuestion.id, {
        tone: 'error',
        message: 'Não foi possível corrigir esta questão.',
      });
      return;
    }

    const recommendedTopic = payload.recommendedNextTopics.find(
      (topic) => topic === graded.subTopic
    ) || payload.recommendedNextTopics[0];

    setQuestionFeedback(currentQuestion.id, {
      tone: graded.correct ? 'success' : 'error',
      message: normalizeFeedbackMessage(graded.explanation),
      suggestion: recommendedTopic
        ? `Revisão sugerida: ${TOPIC_LABELS[recommendedTopic] || recommendedTopic}. Abra Flashcards no menu para reforço.`
        : undefined,
    });
  }

  function goPrevious() {
    if (currentIndex <= 0) return;
    setCurrentIndex((value) => value - 1);
  }

  function goNext() {
    if (currentIndex >= questions.length - 1) return;
    setCurrentIndex((value) => value + 1);
  }

  const currentFeedback = currentQuestion ? feedbackByQuestion[currentQuestion.id] : null;
  const feedbackToneClass = currentFeedback
    ? (currentFeedback.tone === 'success'
      ? 'is-success'
      : currentFeedback.tone === 'error'
        ? 'is-error'
        : 'is-info')
    : '';

  return (
    <div className="space-y-5">
      <section className="section-card questions-session-card" data-testid="questions-session-card">
        <header>
          <h2 className="text-xl font-bold">Sessão de questões POSCOMP</h2>
          <p className="mt-1 text-sm text-slate-600">
            Filtros e resolução no mesmo bloco para reduzir rolagem e manter foco na questão atual.
          </p>
        </header>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-500" htmlFor="year-filter">Ano</label>
            <select
              id="year-filter"
              value={year}
              onChange={(event) => setYear(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 p-2"
            >
              <option value="all">Todos</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-slate-500" htmlFor="topic-filter">Subtópico</label>
            <select
              id="topic-filter"
              value={subTopic}
              onChange={(event) => setSubTopic(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 p-2"
            >
              <option value="all">Todos</option>
              <option value="afd_modelagem_execucao">AFD modelagem e execução</option>
              <option value="minimizacao_afd">Minimização de AFD</option>
              <option value="afn_epsilon">AFN com ε</option>
              <option value="conversao_afn_afd">Conversão AFN→AFD</option>
            </select>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-slate-500" htmlFor="difficulty-filter">Dificuldade</label>
            <select
              id="difficulty-filter"
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 p-2"
            >
              <option value="all">Todas</option>
              <option value="easy">Fácil</option>
              <option value="medium">Média</option>
              <option value="hard">Difícil</option>
            </select>
          </div>
        </div>

        <div className="exercise-progress-wrap mt-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <strong>{questions.length > 0 ? `Questão ${currentIndex + 1} de ${questions.length}` : 'Sem questões para os filtros'}</strong>
            <span>{`Respondidas: ${answeredCount} · Corretas: ${progressCorrectCount}`}</span>
          </div>
          <div className="progress-track mt-2">
            <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, progressRatio))}%` }}></div>
          </div>
        </div>

        <article className="exercise-question-runner mt-4" data-testid="exercise-question-runner">
          {!currentQuestion ? (
            <p className="text-sm text-slate-500">Nenhuma questão encontrada para os filtros atuais.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <strong>{currentQuestion.year} · Questão {currentQuestion.number}</strong>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                  {TOPIC_LABELS[currentQuestion.subTopic] || currentQuestion.subTopic}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-700">{currentQuestion.stem}</p>

              <div className="mt-3 grid gap-2">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedChoice(option.key)}
                    className={`option-btn ${selectedChoice === option.key ? 'is-selected' : ''}`}
                  >
                    <strong>{option.key})</strong> {option.text}
                  </button>
                ))}
              </div>

            </>
          )}
        </article>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="sim-action-btn sim-action-btn-tertiary"
            onClick={goPrevious}
            disabled={currentIndex === 0 || !currentQuestion}
          >
            Anterior
          </button>
          <button
            type="button"
            className="sim-action-btn sim-action-btn-primary"
            onClick={() => void submitAnswer()}
            disabled={!currentQuestion}
          >
            Corrigir resposta
          </button>
          <button
            type="button"
            className="sim-action-btn sim-action-btn-tertiary"
            onClick={goNext}
            disabled={!currentQuestion || currentIndex >= questions.length - 1}
          >
            Próxima
          </button>
        </div>

        {currentFeedback ? (
          <div
            className={`exercise-inline-feedback mt-3 ${feedbackToneClass}`}
            data-testid="exercise-feedback"
          >
            <p>{currentFeedback.message}</p>
            {currentFeedback.suggestion ? (
              <p className="mt-1 text-xs font-medium">{currentFeedback.suggestion}</p>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="section-card">
        <h3 className="font-semibold">Desempenho da sessão</h3>

        <details className="sim-details mt-3">
          <summary>Métricas por subtópico</summary>
          <div className="mt-3 overflow-x-auto">
            <table className="delta-table">
              <thead>
                <tr><th>Subtópico</th><th>Respondidas</th><th>Acurácia</th><th>Status</th></tr>
              </thead>
              <tbody>
                {!assessment || Object.keys(assessment.byTopic).length === 0 ? (
                  <tr><td colSpan={4}>Sem dados ainda</td></tr>
                ) : (
                  Object.entries(assessment.byTopic).map(([topic, item]) => (
                    <tr key={topic}>
                      <td>{TOPIC_LABELS[topic] || topic}</td>
                      <td>{item.answered}</td>
                      <td>{Math.round(item.accuracy * 100)}%</td>
                      <td>{item.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </details>

        <details className="sim-details mt-3">
          <summary>Atividades de reforço recomendadas</summary>
          {!assessment || assessment.recommendedActivities.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Sem recomendações adicionais no momento.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {assessment.recommendedActivities.map((item) => (
                <article key={item.subTopic} className="partition-step">
                  <strong>{TOPIC_LABELS[item.subTopic] || item.subTopic}</strong>
                  <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                    {item.activities.map((activity) => (
                      <li key={activity}>{activity}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </details>
      </section>
    </div>
  );
}
