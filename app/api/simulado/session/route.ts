import { NextRequest, NextResponse } from 'next/server';

import { resolveUserEntitlements } from '@/lib/entitlements';
import { listQuestions } from '@/lib/questions-repo';
import { resolveRouteIdentity } from '@/lib/route-identity';
import type { MacroArea, Question, SimuladoMode } from '@/lib/types';

const SESSION_CONFIG: Record<SimuladoMode, { questionCount: number; minutes: number; premium: boolean }> = {
  partial: { questionCount: 20, minutes: 45, premium: false },
  full: { questionCount: 70, minutes: 240, premium: true },
  area: { questionCount: 25, minutes: 60, premium: true },
};

const VALID_MACRO_AREAS = new Set<MacroArea>(['fundamentos', 'matematica', 'tecnologia']);

function parseMode(value: unknown): SimuladoMode | null {
  const normalized = String(value || '').trim() as SimuladoMode;
  return normalized in SESSION_CONFIG ? normalized : null;
}

function parseMacroArea(value: unknown): MacroArea {
  const normalized = String(value || '').trim() as MacroArea;
  return VALID_MACRO_AREAS.has(normalized) ? normalized : 'fundamentos';
}

function sliceQuestions(questions: Question[], limit: number) {
  if (!Array.isArray(questions)) return [];
  return questions.slice(0, limit);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const mode = parseMode(body?.mode);

  if (!mode) {
    return NextResponse.json(
      { error: 'Modo inválido. Use partial, full ou area.' },
      { status: 400 }
    );
  }

  const config = SESSION_CONFIG[mode];
  const identity = await resolveRouteIdentity(request, body?.userId, body?.email);

  if (!identity.userId) {
    return NextResponse.json(
      { error: 'Autenticação necessária para iniciar o simulado.' },
      { status: 401 }
    );
  }

  if (config.premium) {
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

  const macroArea = mode === 'area' ? parseMacroArea(body?.macroArea) : 'fundamentos';
  const questions = await listQuestions({
    macroArea,
    limit: String(config.questionCount),
  });

  return NextResponse.json({
    mode,
    config,
    items: sliceQuestions(questions, config.questionCount),
  });
}
