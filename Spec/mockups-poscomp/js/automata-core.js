(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }

  root.AutomataCore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DEFAULT_EPSILON = 'ε';

  function unique(items) {
    return Array.from(new Set(items));
  }

  function asArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.length > 0) return [value];
    return [];
  }

  function stableSortByReference(states, reference) {
    const indexMap = new Map(reference.map((state, idx) => [state, idx]));
    return states
      .slice()
      .sort((a, b) => {
        const aIndex = indexMap.has(a) ? indexMap.get(a) : Number.MAX_SAFE_INTEGER;
        const bIndex = indexMap.has(b) ? indexMap.get(b) : Number.MAX_SAFE_INTEGER;
        if (aIndex !== bIndex) return aIndex - bIndex;
        return String(a).localeCompare(String(b));
      });
  }

  function normalizeStates(definition) {
    if (Array.isArray(definition.states) && definition.states.length > 0) {
      return unique(definition.states);
    }

    if (definition.transitions && typeof definition.transitions === 'object') {
      return unique(Object.keys(definition.transitions));
    }

    return [];
  }

  function normalizeAlphabet(definition, epsilonSymbol) {
    const rawAlphabet = Array.isArray(definition.alphabet) ? definition.alphabet : [];
    return unique(rawAlphabet.filter((symbol) => symbol !== epsilonSymbol));
  }

  function getDfaTransition(definition, state, symbol) {
    const byState = definition.transitions && definition.transitions[state];
    if (!byState) return null;
    const target = byState[symbol];
    return typeof target === 'string' && target.length > 0 ? target : null;
  }

  function simulateDfa(definition, inputWord) {
    const alphabet = normalizeAlphabet(definition, DEFAULT_EPSILON);
    const states = normalizeStates(definition);
    const acceptStates = new Set(definition.acceptStates || []);
    const word = String(inputWord || '');

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
    const trace = [];

    for (let index = 0; index < word.length; index += 1) {
      const symbol = word[index];
      if (!alphabet.includes(symbol)) {
        return {
          status: 'failed',
          result: 'INVÁLIDA',
          finalState: current,
          trace,
          error: `Símbolo inválido: "${symbol}". Use apenas ${alphabet.join(', ').replace(/, ([^,]+)$/, ' e $1')}.`,
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

  function getReachableStates(definition) {
    const states = normalizeStates(definition);
    const alphabet = normalizeAlphabet(definition, DEFAULT_EPSILON);
    const stateSet = new Set(states);

    if (!definition.initialState || !stateSet.has(definition.initialState)) {
      return [];
    }

    const reachable = [];
    const visited = new Set();
    const queue = [definition.initialState];

    while (queue.length > 0) {
      const state = queue.shift();
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

  function serializePartitions(partitions, stateOrder) {
    return partitions
      .map((group) => stableSortByReference(group, stateOrder).join('|'))
      .sort()
      .join('||');
  }

  function findPartitionIndex(partitions, state) {
    for (let index = 0; index < partitions.length; index += 1) {
      if (partitions[index].includes(state)) return index;
    }
    return -1;
  }

  function normalizePartitions(partitions, stateOrder) {
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

  function minimizeDfa(definition) {
    const alphabet = normalizeAlphabet(definition, DEFAULT_EPSILON);
    const states = normalizeStates(definition);
    const reachableStates = getReachableStates(definition);
    const reachableSet = new Set(reachableStates);
    const removedUnreachable = states.filter((state) => !reachableSet.has(state));

    const accept = reachableStates.filter((state) => (definition.acceptStates || []).includes(state));
    const reject = reachableStates.filter((state) => !accept.includes(state));

    let partitions = [];
    if (accept.length > 0) partitions.push(accept);
    if (reject.length > 0) partitions.push(reject);
    partitions = normalizePartitions(partitions, reachableStates);

    if (partitions.length === 0 && reachableStates.length > 0) {
      partitions = [reachableStates.slice()];
    }

    const history = [partitions.map((group) => group.slice())];

    while (true) {
      const refined = [];

      for (const group of partitions) {
        const buckets = new Map();

        for (const state of group) {
          const signature = alphabet
            .map((symbol) => {
              const target = getDfaTransition(definition, state, symbol);
              const normalizedTarget = target && reachableSet.has(target) ? target : '__dead__';
              return findPartitionIndex(partitions, normalizedTarget);
            })
            .join(',');

          if (!buckets.has(signature)) buckets.set(signature, []);
          buckets.get(signature).push(state);
        }

        for (const bucket of buckets.values()) {
          refined.push(bucket);
        }
      }

      const normalizedRefined = normalizePartitions(refined, reachableStates);
      const previousHash = serializePartitions(partitions, reachableStates);
      const nextHash = serializePartitions(normalizedRefined, reachableStates);

      if (previousHash === nextHash) {
        break;
      }

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

    const stateMap = {};
    const minimizedStates = [];

    orderedGroups.forEach((group, index) => {
      const newState = `M${index}`;
      minimizedStates.push(newState);
      group.forEach((oldState) => {
        stateMap[oldState] = newState;
      });
    });

    const minimizedTransitions = {};
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
      (definition.acceptStates || [])
        .filter((state) => reachableSet.has(state))
        .map((state) => stateMap[state])
    );

    const mergedStates = orderedGroups.filter((group) => group.length > 1);

    const minimized = {
      alphabet,
      states: minimizedStates,
      initialState: stateMap[definition.initialState],
      acceptStates: minimizedAcceptStates,
      transitions: minimizedTransitions,
    };

    return {
      reachableStates,
      removedUnreachable,
      partitions: history,
      minimized,
      stateMap,
      mergedStates,
    };
  }

  function getNfaTransitions(definition, state, symbol, epsilonSymbol) {
    const byState = definition.transitions && definition.transitions[state];
    if (!byState) return [];
    const transitions = byState[symbol];
    return unique(asArray(transitions));
  }

  function epsilonClosure(definition, startStates, epsilonSymbol = DEFAULT_EPSILON) {
    const stateOrder = normalizeStates(definition);
    const closure = new Set(unique(startStates));
    const stack = unique(startStates).slice();

    while (stack.length > 0) {
      const state = stack.pop();
      const epsilonTargets = getNfaTransitions(definition, state, epsilonSymbol, epsilonSymbol);
      for (const target of epsilonTargets) {
        if (!closure.has(target)) {
          closure.add(target);
          stack.push(target);
        }
      }
    }

    return stableSortByReference(Array.from(closure), stateOrder);
  }

  function moveNfa(definition, states, symbol, epsilonSymbol = DEFAULT_EPSILON) {
    const stateOrder = normalizeStates(definition);
    const nextStates = [];
    for (const state of states) {
      const targets = getNfaTransitions(definition, state, symbol, epsilonSymbol);
      nextStates.push(...targets);
    }

    return stableSortByReference(unique(nextStates), stateOrder);
  }

  function simulateNfa(definition, inputWord, epsilonSymbol = DEFAULT_EPSILON) {
    const alphabet = normalizeAlphabet(definition, epsilonSymbol);
    const acceptStates = new Set(definition.acceptStates || []);
    const word = String(inputWord || '');

    let currentStates = epsilonClosure(definition, [definition.initialState], epsilonSymbol);
    const trace = [];

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

      const moved = moveNfa(definition, currentStates, symbol, epsilonSymbol);
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

  function subsetKey(states) {
    if (!states || states.length === 0) return '∅';
    return states.join('|');
  }

  function convertNfaToDfa(definition, epsilonSymbol = DEFAULT_EPSILON) {
    const alphabet = normalizeAlphabet(definition, epsilonSymbol);
    const accept = new Set(definition.acceptStates || []);

    const startSubset = epsilonClosure(definition, [definition.initialState], epsilonSymbol);
    const startKey = subsetKey(startSubset);

    const queue = [startSubset];
    const seen = new Set([startKey]);
    const subsetToState = new Map([[startKey, 'S0']]);
    const stateToSubset = { S0: startSubset.slice() };

    const transitions = {};

    while (queue.length > 0) {
      const subset = queue.shift();
      const key = subsetKey(subset);
      const stateName = subsetToState.get(key);
      transitions[stateName] = transitions[stateName] || {};

      for (const symbol of alphabet) {
        const moved = moveNfa(definition, subset, symbol, epsilonSymbol);
        const closed = epsilonClosure(definition, moved, epsilonSymbol);
        const targetKey = subsetKey(closed);

        if (!seen.has(targetKey)) {
          const nextName = `S${subsetToState.size}`;
          seen.add(targetKey);
          subsetToState.set(targetKey, nextName);
          stateToSubset[nextName] = closed.slice();
          queue.push(closed);
        }

        transitions[stateName][symbol] = subsetToState.get(targetKey);
      }
    }

    const dfaStates = Array.from(subsetToState.values());
    const dfaAcceptStates = dfaStates.filter((dfaState) => {
      const subset = stateToSubset[dfaState] || [];
      return subset.some((nfaState) => accept.has(nfaState));
    });

    const dfa = {
      alphabet,
      states: dfaStates,
      initialState: subsetToState.get(startKey),
      acceptStates: dfaAcceptStates,
      transitions,
    };

    return {
      subsetMap: stateToSubset,
      subsetKeyMap: Object.fromEntries(subsetToState.entries()),
      dfa,
    };
  }

  function formatSet(states) {
    if (!states || states.length === 0) return '∅';
    return `{${states.join(',')}}`;
  }

  return {
    DEFAULT_EPSILON,
    epsilonClosure,
    formatSet,
    getReachableStates,
    minimizeDfa,
    moveNfa,
    simulateDfa,
    simulateNfa,
    subsetKey,
    convertNfaToDfa,
  };
});
