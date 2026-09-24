/**
 * Helper para testar rotas que usam `after()` do next/server.
 *
 * O `after()` real lança fora de request scope (Next 15), o que impediria
 * exercitar os handlers em vitest. Este mock enfileira o callback e devolve
 * o `flushAfter` para executá-lo deterministicamente DENTRO do teste:
 *
 * ```ts
 * import { setupAfterMock } from '@/tests/test-utils/after-mock';
 *
 * const { flushAfter } = setupAfterMock();
 *
 * it('fluxo X', async () => {
 *   const res = await POST(req);
 *   expect(res.status).toBe(200); // response ANTES do flush (proteção de timing)
 *   await flushAfter();           // executa o trabalho de background
 *   expect(db.x.create).toHaveBeenCalled();
 * });
 * ```
 *
 * O `vi.mock('next/server')` deste módulo espalha o `importActual`, então
 * NextRequest/NextResponse seguem REAIS — só o `after` é substituído.
 * IMPORTAR este arquivo (primeiro nos imports) já aplica o mock à rota.
 */
import { beforeEach, vi } from 'vitest';

const { callbacks } = vi.hoisted(() => ({
  callbacks: [] as Array<() => Promise<void> | void>,
}));

vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server');
  return {
    ...actual,
    after: (cb: () => Promise<void> | void) => {
      callbacks.push(cb);
    },
  };
});

export function setupAfterMock() {
  // Reseta a fila entre testes — evita bleeding de callbacks pendentes
  // de um teste que falhou antes do flush.
  beforeEach(() => {
    callbacks.length = 0;
  });

  async function flushAfter(): Promise<void> {
    while (callbacks.length > 0) {
      const cb = callbacks.shift()!;
      await cb();
    }
  }

  return { flushAfter };
}
