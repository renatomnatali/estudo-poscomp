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

export async function api(path: string, init?: RequestInit) {
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

  return res.json();
}
