import { describe, expect, it } from 'vitest';

import { loadFlashcardMaterialPackage, validateFlashcardMaterialPackage } from '@/lib/flashcard-content';

describe('flashcard-content-validation', () => {
  it('valida pacote de flashcards de fundamentos', () => {
    const payload = loadFlashcardMaterialPackage();
    const validation = validateFlashcardMaterialPackage(payload);

    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
    expect(payload.decks.length).toBeGreaterThan(0);
  });

  it('falha quando deck não possui cartas', () => {
    const payload = loadFlashcardMaterialPackage();
    const clone = structuredClone(payload);
    clone.decks[0].cards = [];

    const validation = validateFlashcardMaterialPackage(clone);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((error) => error.includes('deve conter ao menos uma carta'))).toBe(true);
  });
});
