import type { DfaDefinition, NfaDefinition } from '@/lib/types';

interface ValidationResult<T> {
  valid: boolean;
  error?: string;
  value?: T;
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function isStringArray(input: unknown): input is string[] {
  return Array.isArray(input) && input.every((item) => typeof item === 'string' && item.length > 0);
}

function hasOnlyKnownStates(targets: string[], states: Set<string>) {
  return targets.every((state) => states.has(state));
}

export function validateDfaDefinition(input: unknown): ValidationResult<DfaDefinition> {
  if (!isRecord(input)) {
    return { valid: false, error: 'AFD inválido: automaton deve ser um objeto.' };
  }

  const alphabet = input.alphabet;
  const states = input.states;
  const initialState = input.initialState;
  const acceptStates = input.acceptStates;
  const transitions = input.transitions;

  if (!isStringArray(alphabet) || alphabet.length === 0) {
    return { valid: false, error: 'AFD inválido: alphabet deve ser um array de símbolos.' };
  }

  if (!isStringArray(states) || states.length === 0) {
    return { valid: false, error: 'AFD inválido: states deve ser um array não vazio.' };
  }

  if (typeof initialState !== 'string' || initialState.length === 0) {
    return { valid: false, error: 'AFD inválido: initialState deve ser informado.' };
  }

  const statesSet = new Set(states);
  if (!statesSet.has(initialState)) {
    return { valid: false, error: 'AFD inválido: initialState deve pertencer a states.' };
  }

  if (!isStringArray(acceptStates) || !hasOnlyKnownStates(acceptStates, statesSet)) {
    return { valid: false, error: 'AFD inválido: acceptStates deve conter estados válidos.' };
  }

  if (!isRecord(transitions)) {
    return { valid: false, error: 'AFD inválido: transitions deve ser um objeto.' };
  }

  for (const state of states) {
    const byState = transitions[state];
    if (!isRecord(byState)) {
      return { valid: false, error: `AFD inválido: transitions.${state} deve ser um objeto.` };
    }

    for (const symbol of alphabet) {
      const target = byState[symbol];
      if (typeof target !== 'string' || !statesSet.has(target)) {
        return {
          valid: false,
          error: `AFD inválido: transitions.${state}.${symbol} deve apontar para estado válido.`,
        };
      }
    }
  }

  return { valid: true, value: input as DfaDefinition };
}

export function validateNfaDefinition(input: unknown): ValidationResult<NfaDefinition> {
  if (!isRecord(input)) {
    return { valid: false, error: 'AFN inválido: automaton deve ser um objeto.' };
  }

  const alphabet = input.alphabet;
  const states = input.states;
  const initialState = input.initialState;
  const acceptStates = input.acceptStates;
  const transitions = input.transitions;

  if (!isStringArray(alphabet) || alphabet.length === 0) {
    return { valid: false, error: 'AFN inválido: alphabet deve ser um array de símbolos.' };
  }

  if (!isStringArray(states) || states.length === 0) {
    return { valid: false, error: 'AFN inválido: states deve ser um array não vazio.' };
  }

  if (typeof initialState !== 'string' || initialState.length === 0) {
    return { valid: false, error: 'AFN inválido: initialState deve ser informado.' };
  }

  const statesSet = new Set(states);
  if (!statesSet.has(initialState)) {
    return { valid: false, error: 'AFN inválido: initialState deve pertencer a states.' };
  }

  if (!isStringArray(acceptStates) || !hasOnlyKnownStates(acceptStates, statesSet)) {
    return { valid: false, error: 'AFN inválido: acceptStates deve conter estados válidos.' };
  }

  if (!isRecord(transitions)) {
    return { valid: false, error: 'AFN inválido: transitions deve ser um objeto.' };
  }

  for (const state of states) {
    const byState = transitions[state];
    if (!isRecord(byState)) {
      return { valid: false, error: `AFN inválido: transitions.${state} deve ser um objeto.` };
    }

    for (const symbol of [...alphabet, 'ε']) {
      const targetStates = byState[symbol];
      if (targetStates === undefined) continue;
      if (!Array.isArray(targetStates) || !targetStates.every((target) => typeof target === 'string')) {
        return {
          valid: false,
          error: `AFN inválido: transitions.${state}.${symbol} deve ser array de estados.`,
        };
      }

      const hasUnknown = targetStates.some((target) => !statesSet.has(target));
      if (hasUnknown) {
        return {
          valid: false,
          error: `AFN inválido: transitions.${state}.${symbol} contém estado inexistente.`,
        };
      }
    }
  }

  return { valid: true, value: input as NfaDefinition };
}
