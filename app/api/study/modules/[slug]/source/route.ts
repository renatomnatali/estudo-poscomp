import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { NextResponse } from 'next/server';

import { getStudyModule } from '@/lib/study-data';

interface ModuleSourcePayload {
  header: {
    badge: string;
    title: string;
    subtitle: string;
    meta: string[];
    progressLabel: string;
  };
  navLinks: Array<{ id: string; label: string }>;
  html: string;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  if (!getStudyModule(slug)) {
    return NextResponse.json({ error: 'Modulo nao encontrado.' }, { status: 404 });
  }

  const sourcePath = path.join(
    process.cwd(),
    'data',
    'study',
    'modules',
    `${slug}.source.json`
  );

  const rawSource = await readFile(sourcePath, 'utf8').catch(() => null);
  if (!rawSource) {
    return NextResponse.json({ error: 'Conteúdo de módulo não encontrado.' }, { status: 404 });
  }

  const payload = JSON.parse(rawSource) as ModuleSourcePayload;
  return NextResponse.json(payload);
}
