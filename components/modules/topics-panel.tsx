'use client';

import { useEffect, useMemo, useState } from 'react';

import type { QuickCheckItem, Question, Topic, TopicProgress } from '@/lib/types';

interface TopicsPanelProps {
  userId?: string;
}

interface TopicsResponse {
  items: Topic[];
}

interface QuestionsResponse {
  items: Question[];
  total: number;
}

type QuickCheckFeedback =
  | { tone: 'success' | 'error'; message: string }
  | null;

export function TopicsPanel({ userId }: TopicsPanelProps) {
  const [macroArea, setMacroArea] = useState('fundamentos');
  const [subTopic, setSubTopic] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [incidence, setIncidence] = useState('all');

  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const [quickChecks, setQuickChecks] = useState<QuickCheckItem[]>([]);
  const [selectedQuickAnswer, setSelectedQuickAnswer] = useState<string | null>(null);
  const [quickFeedback, setQuickFeedback] = useState<QuickCheckFeedback>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [topicProgress, setTopicProgress] = useState<TopicProgress | null>(null);

  const [relatedQuestions, setRelatedQuestions] = useState<Question[]>([]);

  const activeQuickCheck = quickChecks[0] ?? null;
  const essentialSection = useMemo(
    () => selectedTopic?.sections.find((section) => section.kind === 'essential') ?? null,
    [selectedTopic]
  );
  const advancedSections = useMemo(
    () => selectedTopic?.sections.filter((section) => section.kind === 'advanced') ?? [],
    [selectedTopic]
  );

  useEffect(() => {
    async function loadTopics() {
      const query = new URLSearchParams();
      if (macroArea !== 'all') query.set('macroArea', macroArea);
      if (subTopic !== 'all') query.set('subTopic', subTopic);
      if (difficulty !== 'all') query.set('difficulty', difficulty);
      if (incidence !== 'all') query.set('incidence', incidence);
      query.set('limit', '100');

      const response = await fetch(`/api/content/topics?${query.toString()}`);
      const payload = (await response.json()) as TopicsResponse;
      setTopics(Array.isArray(payload.items) ? payload.items : []);
    }

    void loadTopics();
  }, [macroArea, subTopic, difficulty, incidence]);

  useEffect(() => {
    if (!selectedSlug) {
      setSelectedTopic(null);
      setQuickChecks([]);
      setRelatedQuestions([]);
      setQuickFeedback(null);
      setSaveFeedback(null);
      setSelectedQuickAnswer(null);
      return;
    }

    async function loadTopicDetails() {
      const [topicResponse, quickCheckResponse] = await Promise.all([
        fetch(`/api/content/topics/${selectedSlug}`),
        fetch(`/api/content/topics/${selectedSlug}/quick-check`),
      ]);

      if (!topicResponse.ok) {
        setSelectedTopic(null);
        return;
      }

      const topicPayload = (await topicResponse.json()) as Topic;
      setSelectedTopic(topicPayload);

      if (quickCheckResponse.ok) {
        const quickPayload = (await quickCheckResponse.json()) as { items: QuickCheckItem[] };
        setQuickChecks(Array.isArray(quickPayload.items) ? quickPayload.items : []);
      } else {
        setQuickChecks([]);
      }

      const relatedResponse = await fetch(
        `/api/questions?macroArea=fundamentos&subTopic=${encodeURIComponent(topicPayload.subTopic)}&limit=5`
      );

      if (relatedResponse.ok) {
        const relatedPayload = (await relatedResponse.json()) as QuestionsResponse;
        setRelatedQuestions(Array.isArray(relatedPayload.items) ? relatedPayload.items : []);
      } else {
        setRelatedQuestions([]);
      }

      if (userId) {
        const progressResponse = await fetch(
          `/api/content/topics/${selectedSlug}/progress?userId=${encodeURIComponent(userId)}`
        );
        if (progressResponse.ok) {
          const progressPayload = (await progressResponse.json()) as TopicProgress;
          setTopicProgress(progressPayload);
        } else {
          setTopicProgress(null);
        }
      } else {
        setTopicProgress(null);
      }
    }

    void loadTopicDetails();
  }, [selectedSlug, userId]);

  function submitQuickCheck() {
    if (!activeQuickCheck || !selectedQuickAnswer) {
      setQuickFeedback({ tone: 'error', message: 'Selecione uma alternativa antes de corrigir.' });
      return;
    }

    const isCorrect = selectedQuickAnswer === activeQuickCheck.answerKey;
    setQuickFeedback({
      tone: isCorrect ? 'success' : 'error',
      message: activeQuickCheck.explanation,
    });
  }

  async function saveProgress() {
    if (!selectedTopic) return;

    if (!userId) {
      setSaveFeedback('Faça login para persistir progresso entre sessões.');
      return;
    }

    const isCorrect = activeQuickCheck ? selectedQuickAnswer === activeQuickCheck.answerKey : false;
    const response = await fetch(`/api/content/topics/${selectedTopic.slug}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        status: isCorrect ? 'completed' : 'in_progress',
        score: isCorrect ? 1 : 0,
      }),
    });

    if (!response.ok) {
      setSaveFeedback('Não foi possível salvar progresso.');
      return;
    }

    const payload = (await response.json()) as TopicProgress;
    setTopicProgress(payload);
    setSaveFeedback('Progresso salvo com sucesso.');
  }

  return (
    <div className="space-y-5">
      <section className="section-card topics-catalog-card">
        <h2 className="text-xl font-bold">Catálogo de tópicos de estudo</h2>
        <p className="mt-1 text-sm text-slate-600">
          Material didático em duas camadas, com exemplos resolvidos e aplicação prática.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-500" htmlFor="topics-macroarea">
              Macroárea
            </label>
            <select
              id="topics-macroarea"
              className="mt-1 w-full rounded-xl border border-slate-300 p-2"
              value={macroArea}
              onChange={(event) => setMacroArea(event.target.value)}
            >
              <option value="fundamentos">Fundamentos</option>
              <option value="matematica">Matemática</option>
              <option value="tecnologia">Tecnologia</option>
              <option value="all">Todas</option>
            </select>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-slate-500" htmlFor="topics-subtopic">
              Subtópico
            </label>
            <select
              id="topics-subtopic"
              className="mt-1 w-full rounded-xl border border-slate-300 p-2"
              value={subTopic}
              onChange={(event) => setSubTopic(event.target.value)}
            >
              <option value="all">Todos</option>
              <option value="fundamentos_geral">Fundamentos geral</option>
              <option value="afd_modelagem_execucao">AFD modelagem e execução</option>
              <option value="minimizacao_afd">Minimização de AFD</option>
              <option value="afn_epsilon">AFN com ε</option>
              <option value="conversao_afn_afd">Conversão AFN→AFD</option>
            </select>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-slate-500" htmlFor="topics-difficulty">
              Dificuldade
            </label>
            <select
              id="topics-difficulty"
              className="mt-1 w-full rounded-xl border border-slate-300 p-2"
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value)}
            >
              <option value="all">Todas</option>
              <option value="easy">Fácil</option>
              <option value="medium">Média</option>
              <option value="hard">Difícil</option>
            </select>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-slate-500" htmlFor="topics-incidence">
              Incidência
            </label>
            <select
              id="topics-incidence"
              className="mt-1 w-full rounded-xl border border-slate-300 p-2"
              value={incidence}
              onChange={(event) => setIncidence(event.target.value)}
            >
              <option value="all">Todas</option>
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {topics.map((topic) => (
            <article key={topic.id} className="panel">
              <h3 className="text-base font-semibold">{topic.title}</h3>
              <p className="mt-2 text-sm text-slate-700">
                {topic.learningObjectives[0] || 'Tópico sem objetivo cadastrado.'}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Incidência: {topic.incidence} · Dificuldade: {topic.difficulty} · {topic.estimatedMinutes} min
              </p>
              <div className="mt-3">
                <button
                  type="button"
                  className="sim-action-btn sim-action-btn-secondary"
                  onClick={() => setSelectedSlug(topic.slug)}
                >
                  Abrir tópico
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {selectedTopic ? (
        <section className="section-card topics-detail-card">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">{selectedTopic.title}</h2>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
              {selectedTopic.estimatedMinutes} min
            </span>
          </header>
          {topicProgress ? (
            <p className="mt-2 text-xs text-slate-500">
              Progresso atual: {topicProgress.status} ·
              {topicProgress.score === null ? ' sem pontuação' : ` score ${Math.round(topicProgress.score * 100)}%`}
            </p>
          ) : null}

          {essentialSection ? (
            <article className="sim-details mt-4">
              <h3 className="text-sm font-semibold">{essentialSection.title}</h3>
              <p className="mt-2 text-sm text-slate-700">{essentialSection.content}</p>
            </article>
          ) : null}

          {advancedSections.map((section) => (
            <details key={section.id} className="sim-details mt-3">
              <summary>{section.title}</summary>
              <p className="mt-2 text-sm text-slate-700">{section.content}</p>
            </details>
          ))}

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {selectedTopic.examples.map((example) => (
              <article key={example.id} className="panel">
                <h3 className="text-sm font-semibold">{example.title}</h3>
                <p className="mt-2 text-sm"><strong>Problema:</strong> {example.problem}</p>
                <p className="mt-1 text-sm"><strong>Estratégia:</strong> {example.strategy}</p>
                <p className="mt-1 text-sm"><strong>Solução:</strong> {example.solution}</p>
                <p className="mt-1 text-sm text-slate-600"><strong>Resumo:</strong> {example.takeaway}</p>
              </article>
            ))}
          </div>

          {selectedTopic.applications.map((application) => (
            <article key={application.id} className="panel mt-3">
              <h3 className="text-sm font-semibold">{application.title}</h3>
              <p className="mt-2 text-sm"><strong>Contexto:</strong> {application.context}</p>
              <p className="mt-1 text-sm"><strong>Aplicação:</strong> {application.howItApplies}</p>
            </article>
          ))}

          <article className="panel mt-3">
            <h3 className="text-sm font-semibold">Referências</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
              {selectedTopic.references.map((reference) => (
                <li key={reference.id}>
                  <a className="text-blue-700 underline" href={reference.url} target="_blank" rel="noreferrer">
                    {reference.label}
                  </a>
                </li>
              ))}
            </ul>
          </article>

          {activeQuickCheck ? (
            <article className="panel mt-3">
              <h3 className="text-sm font-semibold">Quick-check</h3>
              <p className="mt-2 text-sm">{activeQuickCheck.prompt}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {activeQuickCheck.options.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className={`sim-action-btn ${
                      selectedQuickAnswer === option.key ? 'sim-action-btn-secondary' : 'sim-action-btn-tertiary'
                    }`}
                    onClick={() => setSelectedQuickAnswer(option.key)}
                  >
                    {option.key}) {option.text}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="sim-action-btn sim-action-btn-primary"
                  onClick={submitQuickCheck}
                >
                  Corrigir quick-check
                </button>
                <button
                  type="button"
                  className="sim-action-btn sim-action-btn-tertiary"
                  onClick={() => void saveProgress()}
                >
                  Salvar progresso
                </button>
              </div>

              {quickFeedback ? (
                <div className={`exercise-inline-feedback mt-3 ${quickFeedback.tone === 'success' ? 'is-success' : 'is-error'}`}>
                  <p>{quickFeedback.message}</p>
                </div>
              ) : null}

              {saveFeedback ? (
                <p className="mt-2 text-sm text-slate-700">{saveFeedback}</p>
              ) : null}
            </article>
          ) : null}

          <article className="panel mt-3">
            <h3 className="text-sm font-semibold">Questões relacionadas</h3>
            {relatedQuestions.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Sem questões relacionadas para este subtópico.</p>
            ) : (
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                {relatedQuestions.map((question) => (
                  <li key={question.id}>
                    {question.year} · Questão {question.number} · {question.stem}
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>
      ) : null}
    </div>
  );
}
