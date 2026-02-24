import { NextResponse } from 'next/server';

import { minimizeDfa } from '@/lib/automata-core';
import type { DfaDefinition } from '@/lib/types';

export async function POST(request: Request) {
  const body = await request.json();
  const automaton = body?.automaton as DfaDefinition | undefined;

  if (!automaton) {
    return NextResponse.json(
      { error: 'Payload inválido. Envie automaton.' },
      { status: 400 }
    );
  }

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
