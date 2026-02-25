import fs from 'node:fs/promises';
import path from 'node:path';

import { PDFParse } from 'pdf-parse';

import type { Difficulty, MacroArea, Question, QuestionOption } from '@/lib/types';

const OPTION_KEYS: Array<QuestionOption['key']> = ['A', 'B', 'C', 'D', 'E'];

const MANUAL_2025_ANSWER_KEY: Record<number, Question['answerKey']> = {
  1: 'A', 2: 'E', 3: 'E', 4: 'C', 5: 'B', 6: 'A', 7: 'B', 8: 'C', 9: 'A', 10: 'A',
  11: 'B', 12: 'E', 13: '*', 14: 'C', 15: 'C', 16: 'D', 17: 'C', 18: 'A', 19: 'D', 20: 'B',
  21: 'C', 22: 'B', 23: 'D', 24: 'A', 25: 'C', 26: 'B', 27: 'D', 28: 'E', 29: 'D', 30: 'E',
  31: 'A', 32: 'E', 33: 'E', 34: 'C', 35: 'E', 36: 'D', 37: 'B', 38: 'A', 39: 'E', 40: 'D',
  41: 'A', 42: 'C', 43: 'B', 44: 'D', 45: 'A', 46: 'D', 47: 'A', 48: 'B', 49: 'A', 50: 'C',
  51: 'D', 52: 'E', 53: 'A', 54: 'C', 55: 'E', 56: 'A', 57: 'E', 58: 'E', 59: 'B', 60: 'C',
  61: 'B', 62: 'D', 63: 'A', 64: 'C', 65: 'D', 66: 'D', 67: 'B', 68: 'B', 69: 'D', 70: 'C',
};

const MANUAL_OPTION_OVERRIDES: Record<string, string[]> = {
  '2022-29': [
    'Apenas I.',
    'Apenas II.',
    'Apenas III.',
    'Apenas I e II.',
    'Apenas II e III.',
  ],
  '2024-46': [
    'Apenas I e II.',
    'Apenas III e IV.',
    'Apenas I, II e III.',
    'Apenas II, III e IV.',
    'I, II, III e IV.',
  ],
};

interface CadernoQuestion {
  number: number;
  stem: string;
  options: QuestionOption[];
}

interface BuildQuestionBankOptions {
  provasDir: string;
  years: number[];
}

interface BuildQuestionBankStats {
  total: number;
  byYear: Record<string, number>;
  missingAnswerKeys: number;
  parseWarnings: number;
}

export interface BuildQuestionBankResult {
  generatedAt: string;
  questions: Question[];
  stats: BuildQuestionBankStats;
  warnings: string[];
}

