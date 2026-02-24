import { describe, expect, it } from 'vitest';

import {
  convertNfaToDfa,
  epsilonClosure,
  minimizeDfa,
  simulateDfa,
  simulateNfa,
} from '@/lib/automata-core';
import type { DfaDefinition, NfaDefinition } from '@/lib/types';

const afd: DfaDefinition = {
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

const afdForMin: DfaDefinition = {
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

const nfa: NfaDefinition = {
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

describe('automata-core', () => {
  it('simula AFD com aceitação e rejeição', () => {
    expect(simulateDfa(afd, 'c').result).toBe('ACEITA');
    expect(simulateDfa(afd, 'abc').result).toBe('ACEITA');
    expect(simulateDfa(afd, 'abca').result).toBe('REJEITA');
    expect(simulateDfa(afd, 'abd').status).toBe('failed');
  });

  it('minimiza AFD removendo inalcançáveis e preservando linguagem', () => {
    const minimized = minimizeDfa(afdForMin);
    expect(minimized.removedUnreachable).toEqual(['D']);
    expect(minimized.minimized.states).toHaveLength(3);

    for (const word of ['c', 'abc', 'ababc', 'abca']) {
      expect(simulateDfa(afdForMin, word).result).toBe(simulateDfa(minimized.minimized, word).result);
    }
  });

  it('converte AFN para AFD preservando aceitação', () => {
    expect(epsilonClosure(nfa, ['q0'])).toEqual(['q0', 'q1']);

    const converted = convertNfaToDfa(nfa);
    expect(converted.dfa.states.length).toBeGreaterThanOrEqual(2);

    for (const word of ['ab', 'aab', 'bbb']) {
      const nfaAccepted = simulateNfa(nfa, word).accepted;
      const dfaAccepted = simulateDfa(converted.dfa, word).result === 'ACEITA';
      expect(dfaAccepted).toBe(nfaAccepted);
    }
  });
});
