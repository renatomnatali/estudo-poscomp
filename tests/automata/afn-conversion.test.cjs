const assert = require('node:assert/strict');
const { buildNfaWithEpsilon } = require('./fixtures.cjs');
const core = require('../../src/lib/automata-core.js');

function run() {
  const nfa = buildNfaWithEpsilon();

  const startClosure = core.epsilonClosure(nfa, [nfa.initialState]);
  assert.deepEqual(startClosure, ['q0', 'q1']);

  const converted = core.convertNfaToDfa(nfa);
  assert.ok(converted.dfa.states.length >= 2);
  assert.ok(Object.keys(converted.subsetMap).length >= 2);

  const words = ['ab', 'aab', 'bbb'];
  words.forEach((word) => {
    const nfaResult = core.simulateNfa(nfa, word);
    const dfaResult = core.simulateDfa(converted.dfa, word);
    const dfaAccepted = dfaResult.result === 'ACEITA';
    assert.equal(
      nfaResult.accepted,
      dfaAccepted,
      `AFN e AFD convertido divergiram para ${word}`
    );
  });
}

module.exports = { run };
