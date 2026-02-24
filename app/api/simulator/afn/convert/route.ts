import { NextResponse } from 'next/server';

import { convertNfaToDfa } from '@/lib/automata-core';
import type { NfaDefinition } from '@/lib/types';

export async function POST(request: Request) {
  const body = await request.json();
  const automaton = body?.automaton as NfaDefinition | undefined;

  if (!automaton) {
    return NextResponse.json(
      { error: 'Payload inválido. Envie automaton.' },
      { status: 400 }
    );
  }

  try {
    const converted = convertNfaToDfa(automaton);
    return NextResponse.json(converted);
  } catch (error) {
    return NextResponse.json(
      { error: `Falha ao converter AFN: ${(error as Error).message}` },
      { status: 400 }
    );
  }
}
