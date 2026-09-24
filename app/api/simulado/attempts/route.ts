import { NextRequest, NextResponse } from 'next/server';

import { resolveUserEntitlements } from '@/lib/entitlements';
import { resolveRouteIdentity } from '@/lib/route-identity';
import { createSimuladoAttempt, listSimuladoAttempts } from '@/lib/simulado-attempts-repo';
import type { SimuladoMode } from '@/lib/types';

const VALID_MODES = new Set<SimuladoMode>(['partial', 'full', 'area']);

function isValidNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value);
}

export async function GET(request: NextRequest) {
  const identity = await resolveRouteIdentity(request);
  if (!identity.userId) {
    return NextResponse.json(
      { error: 'Autenticação necessária para consultar tentativas.' },
      { status: 401 }
    );
  }

  const limit = request.nextUrl.searchParams.get('limit') || '5';
  const payload = await listSimuladoAttempts({ userId: identity.userId, limit });

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const identity = await resolveRouteIdentity(request, body?.userId, body?.email);

  if (!identity.userId) {
    return NextResponse.json(
      { error: 'Autenticação necessária para registrar tentativa.' },
      { status: 401 }
    );
  }

  const mode = String(body?.mode || '').trim() as SimuladoMode;
  const total = Number(body?.total);
  const correct = Number(body?.correct);
  const accuracy = Number(body?.accuracy);
  const durationSeconds =
    body?.durationSeconds === null || typeof body?.durationSeconds === 'undefined'
      ? null
      : Number(body.durationSeconds);

  if (!VALID_MODES.has(mode)) {
    return NextResponse.json(
      { error: 'Modo inválido. Use partial, full ou area.' },
      { status: 400 }
    );
  }

  const requiresPremium = mode === 'full' || mode === 'area';
  if (requiresPremium) {
    const entitlements = await resolveUserEntitlements({
      userId: identity.userId,
      email: identity.email,
    });

    if (!entitlements.isPremium) {
      return NextResponse.json(
        { error: 'Modo premium disponível apenas para assinantes Premium ou usuários VIP.' },
        { status: 403 }
      );
    }
  }

  if (!Number.isInteger(total) || total <= 0) {
    return NextResponse.json(
      { error: 'Total de questões inválido.' },
      { status: 400 }
    );
  }

  if (!Number.isInteger(correct) || correct < 0 || correct > total) {
    return NextResponse.json(
      { error: 'Quantidade de acertos inválida.' },
      { status: 400 }
    );
  }

  if (!isValidNumber(accuracy) || accuracy < 0 || accuracy > 1) {
    return NextResponse.json(
      { error: 'Acurácia inválida. Use valor entre 0 e 1.' },
      { status: 400 }
    );
  }

  if (durationSeconds !== null && (!Number.isInteger(durationSeconds) || durationSeconds < 0)) {
    return NextResponse.json(
      { error: 'Duração inválida.' },
      { status: 400 }
    );
  }

  const recommendedNextTopics = Array.isArray(body?.recommendedNextTopics)
    ? body.recommendedNextTopics
        .map((entry: unknown) => String(entry || '').trim())
        .filter((entry: string) => entry.length > 0)
    : [];

  const created = await createSimuladoAttempt({
    userId: identity.userId,
    mode,
    total,
    correct,
    accuracy,
    durationSeconds,
    recommendedNextTopics,
  });

  return NextResponse.json(created, { status: 201 });
}
