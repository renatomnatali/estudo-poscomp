const test = require('node:test');
const assert = require('node:assert/strict');

const app = require('../../src/server');
const {
  buildDemoAfd,
  buildMinimizationAfd,
  buildNfaWithEpsilon,
} = require('../automata/fixtures.cjs');

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
});

async function getJson(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const payload = await response.json();
  return { status: response.status, payload };
}

test('GET /api/content/topics lista tópicos', async () => {
  const { status, payload } = await getJson('/api/content/topics?macroArea=fundamentos');
  assert.equal(status, 200);
  assert.ok(Array.isArray(payload.items));
  assert.ok(payload.items.length >= 1);
});

test('POST /api/simulator/afd/run simula palavra aceita', async () => {
  const { status, payload } = await getJson('/api/simulator/afd/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      automaton: buildDemoAfd(),
      inputWord: 'ababc',
    }),
  });

  assert.equal(status, 200);
  assert.equal(payload.status, 'completed');
  assert.equal(payload.result, 'ACEITA');
});

test('POST /api/simulator/afd/minimize retorna autômato reduzido', async () => {
  const { status, payload } = await getJson('/api/simulator/afd/minimize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ automaton: buildMinimizationAfd() }),
  });

  assert.equal(status, 200);
  assert.equal(payload.minimized.states.length, 3);
  assert.deepEqual(payload.removedUnreachable, ['D']);
});

test('POST /api/simulator/afn/convert gera AFD equivalente', async () => {
  const { status, payload } = await getJson('/api/simulator/afn/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ automaton: buildNfaWithEpsilon() }),
  });

  assert.equal(status, 200);
  assert.ok(Array.isArray(payload.dfa.states));
  assert.ok(payload.dfa.states.length >= 2);
});

test('POST /api/assessment/submit corrige respostas', async () => {
  const { status, payload } = await getJson('/api/assessment/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attemptId: 'attempt-test',
      answers: [{ questionId: 'q-2022-afd-01', choice: 'B' }],
    }),
  });

  assert.equal(status, 200);
  assert.equal(payload.score.total, 1);
  assert.equal(payload.score.correct, 1);
  assert.ok(Array.isArray(payload.gradedAnswers));
});
