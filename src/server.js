const express = require('express');
const path = require('node:path');

const core = require('./lib/automata-core');
const { listTopics, getTopicBySlug } = require('./lib/content-data');
const { listQuestions, getQuestionMap } = require('./lib/questions-repo');
const { gradeAssessment } = require('./lib/assessment');

const app = express();
const PORT = Number(process.env.PORT || 4173);

app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

function getSimulationStatusPayload(result) {
  if (!result || typeof result !== 'object') {
    return {
      status: 'failed',
      result: 'INVÁLIDA',
      error: 'Resultado de simulação inválido.',
    };
  }

  return result;
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'poscomp-v1-bff' });
});

app.get('/api/content/topics', (req, res) => {
  const items = listTopics({
    macroArea: req.query.macroArea,
    subTopic: req.query.subTopic,
    difficulty: req.query.difficulty,
  });

  res.json({ items });
});

app.get('/api/content/topics/:slug', (req, res) => {
  const topic = getTopicBySlug(req.params.slug);
  if (!topic) {
    res.status(404).json({ error: 'Tópico não encontrado.' });
    return;
  }

  res.json(topic);
});

app.get('/api/questions', (req, res) => {
  const items = listQuestions({
    year: req.query.year,
    macroArea: req.query.macroArea,
    subTopic: req.query.subTopic,
    difficulty: req.query.difficulty,
    limit: req.query.limit,
  });

  res.json({ items, total: items.length });
});

app.post('/api/simulator/afd/run', (req, res) => {
  const { automaton, inputWord } = req.body || {};
  if (!automaton || typeof inputWord !== 'string') {
    res.status(400).json({ error: 'Payload inválido. Envie automaton e inputWord.' });
    return;
  }

  const result = core.simulateDfa(automaton, inputWord);
  res.json(getSimulationStatusPayload(result));
});

app.post('/api/simulator/afd/minimize', (req, res) => {
  const automaton = req.body && req.body.automaton;
  if (!automaton) {
    res.status(400).json({ error: 'Payload inválido. Envie automaton.' });
    return;
  }

  try {
    const minimized = core.minimizeDfa(automaton);
    res.json({
      original: automaton,
      reachableStates: minimized.reachableStates,
      removedUnreachable: minimized.removedUnreachable,
      partitions: minimized.partitions,
      stateMap: minimized.stateMap,
      mergedStates: minimized.mergedStates,
      minimized: minimized.minimized,
    });
  } catch (error) {
    res.status(400).json({ error: `Falha ao minimizar AFD: ${error.message}` });
  }
});

app.post('/api/simulator/afn/convert', (req, res) => {
  const automaton = req.body && req.body.automaton;
  if (!automaton) {
    res.status(400).json({ error: 'Payload inválido. Envie automaton.' });
    return;
  }

  try {
    const converted = core.convertNfaToDfa(automaton);
    res.json({
      subsetMap: converted.subsetMap,
      subsetKeyMap: converted.subsetKeyMap,
      dfa: converted.dfa,
    });
  } catch (error) {
    res.status(400).json({ error: `Falha ao converter AFN: ${error.message}` });
  }
});

app.post('/api/assessment/submit', (req, res) => {
  const payload = req.body || {};
  const answers = Array.isArray(payload.answers) ? payload.answers : [];

  if (answers.length === 0) {
    res.status(400).json({ error: 'Nenhuma resposta enviada.' });
    return;
  }

  const questionMap = getQuestionMap();
  const result = gradeAssessment(answers, questionMap);

  res.json({
    attemptId: payload.attemptId || null,
    ...result,
  });
});

const webRoot = path.resolve(__dirname, 'web');
app.use(express.static(webRoot));

app.get('*', (_req, res) => {
  res.sendFile(path.join(webRoot, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    process.stdout.write(`POSCOMP V1 rodando em http://localhost:${PORT}\n`);
  });
}

module.exports = app;
