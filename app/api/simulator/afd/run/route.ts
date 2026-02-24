import { NextResponse } from 'next/server';

import { simulateDfa } from '@/lib/automata-core';
import { validateDfaDefinition } from '@/lib/automata-validation';
import type { DfaDefinition } from '@/lib/types';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido: JSON malformado.' }, { status: 400 });
  }

  const record = body as { automaton?: unknown; inputWord?: unknown };
  const inputWord = record?.inputWord;
  const validation = validateDfaDefinition(record?.automaton);

  if (!validation.valid || typeof inputWord !== 'string') {
    return NextResponse.json(
      {
        error:
          validation.error ??
          'Payload inválido. Envie automaton e inputWord.',
      },
      { status: 400 }
    );
  }

  const automaton = validation.value as DfaDefinition;
  const result = simulateDfa(automaton, inputWord);
  return NextResponse.json(result);
}
