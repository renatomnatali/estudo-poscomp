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

  it('possui rotas API da especificação', () => {
    expect(exists('app/api/content/topics/route.ts')).toBe(true);
    expect(exists('app/api/content/topics/[slug]/route.ts')).toBe(true);
    expect(exists('app/api/questions/route.ts')).toBe(true);
    expect(exists('app/api/simulator/afd/run/route.ts')).toBe(true);
    expect(exists('app/api/simulator/afd/minimize/route.ts')).toBe(true);
    expect(exists('app/api/simulator/afn/convert/route.ts')).toBe(true);
    expect(exists('app/api/assessment/submit/route.ts')).toBe(true);
  });
});
