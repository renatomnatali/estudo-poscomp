import type {
  DfaDefinition,
  DfaSimulationResult,
  MinimizeResult,
  NfaDefinition,
  NfaSimulationResult,
} from '@/lib/types';

export const DEFAULT_EPSILON = 'ε';

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function stableSortByReference(states: string[], reference: string[]): string[] {
  const indexMap = new Map(reference.map((state, idx) => [state, idx]));
  return states
    .slice()
    .sort((a, b) => {
      const aIndex = indexMap.has(a) ? indexMap.get(a)! : Number.MAX_SAFE_INTEGER;
      const bIndex = indexMap.has(b) ? indexMap.get(b)! : Number.MAX_SAFE_INTEGER;
      if (aIndex !== bIndex) return aIndex - bIndex;
      return a.localeCompare(b);
    });
}

function getDfaTransition(definition: DfaDefinition, state: string, symbol: string): string | null {
  const byState = definition.transitions[state];
  if (!byState) return null;
  const target = byState[symbol];
  return typeof target === 'string' && target.length > 0 ? target : null;
}

export function simulateDfa(definition: DfaDefinition, inputWord: string): DfaSimulationResult {
  const alphabet = definition.alphabet.filter((symbol) => symbol !== DEFAULT_EPSILON);
  const states = definition.states;
  const acceptStates = new Set(definition.acceptStates);
  const word = String(inputWord ?? '');

  if (!definition.initialState || states.length === 0) {
    return {
      status: 'failed',
      result: 'INVÁLIDA',
      finalState: null,
      trace: [],
      error: 'AFD inválido: estado inicial ou conjunto de estados ausente.',
    };
  }

  let current = definition.initialState;
  const trace: DfaSimulationResult['trace'] = [];

  for (let index = 0; index < word.length; index += 1) {
    const symbol = word[index];
    if (!alphabet.includes(symbol)) {
      const validSymbols = alphabet.join(', ').replace(/, ([^,]+)$/, ' e $1');
      return {
        status: 'failed',
        result: 'INVÁLIDA',
        finalState: current,
        trace,
        error: `Símbolo inválido: "${symbol}". Use apenas ${validSymbols}.`,
      };
    }

    const next = getDfaTransition(definition, current, symbol);
    if (!next) {
      return {
        status: 'failed',
        result: 'INVÁLIDA',
        finalState: current,
        trace,
        error: `Transição indefinida para δ(${current}, ${symbol}).`,
      };
    }

    trace.push({
      stepIndex: index + 1,
      fromState: current,
      symbol,
      toState: next,
    });

    current = next;
  }

  const accepted = acceptStates.has(current);
  return {
    status: 'completed',
    result: accepted ? 'ACEITA' : 'REJEITA',
    finalState: current,
    trace,
    accepted,
  };
}

export function getReachableStates(definition: DfaDefinition): string[] {
  const alphabet = definition.alphabet.filter((symbol) => symbol !== DEFAULT_EPSILON);
  const states = definition.states;
  const stateSet = new Set(states);

  if (!definition.initialState || !stateSet.has(definition.initialState)) {
    return [];
  }

  const reachable: string[] = [];
  const visited = new Set<string>();
  const queue = [definition.initialState];

  while (queue.length > 0) {
    const state = queue.shift()!;
    if (visited.has(state)) continue;
    visited.add(state);
    reachable.push(state);

    for (const symbol of alphabet) {
      const next = getDfaTransition(definition, state, symbol);
      if (next && stateSet.has(next) && !visited.has(next)) {
        queue.push(next);
      }
    }
  }

  return stableSortByReference(reachable, states);
}

function serializePartitions(partitions: string[][], stateOrder: string[]): string {
  return partitions
    .map((group) => stableSortByReference(group, stateOrder).join('|'))
    .sort()
    .join('||');
}

function findPartitionIndex(partitions: string[][], state: string): number {
  for (let index = 0; index < partitions.length; index += 1) {
    if (partitions[index].includes(state)) return index;
  }
  return -1;
}

function normalizePartitions(partitions: string[][], stateOrder: string[]): string[][] {
  return partitions
    .map((group) => stableSortByReference(unique(group), stateOrder))
    .filter((group) => group.length > 0)
    .sort((a, b) => {
      const left = a[0] || '';
      const right = b[0] || '';
      const leftIndex = stateOrder.indexOf(left);
      const rightIndex = stateOrder.indexOf(right);
      return leftIndex - rightIndex;
    });
}

