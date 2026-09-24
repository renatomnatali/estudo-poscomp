import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Espelho do sem-cilada (src/app/api/auth/me/route.ts), sem adaptações.

export async function GET() {
  const session = await getSession();
  if (!session) {
    // 204 em vez de 401 — evita erro vermelho no console do browser
    // para visitantes não autenticados (o client chama /me para todos)
    return new NextResponse(null, { status: 204 });
  }

  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, emailVerified: true, role: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 },
    );
  }

  return NextResponse.json(user);
}
