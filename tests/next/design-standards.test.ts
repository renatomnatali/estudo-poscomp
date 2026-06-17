import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '..', '..');

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

describe('padrões de design', () => {
  it('mantém botão base com formato semi-retangular no app', () => {
    const globalsCss = read('app/globals.css');
    expect(globalsCss).toContain('.button {');
    expect(globalsCss).toContain('rounded-xl');
    expect(globalsCss).not.toContain('@apply rounded-full px-4 py-2 text-sm font-semibold;');
  });

  it('mantém guia oficial de UI versionado', () => {
    const uiGuide = read('docs/design/ui-standards.md');
    expect(uiGuide).toContain('Padrões de UI (Obrigatório)');
    expect(uiGuide).toContain('Botões (padrão oficial)');
    expect(uiGuide).toContain('Botões de ação usam formato semi-retangular');
  });

  it('mantém estilos base para blocos importados do módulo F1.1', () => {
    const globalsCss = read('app/globals.css');
    expect(globalsCss).toContain('.module-import-body .notation-grid');
    expect(globalsCss).toContain('.module-import-body .notation-card');
    expect(globalsCss).toContain('.module-import-body .complexity-chart');
    expect(globalsCss).toContain('.module-import-body .proof-step');
    expect(globalsCss).toContain('.module-import-body .quiz-box');
    expect(globalsCss).toContain('.module-import-body .summary-box');
  });
});
