import fs from 'node:fs';
import path from 'node:path';

import type {
  ApplicationCase,
  QuickCheckItem,
  Topic,
  TopicMaterial,
  TopicReference,
  TopicSection,
  WorkedExample,
} from '@/lib/types';

const TOPIC_PACKAGE_PATH = path.resolve(
  process.cwd(),
  'data',
  'topics',
  'fundamentos',
  'fundamentos-v1.json'
);

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateSections(topic: Topic): string[] {
  const errors: string[] = [];

  if (!Array.isArray(topic.sections) || topic.sections.length < 2) {
    errors.push(`Tópico ${topic.slug} deve ter ao menos 2 seções.`);
    return errors;
  }

  const kinds = new Set(topic.sections.map((section) => section.kind));
  if (!kinds.has('essential')) {
    errors.push(`Tópico ${topic.slug} deve conter seção essential.`);
  }
  if (!kinds.has('advanced')) {
    errors.push(`Tópico ${topic.slug} deve conter seção advanced.`);
  }

  return errors;
}

function isNonEmptyArray<T>(input: T[] | undefined): input is T[] {
  return Array.isArray(input) && input.length > 0;
}

export function validateTopicMaterialPackage(payload: TopicMaterial): ValidationResult {
  const errors: string[] = [];

  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Pacote de conteúdo inválido.'] };
  }

  if (!isNonEmptyArray(payload.topics)) {
    return { valid: false, errors: ['Pacote deve conter ao menos um tópico.'] };
  }

  payload.topics.forEach((topic) => {
    if (!topic.slug) errors.push('Tópico sem slug.');
    if (!topic.title) errors.push(`Tópico ${topic.slug || '[sem slug]'} sem título.`);
    if (!isNonEmptyArray(topic.learningObjectives)) {
      errors.push(`Tópico ${topic.slug} deve conter objetivos de aprendizagem.`);
    }
    if (!isNonEmptyArray(topic.examples)) {
      errors.push(`Tópico ${topic.slug} deve conter exemplos.`);
    }
    if (!isNonEmptyArray(topic.applications)) {
      errors.push(`Tópico ${topic.slug} deve conter aplicação.`);
    }
    if (!isNonEmptyArray(topic.quickChecks)) {
      errors.push(`Tópico ${topic.slug} deve conter quick-check.`);
    }
    errors.push(...validateSections(topic));
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

function normalizeSections(value: unknown): TopicSection[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const section = item as TopicSection;
    return {
      id: section.id || `section-${index + 1}`,
      kind: section.kind,
      title: section.title || `Seção ${index + 1}`,
      content: section.content || '',
      order: Number(section.order ?? index + 1),
    };
  });
}

function normalizeExamples(value: unknown): WorkedExample[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const example = item as WorkedExample;
    return {
      id: example.id || `example-${index + 1}`,
      title: example.title || `Exemplo ${index + 1}`,
      problem: example.problem || '',
      strategy: example.strategy || '',
      solution: example.solution || '',
      takeaway: example.takeaway || '',
      order: Number(example.order ?? index + 1),
    };
  });
}

function normalizeApplications(value: unknown): ApplicationCase[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const application = item as ApplicationCase;
    return {
      id: application.id || `application-${index + 1}`,
      title: application.title || `Aplicação ${index + 1}`,
      context: application.context || '',
      howItApplies: application.howItApplies || '',
      order: Number(application.order ?? index + 1),
    };
  });
}

function normalizeReferences(value: unknown): TopicReference[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const reference = item as TopicReference;
    return {
      id: reference.id || `reference-${index + 1}`,
      label: reference.label || `Fonte ${index + 1}`,
      url: reference.url || '',
      order: Number(reference.order ?? index + 1),
    };
  });
}

function normalizeQuickChecks(value: unknown): QuickCheckItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const quickCheck = item as QuickCheckItem;
    return {
      id: quickCheck.id || `quick-check-${index + 1}`,
      prompt: quickCheck.prompt || '',
      options: Array.isArray(quickCheck.options) ? quickCheck.options : [],
      answerKey: quickCheck.answerKey,
      explanation: quickCheck.explanation || '',
      order: Number(quickCheck.order ?? index + 1),
    };
  });
}

export function loadTopicMaterialPackage(): TopicMaterial {
  const raw = fs.readFileSync(TOPIC_PACKAGE_PATH, 'utf8');
  const parsed = JSON.parse(raw) as TopicMaterial;

  const topics = (Array.isArray(parsed.topics) ? parsed.topics : []).map((topic) => ({
    ...topic,
    prerequisites: Array.isArray(topic.prerequisites) ? topic.prerequisites : [],
    learningObjectives: Array.isArray(topic.learningObjectives) ? topic.learningObjectives : [],
    sourceLessons: Array.isArray(topic.sourceLessons) ? topic.sourceLessons : [],
    sections: normalizeSections((topic as Topic).sections),
    examples: normalizeExamples((topic as Topic).examples),
    applications: normalizeApplications((topic as Topic).applications),
    references: normalizeReferences((topic as Topic).references),
    quickChecks: normalizeQuickChecks((topic as Topic).quickChecks),
  }));

  return {
    version: Number(parsed.version || 1),
    generatedAt: parsed.generatedAt || new Date().toISOString(),
    topics,
  };
}

export function getTopicPackagePath() {
  return TOPIC_PACKAGE_PATH;
}
