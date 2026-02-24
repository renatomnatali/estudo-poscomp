import { NextResponse } from 'next/server';

import { minimizeDfa } from '@/lib/automata-core';
import { validateDfaDefinition } from '@/lib/automata-validation';
import type { DfaDefinition } from '@/lib/types';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido: JSON malformado.' }, { status: 400 });
  }

  const record = body as { automaton?: unknown };
  const validation = validateDfaDefinition(record?.automaton);

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error ?? 'Payload inválido. Envie automaton.' },
      { status: 400 }
    );
  }

  const automaton = validation.value as DfaDefinition;
  try {
    const minimized = minimizeDfa(automaton);
    return NextResponse.json({
      original: automaton,
      reachableStates: minimized.reachableStates,
      removedUnreachable: minimized.removedUnreachable,
      partitions: minimized.partitions,
      stateMap: minimized.stateMap,
      mergedStates: minimized.mergedStates,
      minimized: minimized.minimized,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Falha ao minimizar AFD: ${(error as Error).message}` },
      { status: 400 }
    );
  }
}
