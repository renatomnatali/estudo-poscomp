import { vi, type MockInstance } from 'vitest';

type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

export interface ConsoleSilencer {
  spies: Record<ConsoleMethod, MockInstance | undefined>;
  /** Restaura todos os métodos espionados. */
  restore: () => void;
  /** Atalho para `mock.calls` do primeiro método silenciado. */
  readonly calls: unknown[][];
}

/**
 * Silencia métodos do console durante um teste — substitui o boilerplate
 * `vi.spyOn(console, 'error').mockImplementation(() => {})` + `mockRestore()`.
 *
 * Uso:
 * ```ts
 * it('...', async () => {
 *   const silence = silenceConsole('error');
 *   try {
 *     // ... rodar código que loga em console.error
 *     expect(silence.calls.length).toBeGreaterThan(0); // opcional
 *   } finally {
 *     silence.restore();
 *   }
 * });
 * ```
 */
export function silenceConsole(...methods: ConsoleMethod[]): ConsoleSilencer {
  const targets = methods.length === 0 ? (['error'] as ConsoleMethod[]) : methods;
  const spies = {} as Record<ConsoleMethod, MockInstance | undefined>;

  for (const m of targets) {
    spies[m] = vi.spyOn(console, m).mockImplementation(() => {});
  }

  return {
    spies,
    restore: () => {
      for (const m of targets) {
        spies[m]?.mockRestore();
      }
    },
    get calls() {
      return (spies[targets[0]]?.mock.calls ?? []) as unknown[][];
    },
  };
}