function normalizeText(raw: string): string {
  return raw
    .replace(/\r/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n');
}

function normalizeForMatch(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function inferDifficulty(stem: string): Difficulty {
  const length = stem.length;
  if (length > 520) return 'hard';
  if (length > 240) return 'medium';
  return 'easy';
}

function inferMacroArea(questionNumber: number): MacroArea {
  if (questionNumber <= 20) return 'matematica';
  if (questionNumber <= 50) return 'fundamentos';
  return 'tecnologia';
}

function inferSubTopic(stem: string, macroArea: MacroArea): string {
  if (macroArea !== 'fundamentos') {
    if (macroArea === 'matematica') return 'matematica_geral';
    return 'tecnologia_geral';
  }

  const normalized = normalizeForMatch(stem);

  if (normalized.includes('minimiz')) return 'minimizacao_afd';
  if (normalized.includes('epsilon') || normalized.includes('ε') || normalized.includes('e-fecho') || normalized.includes('fecho')) {
    if (normalized.includes('afn') || normalized.includes('nao determin')) return 'afn_epsilon';
  }
  if ((normalized.includes('afn') || normalized.includes('nao determin')) &&
    (normalized.includes('afd') || normalized.includes('determin')) &&
    (normalized.includes('convers') || normalized.includes('subconj'))) {
    return 'conversao_afn_afd';
  }
  if (normalized.includes('automato') || normalized.includes('afd') || normalized.includes('deterministico')) {
    return 'afd_modelagem_execucao';
  }

  return 'fundamentos_geral';
}

function buildOptions(block: string, warnings: string[], year: number, number: number): QuestionOption[] {
  const optionsByKey = new Map<QuestionOption['key'], string>();
  const pattern = /(?:^|\n)\s*([ABCDE])\)\s*([\s\S]*?)(?=(?:\n\s*[ABCDE]\)\s)|$)/g;
  let match = pattern.exec(block);
  while (match) {
    const key = match[1] as QuestionOption['key'];
    const text = match[2].trim();
    if (text.length > 0) optionsByKey.set(key, text);
    match = pattern.exec(block);
  }

  if (optionsByKey.size < 5) {
    const fallbackPattern = /\b([ABCDE])\)\s*([\s\S]*?)(?=\b[ABCDE]\)\s*|$)/g;
    let fallbackMatch = fallbackPattern.exec(block);
    while (fallbackMatch) {
      const key = fallbackMatch[1] as QuestionOption['key'];
      const text = fallbackMatch[2].trim();
      if (text.length > 0 && !optionsByKey.has(key)) {
        optionsByKey.set(key, text);
      }
      fallbackMatch = fallbackPattern.exec(block);
    }
  }

  const options = OPTION_KEYS.map((key) => ({
    key,
    text: optionsByKey.get(key) || 'Alternativa não extraída automaticamente do PDF.',
  }));

  if (optionsByKey.size < 5) {
    const overrideKey = `${year}-${number}`;
    const override = MANUAL_OPTION_OVERRIDES[overrideKey];
    if (override && override.length === 5) {
      return OPTION_KEYS.map((key, index) => ({
        key,
        text: override[index],
      }));
    }
    warnings.push(`Alternativas incompletas na questão ${year}-${number}.`);
  }

  return options;
}

function extractStem(block: string): string {
  const optionMatch = block.match(/(?:^|\n)\s*[ABCDE]\)\s*/);
  if (!optionMatch || typeof optionMatch.index !== 'number') {
    return block.trim();
  }

  return block.slice(0, optionMatch.index).trim();
}

function parseQuestionsFromCaderno(text: string, year: number, warnings: string[]): CadernoQuestion[] {
  const normalized = normalizeText(text);
  const marker = /QUEST[ÃA]O\s*(\d+)\s*[–-]\s*/gi;
  const starts: Array<{ number: number; start: number; markerEnd: number }> = [];
  let match = marker.exec(normalized);
  while (match) {
    starts.push({
      number: Number(match[1]),
      start: match.index,
      markerEnd: match.index + match[0].length,
    });
    match = marker.exec(normalized);
  }

  const parsed: CadernoQuestion[] = [];
  for (let index = 0; index < starts.length; index += 1) {
    const current = starts[index];
    const next = starts[index + 1];
    const end = next ? next.start : normalized.length;
    const rawBlock = normalized.slice(current.markerEnd, end)
      .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '')
      .replace(/\d+_POSCOMP_[^\n]*\n?/gi, '')
      .replace(/Execução:\s*Fundatec[^\n]*\n?/gi, '')
      .replace(/EXAME POSCOMP[^\n]*\n?/gi, '')
      .trim();

    const stem = extractStem(rawBlock);
    const options = buildOptions(rawBlock, warnings, year, current.number);

    parsed.push({
      number: current.number,
      stem,
      options,
    });
  }

  return parsed.sort((a, b) => a.number - b.number);
}

async function readPdfText(filePath: string): Promise<string> {
  const parser = new PDFParse({ data: await fs.readFile(filePath) });
  const text = await parser.getText();
  await parser.destroy();
  return text.text || '';
}

