const assert = require('node:assert/strict');
const { buildDemoAfd } = require('./fixtures.cjs');
const core = require('../../src/lib/automata-core.js');

function run() {
  const afd = buildDemoAfd();

  const resultC = core.simulateDfa(afd, 'c');
  assert.equal(resultC.status, 'completed');
  assert.equal(resultC.result, 'ACEITA');
  assert.equal(resultC.finalState, 'e2');
  assert.equal(resultC.trace.length, 1);

  const resultAbc = core.simulateDfa(afd, 'abc');
  assert.equal(resultAbc.result, 'ACEITA');
  assert.equal(resultAbc.trace.length, 3);

  const resultAbabc = core.simulateDfa(afd, 'ababc');
  assert.equal(resultAbabc.result, 'ACEITA');
  assert.equal(resultAbabc.finalState, 'e2');

  const resultAbca = core.simulateDfa(afd, 'abca');
  assert.equal(resultAbca.result, 'REJEITA');
  assert.equal(resultAbca.finalState, 'e3');

  const resultInvalid = core.simulateDfa(afd, 'abd');
  assert.equal(resultInvalid.status, 'failed');
  assert.equal(resultInvalid.result, 'INVÁLIDA');
  assert.match(resultInvalid.error || '', /a, b e c/i);
}

module.exports = { run };
