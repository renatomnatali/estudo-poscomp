(function () {
  const yearSelect = document.querySelector('[data-qa-year]');
  const subtopicSelect = document.querySelector('[data-qa-subtopic]');
  const difficultySelect = document.querySelector('[data-qa-difficulty]');
  const questionListEl = document.querySelector('[data-qa-list]');
  const detailEl = document.querySelector('[data-qa-detail]');
  const feedbackEl = document.querySelector('[data-qa-feedback]');
  const metricsEl = document.querySelector('[data-qa-metrics]');

  if (!yearSelect || !subtopicSelect || !difficultySelect || !questionListEl || !detailEl || !feedbackEl || !metricsEl) {
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

  const state = {
    questions: [],
    filtered: [],
    selectedQuestionId: null,
    selectedChoice: null,
    metrics: {},
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
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .catch(() => fallbackDataset);
  }

  function getSubtopicLabel(subTopic) {
    return subtopicLabels[subTopic] || subTopic;
  }

  function getSelectedQuestion() {
    return state.questions.find((question) => question.id === state.selectedQuestionId) || null;
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

    if (!state.filtered.some((question) => question.id === state.selectedQuestionId)) {
      state.selectedQuestionId = state.filtered.length > 0 ? state.filtered[0].id : null;
      state.selectedChoice = null;
    }

    renderQuestionList();
    renderQuestionDetail();
  }

  function renderQuestionList() {
    questionListEl.innerHTML = '';

    if (state.filtered.length === 0) {
      questionListEl.innerHTML = '<p class="page-subtitle" style="margin-top: 0; color: var(--color-ink-500);">Nenhuma questão encontrada para os filtros atuais.</p>';
      return;
    }

    state.filtered.forEach((question) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'question-item';
      if (question.id === state.selectedQuestionId) button.classList.add('is-active');

      button.innerHTML = [
        `<strong>${question.year} · Questão ${question.number}</strong>`,
        `<p>${sanitizeHtml(getSubtopicLabel(question.subTopic))}</p>`,
        '<div class="question-meta">',
        `<span class="question-chip">${sanitizeHtml(difficultyLabels[question.difficulty] || question.difficulty)}</span>`,
        `<span class="question-chip">${sanitizeHtml(question.source)}</span>`,
        '</div>',
      ].join('');

      button.addEventListener('click', () => {
        state.selectedQuestionId = question.id;
        state.selectedChoice = null;
        renderQuestionList();
        renderQuestionDetail();
      });

      questionListEl.appendChild(button);
    });
  }

  function renderQuestionDetail() {
    const question = getSelectedQuestion();
    if (!question) {
      detailEl.innerHTML = '<p class="page-subtitle" style="margin-top: 0; color: var(--color-ink-500);">Selecione uma questão para responder.</p>';
      return;
    }

    const wrapper = document.createElement('div');

    const heading = document.createElement('p');
    heading.style.marginTop = '0';
    heading.style.marginBottom = '12px';
    heading.innerHTML = `<strong>${question.year} · Questão ${question.number}</strong>`;
    wrapper.appendChild(heading);

    const stem = document.createElement('p');
    stem.style.marginTop = '0';
    stem.style.color = 'var(--color-ink-700)';
    stem.textContent = question.stem;
    wrapper.appendChild(stem);

    const optionList = document.createElement('div');
    optionList.className = 'option-list';

    question.options.forEach((option) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option-btn';
      if (state.selectedChoice === option.key) btn.classList.add('is-selected');
      btn.innerHTML = `<strong>${option.key})</strong> ${sanitizeHtml(option.text)}`;
      btn.addEventListener('click', () => {
        state.selectedChoice = option.key;
        renderQuestionDetail();
      });
      optionList.appendChild(btn);
    });

    wrapper.appendChild(optionList);

    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar';

    const evaluateButton = document.createElement('button');
    evaluateButton.type = 'button';
    evaluateButton.className = 'button primary';
    evaluateButton.textContent = 'Corrigir questão';
    evaluateButton.addEventListener('click', () => evaluateQuestion(question));

    toolbar.appendChild(evaluateButton);
    wrapper.appendChild(toolbar);

    detailEl.innerHTML = '';
    detailEl.appendChild(wrapper);
  }

  function updateMetrics(question, isCorrect) {
    const key = question.subTopic;
    if (!state.metrics[key]) {
      state.metrics[key] = { answered: 0, correct: 0 };
    }

    state.metrics[key].answered += 1;
    if (isCorrect) state.metrics[key].correct += 1;

    renderMetrics();
  }

  function renderMetrics() {
    const topicKeys = Array.from(
      new Set(state.questions.map((question) => question.subTopic))
    );

    metricsEl.innerHTML = '';

    topicKeys.forEach((key) => {
      const metric = state.metrics[key] || { answered: 0, correct: 0 };
      const accuracy = metric.answered > 0
        ? Math.round((metric.correct / metric.answered) * 100)
        : null;

      let status = 'sem dados';
      if (accuracy !== null) {
        status = accuracy >= 70 ? 'ok' : 'reforçar';
      }

      const tr = document.createElement('tr');
      tr.innerHTML = [
        `<td>${sanitizeHtml(getSubtopicLabel(key))}</td>`,
        `<td>${metric.answered}</td>`,
        `<td>${accuracy === null ? '—' : `${accuracy}%`}</td>`,
        `<td>${status}</td>`,
      ].join('');

      metricsEl.appendChild(tr);
    });
  }

  function evaluateQuestion(question) {
    if (!state.selectedChoice) {
      feedbackEl.innerHTML = 'Selecione uma alternativa antes de corrigir.';
      return;
    }

    const isCorrect = state.selectedChoice === question.answerKey;
    updateMetrics(question, isCorrect);

    const choiceExplanation =
      (question.optionExplanations && question.optionExplanations[state.selectedChoice])
      || 'Sem explicação cadastrada para esta alternativa.';

    const weakTopics = Object.entries(state.metrics)
      .filter(([, metric]) => metric.answered > 0 && (metric.correct / metric.answered) < 0.7)
      .map(([key]) => getSubtopicLabel(key));

    const recommendation = weakTopics.length > 0
      ? `Recomendação de revisão: ${weakTopics.join(', ')}.`
      : 'Nenhuma lacuna crítica detectada até o momento.';

    feedbackEl.innerHTML = [
      `<strong>${isCorrect ? 'Resposta correta.' : 'Resposta incorreta.'}</strong>`,
      `<p style="margin-top: 8px; margin-bottom: 8px;">Gabarito: <strong>${question.answerKey}</strong>.</p>`,
      `<p style="margin-top: 0; margin-bottom: 8px;">${sanitizeHtml(choiceExplanation)}</p>`,
      `<p style="margin-top: 0; margin-bottom: 8px;">${sanitizeHtml(question.explanation || 'Sem explicação geral cadastrada.')}</p>`,
      `<p style="margin: 0;"><strong>${sanitizeHtml(recommendation)}</strong></p>`,
    ].join('');
  }

  function initializeQuestions(questions) {
    state.questions = questions.slice().sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return a.number - b.number;
    });

    state.filtered = state.questions.slice();
    state.selectedQuestionId = state.filtered.length > 0 ? state.filtered[0].id : null;
    state.selectedChoice = null;

    renderQuestionList();
    renderQuestionDetail();
    renderMetrics();
  }

  yearSelect.addEventListener('change', applyFilters);
  subtopicSelect.addEventListener('change', applyFilters);
  difficultySelect.addEventListener('change', applyFilters);

  loadDataset().then((dataset) => {
    initializeQuestions(dataset.questions || []);
  });
})();
