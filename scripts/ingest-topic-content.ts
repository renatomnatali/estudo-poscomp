import { Prisma, PrismaClient } from '@prisma/client';

import { loadTopicMaterialPackage, validateTopicMaterialPackage } from '../lib/topic-content';

async function ingestTopicContent() {
  const dryRun = process.argv.includes('--dry-run');
  const payload = loadTopicMaterialPackage();
  const validation = validateTopicMaterialPackage(payload);

  if (!validation.valid) {
    throw new Error(`Pacote de tópicos inválido:\n- ${validation.errors.join('\n- ')}`);
  }

  if (dryRun) {
    // eslint-disable-next-line no-console
    console.log(`[topics] Dry-run: ${payload.topics.length} tópicos válidos.`);
    return;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não configurada.');
  }

  const prisma = new PrismaClient();
  try {
    for (const topic of payload.topics) {
      await prisma.topic.upsert({
        where: { id: topic.id },
        update: {
          slug: topic.slug,
          title: topic.title,
          macroArea: topic.macroArea,
          subTopic: topic.subTopic,
          difficulty: topic.difficulty,
          incidence: topic.incidence,
          estimatedMinutes: topic.estimatedMinutes,
          prerequisites: topic.prerequisites,
          learningObjectives: topic.learningObjectives,
          sourceLessons: topic.sourceLessons,
        },
        create: {
          id: topic.id,
          slug: topic.slug,
          title: topic.title,
          macroArea: topic.macroArea,
          subTopic: topic.subTopic,
          difficulty: topic.difficulty,
          incidence: topic.incidence,
          estimatedMinutes: topic.estimatedMinutes,
          prerequisites: topic.prerequisites,
          learningObjectives: topic.learningObjectives,
          sourceLessons: topic.sourceLessons,
        },
      });

      await prisma.topicSection.deleteMany({ where: { topicId: topic.id } });
      await prisma.topicExample.deleteMany({ where: { topicId: topic.id } });
      await prisma.topicApplication.deleteMany({ where: { topicId: topic.id } });
      await prisma.topicReference.deleteMany({ where: { topicId: topic.id } });
      await prisma.topicQuickCheck.deleteMany({ where: { topicId: topic.id } });

      if (topic.sections.length > 0) {
        await prisma.topicSection.createMany({
          data: topic.sections.map((item) => ({
            id: item.id,
            topicId: topic.id,
            kind: item.kind,
            title: item.title,
            content: item.content,
            order: item.order,
          })),
        });
      }

      if (topic.examples.length > 0) {
        await prisma.topicExample.createMany({
          data: topic.examples.map((item) => ({
            id: item.id,
            topicId: topic.id,
            title: item.title,
            problem: item.problem,
            strategy: item.strategy,
            solution: item.solution,
            takeaway: item.takeaway,
            order: item.order,
          })),
        });
      }

      if (topic.applications.length > 0) {
        await prisma.topicApplication.createMany({
          data: topic.applications.map((item) => ({
            id: item.id,
            topicId: topic.id,
            title: item.title,
            context: item.context,
            howItApplies: item.howItApplies,
            order: item.order,
          })),
        });
      }

      if (topic.references.length > 0) {
        await prisma.topicReference.createMany({
          data: topic.references.map((item) => ({
            id: item.id,
            topicId: topic.id,
            label: item.label,
            url: item.url,
            order: item.order,
          })),
        });
      }

      if (topic.quickChecks.length > 0) {
        await prisma.topicQuickCheck.createMany({
          data: topic.quickChecks.map((item) => ({
            id: item.id,
              topicId: topic.id,
              prompt: item.prompt,
              options: item.options as unknown as Prisma.InputJsonValue,
              answerKey: item.answerKey,
              explanation: item.explanation,
              order: item.order,
          })),
        });
      }
    }

    // eslint-disable-next-line no-console
    console.log(`[topics] Ingestão concluída: ${payload.topics.length} tópicos.`);
  } finally {
    await prisma.$disconnect();
  }
}

ingestTopicContent().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[topics] Falha na ingestão:', error);
  process.exit(1);
});
