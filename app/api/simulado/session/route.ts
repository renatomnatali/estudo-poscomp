import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

import { isClerkEnabledServer } from '@/lib/auth-config';
import { resolveUserEntitlements } from '@/lib/entitlements';
import { listQuestions } from '@/lib/questions-repo';
import type { MacroArea, Question, SimuladoMode } from '@/lib/types';

const SESSION_CONFIG: Record<SimuladoMode, { questionCount: number; minutes: number; premium: boolean }> = {
  partial: { questionCount: 20, minutes: 45, premium: false },
  full: { questionCount: 70, minutes: 240, premium: true },
  area: { questionCount: 25, minutes: 60, premium: true },
};

const VALID_MACRO_AREAS = new Set<MacroArea>(['fundamentos', 'matematica', 'tecnologia']);

function getFallbackUserId(request: Request, payloadUserId?: unknown) {
  const fromBody = String(payloadUserId || '').trim();
  if (fromBody) return fromBody;

  const { searchParams } = new URL(request.url);
  const fromQuery = String(searchParams.get('userId') || '').trim();
  if (fromQuery) return fromQuery;

  const fromHeader = String(request.headers.get('x-user-id') || '').trim();
  if (fromHeader) return fromHeader;

  return 'local-dev-user';
}

function getFallbackEmail(request: Request, payloadEmail?: unknown) {
  const fromBody = String(payloadEmail || '').trim();
  if (fromBody) return fromBody;

  const { searchParams } = new URL(request.url);
  const fromQuery = String(searchParams.get('email') || '').trim();
  if (fromQuery) return fromQuery;

  const fromHeader = String(request.headers.get('x-user-email') || '').trim();
  if (fromHeader) return fromHeader;

  return process.env.DEV_USER_EMAIL || undefined;
}

async function resolveIdentity(
  request: Request,
  payloadUserId?: unknown,
  payloadEmail?: unknown
): Promise<{ userId?: string; email?: string }> {
  if (isClerkEnabledServer()) {
    const session = await auth();
    if (!session.userId) return {};

    const user = typeof currentUser === 'function' ? await currentUser().catch(() => null) : null;
    const email =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      undefined;

    return { userId: session.userId, email };
  }

  return {
    userId: getFallbackUserId(request, payloadUserId),
    email: getFallbackEmail(request, payloadEmail),
  };
}

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
  const identity = await resolveIdentity(request, body?.userId, body?.email);

  if (isClerkEnabledServer() && !identity.userId) {
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
