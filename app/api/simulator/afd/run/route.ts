import { NextResponse } from 'next/server';

import { simulateDfa } from '@/lib/automata-core';
import type { DfaDefinition } from '@/lib/types';

export async function POST(request: Request) {
  const body = await request.json();
  const automaton = body?.automaton as DfaDefinition | undefined;
  const inputWord = body?.inputWord;

  if (!automaton || typeof inputWord !== 'string') {
    return NextResponse.json(
      { error: 'Payload inválido. Envie automaton e inputWord.' },
      { status: 400 }
    );
  }

  const result = simulateDfa(automaton, inputWord);
  return NextResponse.json(result);
}
