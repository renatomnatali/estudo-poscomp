#!/usr/bin/env node
const path = require('node:path');

const tests = [
  { name: 'AFD simulation', file: '../tests/automata/afd-simulation.test.cjs' },
  { name: 'AFD minimization', file: '../tests/automata/afd-minimization.test.cjs' },
  { name: 'AFN conversion', file: '../tests/automata/afn-conversion.test.cjs' },
];

let failed = 0;

for (const test of tests) {
  try {
    const mod = require(path.join(__dirname, test.file));
    mod.run();
    process.stdout.write(`PASS ${test.name}\n`);
  } catch (error) {
    failed += 1;
    process.stdout.write(`FAIL ${test.name}\n`);
    process.stdout.write(`${error.stack || error.message}\n`);
  }
}

if (failed > 0) {
  process.exitCode = 1;
} else {
  process.stdout.write('All automata tests passed.\n');
}
