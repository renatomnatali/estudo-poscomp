import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '..', '..');

function exists(rel: string) {
  return fs.existsSync(path.join(root, rel));
}

describe('estrutura Next App Router', () => {
  it('possui arquivos mínimos de app', () => {
    expect(exists('app/layout.tsx')).toBe(true);
    expect(exists('app/page.tsx')).toBe(true);
    expect(exists('app/globals.css')).toBe(true);
    expect(
      exists('next.config.ts') || exists('next.config.mjs') || exists('next.config.js')
    ).toBe(true);
    expect(exists('tsconfig.json')).toBe(true);
  });

  it('possui rotas web públicas e de estudo previstas no mockup', () => {
    expect(exists('app/page.tsx')).toBe(true);
    expect(exists('app/entrar/[[...sign-in]]/page.tsx')).toBe(true);
    expect(exists('app/cadastro/[[...sign-up]]/page.tsx')).toBe(true);
    expect(exists('app/demo/page.tsx')).toBe(true);

    expect(exists('app/dashboard/page.tsx')).toBe(true);
    expect(exists('app/trilhas/page.tsx')).toBe(true);
    expect(exists('app/trilhas/f6/[moduleSlug]/page.tsx')).toBe(true);
    expect(exists('app/flashcards/page.tsx')).toBe(true);
    expect(exists('app/simulado/page.tsx')).toBe(true);
    expect(exists('app/premium/page.tsx')).toBe(true);
  });

  it('possui rotas API da especificação de estudo', () => {
    expect(exists('app/api/study/dashboard/summary/route.ts')).toBe(true);
    expect(exists('app/api/study/tracks/catalog/route.ts')).toBe(true);
    expect(exists('app/api/study/modules/[slug]/route.ts')).toBe(true);
    expect(exists('app/api/study/modules/[slug]/source/route.ts')).toBe(true);
    expect(exists('app/api/study/modules/[slug]/quiz/route.ts')).toBe(true);
    expect(exists('app/api/study/modules/[slug]/progress/route.ts')).toBe(true);
  });
});
