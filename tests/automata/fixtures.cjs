function buildDemoAfd() {
  return {
    alphabet: ['a', 'b', 'c'],
    states: ['e1', 'e2', 'e3'],
    initialState: 'e1',
    acceptStates: ['e2'],
    transitions: {
      e1: { a: 'e1', b: 'e1', c: 'e2' },
      e2: { a: 'e3', b: 'e3', c: 'e3' },
      e3: { a: 'e3', b: 'e3', c: 'e3' },
    },
  };
}

function buildMinimizationAfd() {
  return {
    alphabet: ['a', 'b', 'c'],
    states: ['A', 'B', 'C', 'D'],
    initialState: 'A',
    acceptStates: ['B'],
    transitions: {
      A: { a: 'A', b: 'A', c: 'B' },
      B: { a: 'C', b: 'C', c: 'C' },
      C: { a: 'C', b: 'C', c: 'C' },
      D: { a: 'D', b: 'D', c: 'D' },
    },
  };
}

function buildNfaWithEpsilon() {
  return {
    alphabet: ['a', 'b'],
    states: ['q0', 'q1', 'q2'],
    initialState: 'q0',
    acceptStates: ['q2'],
    transitions: {
      q0: { a: [], b: [], 'ε': ['q1'] },
      q1: { a: ['q1'], b: ['q2'], 'ε': [] },
      q2: { a: [], b: [], 'ε': [] },
    },
  };
}

module.exports = {
  buildDemoAfd,
  buildMinimizationAfd,
  buildNfaWithEpsilon,
};
