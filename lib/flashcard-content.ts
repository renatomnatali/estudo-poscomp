import fs from 'node:fs';
import path from 'node:path';

import type { FlashcardMaterial, FlashcardSeedCard, FlashcardSeedDeck } from '@/lib/types';

const FLASHCARD_PACKAGE_PATH = path.resolve(
  process.cwd(),
  'data',
  'flashcards',
  'fundamentos-v1.json'
);

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function normalizeCard(value: unknown, index: number): FlashcardSeedCard {
  const card = value as FlashcardSeedCard;
  return {
    id: card.id || `card-${index + 1}`,
    front: card.front || '',
    back: card.back || '',
    explanation: card.explanation || '',
    tags: Array.isArray(card.tags) ? card.tags : [],
    sourceTopicSlug: card.sourceTopicSlug,
    sourceQuestionId: card.sourceQuestionId,
    order: Number(card.order ?? index + 1),
  };
}

function normalizeDeck(value: unknown, index: number): FlashcardSeedDeck {
  const deck = value as FlashcardSeedDeck;
  const cards = Array.isArray(deck.cards) ? deck.cards.map(normalizeCard) : [];
  return {
    id: deck.id || `deck-${index + 1}`,
    slug: deck.slug || `deck-${index + 1}`,
    title: deck.title || `Deck ${index + 1}`,
    macroArea: deck.macroArea || 'fundamentos',
    subTopic: deck.subTopic || 'fundamentos_geral',
    difficulty: deck.difficulty || 'medium',
    description: deck.description || '',
    estimatedMinutes: Number(deck.estimatedMinutes ?? 10),
    cards,
  };
}

export function validateFlashcardMaterialPackage(payload: FlashcardMaterial): ValidationResult {
  const errors: string[] = [];

  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Pacote de flashcards inválido.'] };
  }

  if (!Array.isArray(payload.decks) || payload.decks.length === 0) {
    return { valid: false, errors: ['Pacote deve conter ao menos um deck.'] };
  }

  payload.decks.forEach((deck) => {
    if (!deck.slug) errors.push('Deck sem slug.');
    if (!deck.title) errors.push(`Deck ${deck.slug || '[sem slug]'} sem título.`);
    if (!Array.isArray(deck.cards) || deck.cards.length === 0) {
      errors.push(`Deck ${deck.slug} deve conter ao menos uma carta.`);
      return;
    }

    deck.cards.forEach((card) => {
      if (!card.front) errors.push(`Deck ${deck.slug} possui carta sem frente.`);
      if (!card.back) errors.push(`Deck ${deck.slug} possui carta sem verso.`);
      if (!card.explanation) errors.push(`Deck ${deck.slug} possui carta sem explicação.`);
    });
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function loadFlashcardMaterialPackage(): FlashcardMaterial {
  const raw = fs.readFileSync(FLASHCARD_PACKAGE_PATH, 'utf8');
  const parsed = JSON.parse(raw) as FlashcardMaterial;

  const decks = Array.isArray(parsed.decks) ? parsed.decks.map(normalizeDeck) : [];

  return {
    version: Number(parsed.version || 1),
    generatedAt: parsed.generatedAt || new Date().toISOString(),
    decks,
  };
}

export function getFlashcardPackagePath() {
  return FLASHCARD_PACKAGE_PATH;
}
