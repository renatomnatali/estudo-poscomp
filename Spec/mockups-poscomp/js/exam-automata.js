(function () {
  const yearSelect = document.querySelector('[data-qa-year]');
  const subtopicSelect = document.querySelector('[data-qa-subtopic]');
  const difficultySelect = document.querySelector('[data-qa-difficulty]');

  const detailEl = document.querySelector('[data-qa-detail]');
  const metricsEl = document.querySelector('[data-qa-metrics]');
  const activitiesEl = document.querySelector('[data-qa-activities]');
  const progressLabelEl = document.querySelector('[data-qa-progress]');
  const progressMetaEl = document.querySelector('[data-qa-progress-meta]');
  const progressFillEl = document.querySelector('[data-qa-progress-fill]');

  const prevButton = document.querySelector('[data-qa-prev]');
  const nextButton = document.querySelector('[data-qa-next]');
  const correctButton = document.querySelector('[data-qa-correct]');

  if (
    !yearSelect ||
    !subtopicSelect ||
    !difficultySelect ||
    !detailEl ||
    !metricsEl ||
    !activitiesEl ||
    !progressLabelEl ||
    !progressMetaEl ||
    !progressFillEl ||
    !prevButton ||
    !nextButton ||
    !correctButton
  ) {
    return;
  }

  const fallbackDataset = {
    questions: [
      {
        id: 'fallback-1',
        year: 2024,
        source: 'fallback',
        number: 1,
        macroArea: 'fundamentos',
        subTopic: 'afd_modelagem_execucao',
        difficulty: 'medium',
        stem: 'AFD que aceita palavras que terminam com c reconhece qual exemplo?',
        options: [
          { key: 'A', text: 'abca' },
          { key: 'B', text: 'ababc' },
          { key: 'C', text: 'aaaa' },
          { key: 'D', text: 'ε' },
          { key: 'E', text: 'bbb' }
        ],
        answerKey: 'B',
        explanation: 'A palavra precisa terminar com c.',
        optionExplanations: {
          A: 'Termina com a.',
          B: 'Termina com c.',
          C: 'Termina com a.',
          D: 'Não termina com c.',
          E: 'Termina com b.'
        }
      }
    ]
  };

  const subtopicLabels = {
    afd_modelagem_execucao: 'AFD modelagem e execução',
    minimizacao_afd: 'Minimização de AFD',
    afn_epsilon: 'AFN com ε',
    conversao_afn_afd: 'Conversão AFN→AFD',
  };

  const difficultyLabels = {
    easy: 'Fácil',
    medium: 'Média',
    hard: 'Difícil',
  };

  const reinforcement = {
    afd_modelagem_execucao: [
      'Reexecutar 3 simulações passo a passo no módulo de AFD.',
      'Resolver 5 questões focadas em linguagem reconhecida por AFD.'
    ],
    minimizacao_afd: [
      'Refazer o algoritmo de partições em dois exemplos com estados inalcançáveis.',
      'Comparar AFD original e mínimo com palavras de teste.'
    ],
    afn_epsilon: [
      'Calcular ε-fecho de todos os estados em dois AFNs distintos.',
      'Simular manualmente a evolução do conjunto de estados para 3 palavras.'
    ],
    conversao_afn_afd: [
      'Converter um AFN com ε para AFD por construção de subconjuntos.',
      'Validar equivalência AFN/AFD em ao menos 4 palavras.'
    ]
  };

  const state = {
    questions: [],
    filtered: [],
    currentIndex: 0,
    selectedChoice: null,
    answers: {},
    metrics: {},
    evaluations: {},
    feedbackByQuestion: {},
    weakTopics: []
  };

  function sanitizeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function loadDataset() {
    const path = '../../data/questions/automata/poscomp-automata-v1.json';
    return fetch(path)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .catch(() => fallbackDataset);
  }

  function getSubtopicLabel(subTopic) {
    return subtopicLabels[subTopic] || subTopic;
  }

  function getCurrentQuestion() {
    return state.filtered[state.currentIndex] || null;
  }

  function recalculateWeakTopics() {
    state.weakTopics = Object.entries(state.metrics)
      .filter(([, metric]) => metric.answered > 0 && (metric.correct / metric.answered) < 0.7)
      .map(([topic]) => topic);
  }

  function renderProgress() {
    const total = state.filtered.length;
    const current = total > 0 ? state.currentIndex + 1 : 0;

    const filteredIds = new Set(state.filtered.map((question) => question.id));
    const answered = Object.keys(state.answers).filter((id) => filteredIds.has(id)).length;
    const correct = Object.entries(state.evaluations)
      .filter(([id, evaluation]) => filteredIds.has(id) && evaluation.correct)
      .length;

    progressLabelEl.textContent = total > 0 ? `Questão ${current} de ${total}` : 'Sem questões para os filtros';
    progressMetaEl.textContent = `Respondidas: ${answered} · Corretas: ${correct}`;

    const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;
    progressFillEl.style.width = `${percentage}%`;
  }

  function renderMetrics() {
    const topicKeys = Array.from(new Set(state.questions.map((question) => question.subTopic)));
    metricsEl.innerHTML = '';

    topicKeys.forEach((topic) => {
      const metric = state.metrics[topic] || { answered: 0, correct: 0 };
      const accuracy = metric.answered > 0 ? Math.round((metric.correct / metric.answered) * 100) : null;

      let status = 'sem dados';
      if (accuracy !== null) status = accuracy >= 70 ? 'ok' : 'reforçar';

      const row = document.createElement('tr');
      row.innerHTML = [
        `<td>${sanitizeHtml(getSubtopicLabel(topic))}</td>`,
        `<td>${metric.answered}</td>`,
        `<td>${accuracy === null ? '—' : `${accuracy}%`}</td>`,
        `<td>${status}</td>`
      ].join('');

      metricsEl.appendChild(row);
    });
  }

  function renderActivities() {
    if (state.weakTopics.length === 0) {
      activitiesEl.innerHTML = '<p class="page-subtitle" style="margin-top: 0; color: var(--color-ink-500);">Sem lacunas críticas detectadas até o momento.</p>';
      return;
    }

    const blocks = state.weakTopics.map((topic) => {
      const activities = reinforcement[topic] || ['Revisar teoria do subtópico.', 'Resolver questões adicionais do subtópico.'];
      const list = activities.map((item) => `<li>${sanitizeHtml(item)}</li>`).join('');

      return [
        '<article class="partition-step">',
        `<strong>${sanitizeHtml(getSubtopicLabel(topic))}</strong>`,
        `<ul class="list">${list}</ul>`,
        '</article>'
      ].join('');
    }).join('');

    activitiesEl.innerHTML = blocks;
  }

  function renderQuestion() {
    const question = getCurrentQuestion();

    if (!question) {
      detailEl.innerHTML = '<p class="page-subtitle" style="margin-top: 0; color: var(--color-ink-500);">Nenhuma questão encontrada para os filtros atuais.</p>';
      prevButton.disabled = true;
      nextButton.disabled = true;
      correctButton.disabled = true;
      return;
    }

    prevButton.disabled = state.currentIndex === 0;
    nextButton.disabled = state.currentIndex >= state.filtered.length - 1;
    correctButton.disabled = false;

    const selected = state.selectedChoice;
    const feedback = state.feedbackByQuestion[question.id];

    const options = question.options.map((option) => {
      const selectedClass = selected === option.key ? ' is-selected' : '';
      return `<button type="button" class="option-btn${selectedClass}" data-option-key="${option.key}"><strong>${option.key})</strong> ${sanitizeHtml(option.text)}</button>`;
    }).join('');

    detailEl.innerHTML = [
      '<div class="exercise-question-heading">',
      `<strong>${question.year} · Questão ${question.number}</strong>`,
      `<span>${sanitizeHtml(getSubtopicLabel(question.subTopic))} · ${sanitizeHtml(difficultyLabels[question.difficulty] || question.difficulty)}</span>`,
      '</div>',
      `<p>${sanitizeHtml(question.stem)}</p>`,
      `<div class="option-list">${options}</div>`,
      feedback ? [
        '<div class="exercise-feedback">',
        `<p><strong>${feedback.correct ? 'Resposta correta.' : 'Resposta incorreta.'}</strong></p>`,
        `<p>Gabarito oficial: <strong>${feedback.answerKey}</strong>.</p>`,
        `<p>${sanitizeHtml(feedback.explanation)}</p>`,
        '</div>'
      ].join('') : ''
    ].join('');

    detailEl.querySelectorAll('[data-option-key]').forEach((button) => {
      button.addEventListener('click', () => {
        state.selectedChoice = button.getAttribute('data-option-key');
        state.answers[question.id] = state.selectedChoice;
        renderQuestion();
        renderProgress();
      });
    });
  }

  function applyFilters() {
    const year = yearSelect.value;
    const subtopic = subtopicSelect.value;
    const difficulty = difficultySelect.value;

    state.filtered = state.questions.filter((question) => {
      if (year !== 'all' && String(question.year) !== year) return false;
      if (subtopic !== 'all' && question.subTopic !== subtopic) return false;
      if (difficulty !== 'all' && question.difficulty !== difficulty) return false;
      return true;
    });

    state.currentIndex = 0;
    const first = getCurrentQuestion();
    state.selectedChoice = first ? (state.answers[first.id] || null) : null;

    renderQuestion();
    renderProgress();
  }

  function updateMetrics(question, isCorrect) {
    const previous = state.evaluations[question.id];

    if (!state.metrics[question.subTopic]) {
      state.metrics[question.subTopic] = { answered: 0, correct: 0 };
    }

    if (!previous) {
      state.metrics[question.subTopic].answered += 1;
      if (isCorrect) state.metrics[question.subTopic].correct += 1;
    } else if (previous.correct !== isCorrect) {
      state.metrics[question.subTopic].correct += isCorrect ? 1 : -1;
    }

    state.evaluations[question.id] = {
      subTopic: question.subTopic,
      correct: isCorrect
    };

    recalculateWeakTopics();
    renderMetrics();
    renderActivities();
  }

  function evaluateCurrentQuestion() {
    const question = getCurrentQuestion();
    if (!question) return;

    if (!state.selectedChoice) {
      state.feedbackByQuestion[question.id] = {
        correct: false,
        answerKey: question.answerKey,
        explanation: 'Selecione uma alternativa antes de corrigir.'
      };
      renderQuestion();
      return;
    }

    const isCorrect = state.selectedChoice === question.answerKey;
    const explanation =
      (question.optionExplanations && question.optionExplanations[state.selectedChoice]) ||
      question.explanation ||
      'Sem explicação cadastrada.';

    updateMetrics(question, isCorrect);

    state.feedbackByQuestion[question.id] = {
      correct: isCorrect,
      answerKey: question.answerKey,
      explanation
    };

    renderQuestion();
  }

  function goNext() {
    if (state.currentIndex >= state.filtered.length - 1) return;
    state.currentIndex += 1;
    const current = getCurrentQuestion();
    state.selectedChoice = current ? (state.answers[current.id] || null) : null;
    renderQuestion();
    renderProgress();
  }

  function goPrevious() {
    if (state.currentIndex <= 0) return;
    state.currentIndex -= 1;
    const current = getCurrentQuestion();
    state.selectedChoice = current ? (state.answers[current.id] || null) : null;
    renderQuestion();
    renderProgress();
  }

  function initializeQuestions(questions) {
    state.questions = questions.slice().sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return a.number - b.number;
    });

    state.filtered = state.questions.slice();
    state.currentIndex = 0;

    const first = getCurrentQuestion();
    state.selectedChoice = first ? (state.answers[first.id] || null) : null;

    renderQuestion();
    renderProgress();
    renderMetrics();
    renderActivities();
  }

  yearSelect.addEventListener('change', applyFilters);
  subtopicSelect.addEventListener('change', applyFilters);
  difficultySelect.addEventListener('change', applyFilters);

  prevButton.addEventListener('click', goPrevious);
  nextButton.addEventListener('click', goNext);
  correctButton.addEventListener('click', evaluateCurrentQuestion);

  loadDataset().then((dataset) => {
    initializeQuestions(dataset.questions || []);
  });
})();