export function minimizeDfa(definition: DfaDefinition): MinimizeResult {
  const alphabet = definition.alphabet.filter((symbol) => symbol !== DEFAULT_EPSILON);
  const states = definition.states;
  const reachableStates = getReachableStates(definition);
  const reachableSet = new Set(reachableStates);
  const removedUnreachable = states.filter((state) => !reachableSet.has(state));

  const accept = reachableStates.filter((state) => definition.acceptStates.includes(state));
  const reject = reachableStates.filter((state) => !accept.includes(state));

  let partitions: string[][] = [];
  if (accept.length > 0) partitions.push(accept);
  if (reject.length > 0) partitions.push(reject);
  partitions = normalizePartitions(partitions, reachableStates);

  if (partitions.length === 0 && reachableStates.length > 0) {
    partitions = [reachableStates.slice()];
  }

  const history: string[][][] = [partitions.map((group) => group.slice())];

  while (true) {
    const refined: string[][] = [];

    for (const group of partitions) {
      const buckets = new Map<string, string[]>();

      for (const state of group) {
        const signature = alphabet
          .map((symbol) => {
            const target = getDfaTransition(definition, state, symbol);
            const normalizedTarget = target && reachableSet.has(target) ? target : '__dead__';
            return findPartitionIndex(partitions, normalizedTarget);
          })
          .join(',');

        if (!buckets.has(signature)) buckets.set(signature, []);
        buckets.get(signature)!.push(state);
      }

      for (const bucket of buckets.values()) {
        refined.push(bucket);
      }
    }

    const normalizedRefined = normalizePartitions(refined, reachableStates);
    const previousHash = serializePartitions(partitions, reachableStates);
    const nextHash = serializePartitions(normalizedRefined, reachableStates);

    if (previousHash === nextHash) break;

    partitions = normalizedRefined;
    history.push(partitions.map((group) => group.slice()));
  }

  const orderedGroups = partitions
    .map((group) => group.slice())
    .sort((a, b) => {
      const aHasInitial = a.includes(definition.initialState) ? 0 : 1;
      const bHasInitial = b.includes(definition.initialState) ? 0 : 1;
      if (aHasInitial !== bHasInitial) return aHasInitial - bHasInitial;
      const left = a[0] || '';
      const right = b[0] || '';
      return reachableStates.indexOf(left) - reachableStates.indexOf(right);
    });

  const stateMap: Record<string, string> = {};
  const minimizedStates: string[] = [];

  orderedGroups.forEach((group, index) => {
    const newState = `M${index}`;
    minimizedStates.push(newState);
    group.forEach((oldState) => {
      stateMap[oldState] = newState;
    });
  });

  const minimizedTransitions: DfaDefinition['transitions'] = {};
  for (const group of orderedGroups) {
    const representative = group[0];
    const mappedState = stateMap[representative];
    minimizedTransitions[mappedState] = {};

    for (const symbol of alphabet) {
      const target = getDfaTransition(definition, representative, symbol);
      if (!target) continue;
      minimizedTransitions[mappedState][symbol] = stateMap[target];
    }
  }

  const minimizedAcceptStates = unique(
    definition.acceptStates
      .filter((state) => reachableSet.has(state))
      .map((state) => stateMap[state])
  );

  const mergedStates = orderedGroups.filter((group) => group.length > 1);

  return {
    reachableStates,
    removedUnreachable,
    partitions: history,
    minimized: {
      alphabet,
      states: minimizedStates,
      initialState: stateMap[definition.initialState],
      acceptStates: minimizedAcceptStates,
      transitions: minimizedTransitions,
    },
    stateMap,
    mergedStates,
  };
}

function getNfaTransitions(definition: NfaDefinition, state: string, symbol: string): string[] {
  const byState = definition.transitions[state];
  if (!byState) return [];
  const transitions = byState[symbol];
  return unique(Array.isArray(transitions) ? transitions : []);
}

export function epsilonClosure(
  definition: NfaDefinition,
  startStates: string[],
  epsilonSymbol: string = DEFAULT_EPSILON
): string[] {
  const stateOrder = definition.states;
  const closure = new Set(unique(startStates));
  const stack = unique(startStates).slice();

  while (stack.length > 0) {
    const state = stack.pop()!;
    const epsilonTargets = getNfaTransitions(definition, state, epsilonSymbol);
    for (const target of epsilonTargets) {
      if (!closure.has(target)) {
        closure.add(target);
        stack.push(target);
      }
    }
  }

  return stableSortByReference(Array.from(closure), stateOrder);
}