function parseAnswerMapFromText(raw: string): Map<number, Question['answerKey']> {
  const answerMap = new Map<number, Question['answerKey']>();
  const text = normalizeText(raw);

  const inlinePattern = /(\d{1,2})\s*-\s*([ABCDE*])/g;
  let inlineMatch = inlinePattern.exec(text);
  while (inlineMatch) {
    answerMap.set(Number(inlineMatch[1]), inlineMatch[2] as Question['answerKey']);
    inlineMatch = inlinePattern.exec(text);
  }

  const rowPattern = /^\s*(\d{1,2})\s+([ABCDE*])\s+/gm;
  let rowMatch = rowPattern.exec(text);
  while (rowMatch) {
    answerMap.set(Number(rowMatch[1]), rowMatch[2] as Question['answerKey']);
    rowMatch = rowPattern.exec(text);
  }

  const anuladaPattern = /^\s*(\d{1,2})\s+Anulada\b/gmi;
  let anuladaMatch = anuladaPattern.exec(text);
  while (anuladaMatch) {
    answerMap.set(Number(anuladaMatch[1]), '*');
    anuladaMatch = anuladaPattern.exec(text);
  }

  return answerMap;
}

async function loadAnswerMapByYear(provasDir: string, year: number): Promise<Map<number, Question['answerKey']>> {
  if (year === 2025) {
    return new Map(
      Object.entries(MANUAL_2025_ANSWER_KEY).map(([question, answer]) => [Number(question), answer])
    );
  }

  const gabaritoNameByYear: Record<number, string> = {
    2022: 'gabarito-2022.pdf',
    2023: 'gabarito_2023.pdf',
    2024: 'gabarito_2024.pdf',
  };

  const fileName = gabaritoNameByYear[year];
  if (!fileName) return new Map();

  const text = await readPdfText(path.resolve(provasDir, fileName));
  return parseAnswerMapFromText(text);
}

function buildQuestionRecord(
  year: number,
  question: CadernoQuestion,
  answerKey: Question['answerKey']
): Question {
  const macroArea = inferMacroArea(question.number);
  const subTopic = inferSubTopic(question.stem, macroArea);
  const difficulty = inferDifficulty(question.stem);
  const tags = ['poscomp', `ano_${year}`, macroArea, subTopic];

  return {
    id: `q-${year}-${String(question.number).padStart(2, '0')}`,
    year,
    source: `caderno_${year}.pdf`,
    number: question.number,
    macroArea,
    subTopic,
    difficulty,
    stem: question.stem,
    options: question.options,
    answerKey,
    tags,
  };
}

export async function buildQuestionBankFromPdfs(
  options: BuildQuestionBankOptions
): Promise<BuildQuestionBankResult> {
  const warnings: string[] = [];
  const questions: Question[] = [];
  const byYear: Record<string, number> = {};
  let missingAnswerKeys = 0;

  for (const year of options.years) {
    const cadernoPath = path.resolve(options.provasDir, `caderno_${year}.pdf`);
    const cadernoText = await readPdfText(cadernoPath);
    const parsedQuestions = parseQuestionsFromCaderno(cadernoText, year, warnings);
    const answerMap = await loadAnswerMapByYear(options.provasDir, year);

    byYear[String(year)] = parsedQuestions.length;

    for (const parsedQuestion of parsedQuestions) {
      const answerKey = answerMap.get(parsedQuestion.number);
      if (!answerKey) {
        missingAnswerKeys += 1;
        warnings.push(`Gabarito ausente para ${year}-${parsedQuestion.number}.`);
        continue;
      }

      questions.push(buildQuestionRecord(year, parsedQuestion, answerKey));
    }
  }

  questions.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.number - b.number;
  });

  return {
    generatedAt: new Date().toISOString(),
    questions,
    stats: {
      total: questions.length,
      byYear,
      missingAnswerKeys,
      parseWarnings: warnings.length,
    },
    warnings,
  };
}
