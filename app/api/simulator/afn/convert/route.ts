import { NextResponse } from 'next/server';

import { convertNfaToDfa } from '@/lib/automata-core';
import { validateNfaDefinition } from '@/lib/automata-validation';
import type { NfaDefinition } from '@/lib/types';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido: JSON malformado.' }, { status: 400 });
  }

  const record = body as { automaton?: unknown };
  const validation = validateNfaDefinition(record?.automaton);

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error ?? 'Payload inválido. Envie automaton.' },
      { status: 400 }
    );
  }

  const automaton = validation.value as NfaDefinition;
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
