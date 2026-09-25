export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    /**
     * O corpo cru da resposta de erro. Nem toda recusa é só uma mensagem:
     * algumas carregam o que o servidor CONSEGUIU fazer antes de parar, e a
     * tela precisa disso para não contradizer o banco.
     */
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Cliente HTTP das rotas /api. `T` tipa o corpo de sucesso esperado pelo
 * consumidor; respostas 204 (sem corpo) resolvem `null` — `res.json()`
 * lançaria SyntaxError em corpo vazio.
 */
export async function api<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T | null> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(
      body?.error || "Erro na requisição",
      res.status,
      body?.code,
      body,
    );
  }

  if (res.status === 204) return null;

  return res.json() as Promise<T | null>;
}
