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

export function QuestionsPanel() {
  const [year, setYear] = useState('all');
  const [subTopic, setSubTopic] = useState('all');
  const [difficulty, setDifficulty] = useState('all');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [answersMap, setAnswersMap] = useState<Record<string, string>>({});

  const [assessment, setAssessment] = useState<AssessmentPayload | null>(null);
  const [feedback, setFeedback] = useState('Selecione e corrija uma questão.');

  const selectedQuestion = useMemo(
    () => questions.find((question) => question.id === selectedQuestionId) || null,
    [questions, selectedQuestionId]
  );

  const loadQuestions = useCallback(async () => {
    const query = new URLSearchParams();
    if (year !== 'all') query.set('year', year);
    if (subTopic !== 'all') query.set('subTopic', subTopic);
    if (difficulty !== 'all') query.set('difficulty', difficulty);

    const response = await fetch(`/api/questions${query.toString() ? `?${query.toString()}` : ''}`);
    const payload = (await response.json()) as { items: Question[] };

    setQuestions(payload.items || []);
    setSelectedQuestionId(payload.items?.[0]?.id || null);
    setSelectedChoice(null);
  }, [year, subTopic, difficulty]);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  async function submitAnswer() {
    if (!selectedQuestion || !selectedChoice) {
      setFeedback('Selecione uma alternativa antes de corrigir.');
      return;
    }

    const nextAnswers = {
      ...answersMap,
      [selectedQuestion.id]: selectedChoice,
    };

    setAnswersMap(nextAnswers);

    const answers = Object.entries(nextAnswers).map(([questionId, choice]) => ({
      questionId,
      choice,
    }));

    const response = await fetch('/api/assessment/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attemptId: 'frontend-session', answers }),
    });

    const payload = (await response.json()) as AssessmentPayload & { error?: string };
    if (!response.ok) {
      setFeedback(payload.error || 'Falha ao corrigir.');
      return;
    }

    setAssessment(payload);

    const graded = payload.gradedAnswers.find((entry) => entry.questionId === selectedQuestion.id);
    const recommendation = payload.recommendedNextTopics.length > 0
      ? `Revisar: ${payload.recommendedNextTopics.map((topic) => TOPIC_LABELS[topic] || topic).join(', ')}.`
      : 'Sem lacunas críticas no momento.';

    if (!graded || graded.status === 'not_found') {
      setFeedback('Não foi possível corrigir esta questão.');
      return;
    }

    setFeedback(
      `${graded.correct ? 'Resposta correta.' : 'Resposta incorreta.'} ` +
      `Gabarito: ${graded.answerKey}. ` +
      `${graded.explanation || ''} ${recommendation}`
    );
  }

  return (
    <div className="space-y-5">
      <section className="section-card">
        <h2 className="text-xl font-bold">Questões estilo POSCOMP</h2>
        <p className="mt-1 text-sm text-slate-600">Filtros por ano, subtópico e dificuldade com correção explicativa.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-500" htmlFor="year-filter">Ano</label>
            <select id="year-filter" value={year} onChange={(event) => setYear(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-2">
              <option value="all">Todos</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-slate-500" htmlFor="topic-filter">Subtópico</label>
            <select id="topic-filter" value={subTopic} onChange={(event) => setSubTopic(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-2">
              <option value="all">Todos</option>
              <option value="afd_modelagem_execucao">AFD modelagem e execução</option>
              <option value="minimizacao_afd">Minimização de AFD</option>
              <option value="afn_epsilon">AFN com ε</option>
              <option value="conversao_afn_afd">Conversão AFN→AFD</option>
            </select>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-slate-500" htmlFor="difficulty-filter">Dificuldade</label>
            <select id="difficulty-filter" value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-2">
              <option value="all">Todas</option>
              <option value="easy">Fácil</option>
              <option value="medium">Média</option>
              <option value="hard">Difícil</option>
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="section-card">
          <h3 className="font-semibold">Lista</h3>
          <div className="mt-3 grid gap-2">
            {questions.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma questão encontrada para os filtros atuais.</p>
            ) : (
              questions.map((question) => (
                <button
                  key={question.id}
                  type="button"
                  className={`question-item ${selectedQuestionId === question.id ? 'is-active' : ''}`}
                  onClick={() => {
                    setSelectedQuestionId(question.id);
                    setSelectedChoice(null);
                  }}
                >
                  <strong className="block text-sm">{question.year} · Questão {question.number}</strong>
                  <p className="mt-1 text-xs text-slate-600">{TOPIC_LABELS[question.subTopic] || question.subTopic}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-indigo-800">{DIFFICULTY_LABELS[question.difficulty] || question.difficulty}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">{question.source}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </article>

        <article className="section-card">
          <h3 className="font-semibold">Questão</h3>
          {!selectedQuestion ? (
            <p className="mt-3 text-sm text-slate-500">Selecione uma questão.</p>
          ) : (
            <div className="mt-3">
              <p className="font-semibold">{selectedQuestion.year} · Questão {selectedQuestion.number}</p>
              <p className="mt-2 text-sm text-slate-700">{selectedQuestion.stem}</p>

              <div className="mt-3 grid gap-2">
                {selectedQuestion.options.map((option) => (
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

              <div className="mt-3">
                <button type="button" className="button primary" onClick={() => void submitAnswer()}>
                  Corrigir resposta
                </button>
              </div>
            </div>
          )}
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="section-card">
          <h3 className="font-semibold">Feedback</h3>
          <div className="callout mt-3">{feedback}</div>
        </article>

        <article className="section-card">
          <h3 className="font-semibold">Métricas por subtópico</h3>
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
        </article>
      </section>
    </div>
  );
}
