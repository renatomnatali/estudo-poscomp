const assert = require('node:assert/strict');
const { buildMinimizationAfd } = require('./fixtures.cjs');
const core = require('../../src/lib/automata-core.js');

function run() {
  const afd = buildMinimizationAfd();

  const minimized = core.minimizeDfa(afd);

  assert.deepEqual(minimized.removedUnreachable, ['D']);
  assert.ok(Array.isArray(minimized.partitions));
  assert.ok(minimized.partitions.length >= 2);
  assert.equal(minimized.minimized.states.length, 3);

  const words = ['c', 'abc', 'ababc', 'abca'];
  words.forEach((word) => {
    const originalResult = core.simulateDfa(afd, word);
    const minimizedResult = core.simulateDfa(minimized.minimized, word);
    assert.equal(
      originalResult.result,
      minimizedResult.result,
      `linguagem divergente para palavra ${word}`
    );
  });
}

module.exports = { run };