export function moveNfa(
  definition: NfaDefinition,
  states: string[],
  symbol: string
): string[] {
  const stateOrder = definition.states;
  const nextStates: string[] = [];
  for (const state of states) {
    nextStates.push(...getNfaTransitions(definition, state, symbol));
  }

  return stableSortByReference(unique(nextStates), stateOrder);
}

export function simulateNfa(
  definition: NfaDefinition,
  inputWord: string,
  epsilonSymbol: string = DEFAULT_EPSILON
): NfaSimulationResult {
  const alphabet = definition.alphabet.filter((symbol) => symbol !== epsilonSymbol);
  const acceptStates = new Set(definition.acceptStates);
  const word = String(inputWord ?? '');

  let currentStates = epsilonClosure(definition, [definition.initialState], epsilonSymbol);
  const trace: NfaSimulationResult['trace'] = [];

  for (let index = 0; index < word.length; index += 1) {
    const symbol = word[index];
    if (!alphabet.includes(symbol)) {
      return {
        status: 'failed',
        accepted: false,
        currentStates,
        trace,
        error: `Símbolo inválido: "${symbol}".`,
      };
    }

    const moved = moveNfa(definition, currentStates, symbol);
    const closed = epsilonClosure(definition, moved, epsilonSymbol);

    trace.push({
      stepIndex: index + 1,
      symbol,
      fromStates: currentStates.slice(),
      toStates: closed.slice(),
    });

    currentStates = closed;
  }

  const accepted = currentStates.some((state) => acceptStates.has(state));

  return {
    status: 'completed',
    accepted,
    currentStates,
    trace,
  };
}

export function subsetKey(states: string[]): string {
  if (!states || states.length === 0) return '∅';
  return states.join('|');
}

export function convertNfaToDfa(
  definition: NfaDefinition,
  epsilonSymbol: string = DEFAULT_EPSILON
): { subsetMap: Record<string, string[]>; subsetKeyMap: Record<string, string>; dfa: DfaDefinition } {
  const alphabet = definition.alphabet.filter((symbol) => symbol !== epsilonSymbol);
  const accept = new Set(definition.acceptStates);

  const startSubset = epsilonClosure(definition, [definition.initialState], epsilonSymbol);
  const startKey = subsetKey(startSubset);

  const queue: string[][] = [startSubset];
  const seen = new Set([startKey]);
  const subsetToState = new Map<string, string>([[startKey, 'S0']]);
  const stateToSubset: Record<string, string[]> = { S0: startSubset.slice() };

  const transitions: DfaDefinition['transitions'] = {};

  while (queue.length > 0) {
    const subset = queue.shift()!;
    const key = subsetKey(subset);
    const stateName = subsetToState.get(key)!;
    transitions[stateName] = transitions[stateName] || {};

    for (const symbol of alphabet) {
      const moved = moveNfa(definition, subset, symbol);
      const closed = epsilonClosure(definition, moved, epsilonSymbol);
      const targetKey = subsetKey(closed);

      if (!seen.has(targetKey)) {
        const nextName = `S${subsetToState.size}`;
        seen.add(targetKey);
        subsetToState.set(targetKey, nextName);
        stateToSubset[nextName] = closed.slice();
        queue.push(closed);
      }

      transitions[stateName][symbol] = subsetToState.get(targetKey)!;
    }
  }

  const dfaStates = Array.from(subsetToState.values());
  const dfaAcceptStates = dfaStates.filter((dfaState) => {
    const subset = stateToSubset[dfaState] || [];
    return subset.some((nfaState) => accept.has(nfaState));
  });

  const dfa: DfaDefinition = {
    alphabet,
    states: dfaStates,
    initialState: subsetToState.get(startKey)!,
    acceptStates: dfaAcceptStates,
    transitions,
  };

  return {
    subsetMap: stateToSubset,
    subsetKeyMap: Object.fromEntries(subsetToState.entries()),
    dfa,
  };
}

export function formatSet(states: string[]): string {
  if (!states || states.length === 0) return '∅';
  return `{${states.join(',')}}`;
}
