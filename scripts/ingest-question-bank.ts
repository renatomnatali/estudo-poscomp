import fs from 'node:fs/promises';
import path from 'node:path';

import { Prisma, PrismaClient } from '@prisma/client';

import { buildQuestionBankFromPdfs } from '../lib/question-ingestion';

const YEARS = [2022, 2023, 2024, 2025];
const DATASET_OUTPUT = path.resolve(
  process.cwd(),
  'data',
  'questions',
  'poscomp',
  'poscomp-2022-2025.generated.json'
);

async function writeDatasetFile(payload: unknown) {
  await fs.mkdir(path.dirname(DATASET_OUTPUT), { recursive: true });
  await fs.writeFile(DATASET_OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function persistQuestions() {
  const dryRun = process.argv.includes('--dry-run');

  const result = await buildQuestionBankFromPdfs({
    provasDir: path.resolve(process.cwd(), 'docs', 'Provas'),
    years: YEARS,
  });

  await writeDatasetFile({
    version: 1,
    generatedAt: result.generatedAt,
    stats: result.stats,
    warnings: result.warnings,
    questions: result.questions,
  });

  if (dryRun) {
    // eslint-disable-next-line no-console
    console.log('[ingest] Dry-run concluído.');
    // eslint-disable-next-line no-console
    console.log(`[ingest] Questões: ${result.stats.total} | Missing gabarito: ${result.stats.missingAnswerKeys} | Warnings: ${result.stats.parseWarnings}`);
    return;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não configurada.');
  }

  const prisma = new PrismaClient();

  try {
    for (const question of result.questions) {
      await prisma.question.upsert({
        where: { id: question.id },
        update: {
          year: question.year,
          source: question.source,
          number: question.number,
          macroArea: question.macroArea,
          subTopic: question.subTopic,
          difficulty: question.difficulty,
          stem: question.stem,
          answerKey: question.answerKey,
          tags: question.tags,
          explanation: question.explanation ?? null,
          optionExplanations: question.optionExplanations ?? Prisma.JsonNull,
        },
        create: {
          id: question.id,
          year: question.year,
          source: question.source,
          number: question.number,
          macroArea: question.macroArea,
          subTopic: question.subTopic,
          difficulty: question.difficulty,
          stem: question.stem,
          answerKey: question.answerKey,
          tags: question.tags,
          explanation: question.explanation ?? null,
          optionExplanations: question.optionExplanations ?? Prisma.JsonNull,
        },
      });

      await prisma.questionOption.deleteMany({
        where: { questionId: question.id },
      });

      await prisma.questionOption.createMany({
        data: question.options.map((option) => ({
          questionId: question.id,
          key: option.key,
          text: option.text,
        })),
      });
    }

    await prisma.ingestionReport.create({
      data: {
        source: 'pdf-poscomp-2022-2025',
        version: 'v1',
        totalQuestions: result.stats.total,
        missingAnswerKey: result.stats.missingAnswerKeys,
        parseWarnings: result.stats.parseWarnings,
        metadata: {
          byYear: result.stats.byYear,
          warnings: result.warnings.slice(0, 200),
        },
      },
    });

    // eslint-disable-next-line no-console
    console.log('[ingest] Persistência concluída com sucesso.');
    // eslint-disable-next-line no-console
    console.log(`[ingest] Questões: ${result.stats.total} | Missing gabarito: ${result.stats.missingAnswerKeys} | Warnings: ${result.stats.parseWarnings}`);
  } finally {
    await prisma.$disconnect();
  }
}

persistQuestions().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[ingest] Falha:', error);
  process.exit(1);
});
