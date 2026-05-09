import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildImportedModuleSource } from '@/scripts/ingest-study-modules';

function loadMockup(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('study-modules ingestion', () => {
  it('extrai header no padrão hero-tag (F1.1)', () => {
    const payload = buildImportedModuleSource(loadMockup('Spec/mockup/import/f1-1-algoritmos-referencia_4.html'));

    expect(payload.header.badge).toBe('ANÁLISE DE ALGORITMOS · F1.1');
    expect(payload.header.title).toBe('Algoritmos de Referência');
    expect(payload.header.subtitle).toContain('Antes de medir a eficiência de algoritmos');
    expect(payload.header.progressLabel).toBe('F1.1 — Algoritmos de Referência');
    expect(payload.navLinks[0]).toEqual({ id: 'porque', label: '1. Por que ver antes?' });
  });

  it('extrai header no padrão hero-tag (F1.2)', () => {
    const payload = buildImportedModuleSource(loadMockup('Spec/mockup/import/f1-2-notacoes-assintoticas-v7.html'));

    expect(payload.header.badge).toBe('ANÁLISE DE ALGORITMOS · F1.2');
    expect(payload.header.title).toBe('Notações Assintóticas');
    expect(payload.header.subtitle).toContain('Como medir a eficiência de algoritmos');
    expect(payload.header.progressLabel).toBe('F1.2 — Notações Assintóticas');
    expect(payload.navLinks[0]).toEqual({ id: 'motivacao', label: '1. Por que medir?' });
  });

  it('mantém didática de intuição antes da formalização na Regra 1 do F1.2', () => {
    const payload = buildImportedModuleSource(loadMockup('Spec/mockup/import/f1-2-notacoes-assintoticas-v7.html'));

    const rule1Start = payload.html.indexOf('Regra 1 — Eliminar constantes multiplicativas');
    const rule2Start = payload.html.indexOf('Regra 2 —');

    expect(rule1Start).toBeGreaterThan(-1);
    expect(rule2Start).toBeGreaterThan(rule1Start);

    const rule1Slice = payload.html.slice(rule1Start, rule2Start);
    const intuitionIndex = rule1Slice.indexOf('Pense em loops idênticos executados um após o outro');
    const formalizingIndex = rule1Slice.indexOf('Por quê formalmente?');

    expect(intuitionIndex).toBeGreaterThan(-1);
    expect(formalizingIndex).toBeGreaterThan(intuitionIndex);
    expect(rule1Slice).toContain('c = 5 e n₀ = 1');
  });

  it('preserva handlers inline e script para módulos com simulação', () => {
    const f11 = buildImportedModuleSource(loadMockup('Spec/mockup/import/f1-1-algoritmos-referencia_4.html'));
    const f13 = buildImportedModuleSource(loadMockup('Spec/mockup/import/f1-3-analise-recorrencias-v3_1.html'));

    expect(f11.script).toContain('function linearStart()');
    expect(f11.html).toContain('onclick="linearStart()"');
    expect(f11.html).toContain('onchange="binaryReset()"');

    expect(f13.script).toContain('function setPreset(key)');
    expect(f13.html).toContain("onclick=\"setMasterPreset('merge')\"");
    expect(f13.html).toContain("onclick=\"quizAnswer('q1', this, 'A')\"");
  });
});
