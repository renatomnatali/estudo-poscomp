const fs = require('node:fs');
const path = require('node:path');

const DATASET_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  'data',
  'questions',
  'automata',
  'poscomp-automata-v1.json'
);

function loadQuestionsDataset() {
  const raw = fs.readFileSync(DATASET_PATH, 'utf8');
  return JSON.parse(raw);
}

function listQuestions(filters = {}) {
  const dataset = loadQuestionsDataset();
  const questions = Array.isArray(dataset.questions) ? dataset.questions : [];

  const filtered = questions.filter((question) => {
    if (filters.year && Number(question.year) !== Number(filters.year)) return false;
    if (filters.macroArea && question.macroArea !== filters.macroArea) return false;
    if (filters.subTopic && question.subTopic !== filters.subTopic) return false;
    if (filters.difficulty && question.difficulty !== filters.difficulty) return false;
    return true;
  });

  const limit = Number(filters.limit || 0);
  if (Number.isFinite(limit) && limit > 0) {
    return filtered.slice(0, limit);
  }

  return filtered;
}

function getQuestionMap() {
  const dataset = loadQuestionsDataset();
  const questions = Array.isArray(dataset.questions) ? dataset.questions : [];
  const map = new Map();
  questions.forEach((question) => {
    map.set(question.id, question);
  });
  return map;
}

module.exports = {
  loadQuestionsDataset,
  listQuestions,
  getQuestionMap,
};
