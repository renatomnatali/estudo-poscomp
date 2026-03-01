import { PrismaClient } from '@prisma/client';

import { loadFlashcardMaterialPackage, validateFlashcardMaterialPackage } from '../lib/flashcard-content';

async function ingestFlashcards() {
  const dryRun = process.argv.includes('--dry-run');
  const payload = loadFlashcardMaterialPackage();
  const validation = validateFlashcardMaterialPackage(payload);

  if (!validation.valid) {
    throw new Error(`Pacote de flashcards inválido:\n- ${validation.errors.join('\n- ')}`);
  }

  if (dryRun) {
    // eslint-disable-next-line no-console
    console.log(
      `[flashcards] Dry-run: ${payload.decks.length} decks, ${payload.decks.reduce((sum, deck) => sum + deck.cards.length, 0)} cartas válidas.`
    );
    return;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não configurada.');
  }

  const prisma = new PrismaClient();

  try {
    for (const deck of payload.decks) {
      await prisma.flashcardDeck.upsert({
        where: { id: deck.id },
        update: {
          slug: deck.slug,
          title: deck.title,
          macroArea: deck.macroArea,
          subTopic: deck.subTopic,
          difficulty: deck.difficulty,
          description: deck.description,
          estimatedMinutes: deck.estimatedMinutes,
        },
        create: {
          id: deck.id,
          slug: deck.slug,
          title: deck.title,
          macroArea: deck.macroArea,
          subTopic: deck.subTopic,
          difficulty: deck.difficulty,
          description: deck.description,
          estimatedMinutes: deck.estimatedMinutes,
        },
      });

      await prisma.flashcard.deleteMany({ where: { deckId: deck.id } });

      if (deck.cards.length > 0) {
        await prisma.flashcard.createMany({
          data: deck.cards.map((card) => ({
            id: card.id,
            deckId: deck.id,
            front: card.front,
            back: card.back,
            explanation: card.explanation,
            tags: card.tags,
            sourceTopicSlug: card.sourceTopicSlug || null,
            sourceQuestionId: card.sourceQuestionId || null,
            order: card.order,
          })),
        });
      }
    }

    // eslint-disable-next-line no-console
    console.log(
      `[flashcards] Ingestão concluída: ${payload.decks.length} decks e ${payload.decks.reduce((sum, deck) => sum + deck.cards.length, 0)} cartas.`
    );
  } finally {
    await prisma.$disconnect();
  }
}

ingestFlashcards().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[flashcards] Falha na ingestão:', error);
  process.exit(1);
});
