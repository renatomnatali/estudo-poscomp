/**
 * validate-module-fragment.ts
 *
 * Valida um módulo ingerido (`data/study/modules/<slug>.source.json`) contra
 * o contrato definido em `Spec/aprovado_ design system/MODULE-CREATION-BRIEFING.md`.
 *
 * Uso:
 *   npm run study:modules:validate -- --slug modulo-02
 *   npm run study:modules:validate -- --all
 *
 * Exit codes:
 *   0  todos os checks passaram
 *   1  pelo menos um ERROR encontrado (ou source.json do --slug não existe)
 *   2  uso incorreto (flag inválida, slug em formato proibido, diretório de
 *      módulos ausente, allowlist indisponível — configuração quebrada,
 *      distinto de validação falha)
 *
 * Warnings não falham build mas são reportados (use `--strict` para promover
 * warnings a errors).
 */

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';

// ----------------------------------------------------------------------------
// Tipos
// ----------------------------------------------------------------------------

interface ModuleSource {
  header: {
    badge: string;
    title: string;
    subtitle: string;
    meta: string[];
    progressLabel: string;
  };
  navLinks: Array<{ id: string; label: string }>;
  html: string;
}

interface Issue {
  level: 'error' | 'warning';
  rule: string;
  message: string;
  context?: string;
}

interface ValidationReport {
  slug: string;
  errors: Issue[];
  warnings: Issue[];
}

// ----------------------------------------------------------------------------
// Carregar allowlist de classes (DS + globals.css)
// ----------------------------------------------------------------------------

async function collectClassAllowlist(): Promise<Set<string>> {
  const cssFiles = [
    'app/globals.css',
    'Spec/aprovado_ design system/colors_and_type.css',
  ];

  const allowed = new Set<string>();
  const missing: string[] = [];

  for (const file of cssFiles) {
    try {
      const css = await readFile(file, 'utf8');
      // Tokeniza classes via regex simples: `.<name>` onde <name> é
      // [A-Za-z][A-Za-z0-9_-]*. Não cobre 100% dos casos (ex.: classes em
      // pseudo-classes), mas é suficiente para allowlist permissiva.
      for (const match of css.matchAll(/\.([A-Za-z][A-Za-z0-9_-]*)/g)) {
        allowed.add(match[1]);
      }
    } catch {
      missing.push(file);
    }
  }

  if (allowed.size === 0) {
    // fail-closed: sem allowlist, TODO fragmento viraria warning de classe e a
    // regra viraria ruído. Isso é configuração quebrada, não validação falha.
    console.error('FATAL: allowlist de classes vazia — CSS não encontrado:');
    missing.forEach(f => console.error('  - ' + f));
    console.error('Rode a partir da raiz do repositório.');
    process.exit(2);
  }

  return allowed;
}

// ----------------------------------------------------------------------------
// Validações
// ----------------------------------------------------------------------------

function pushError(issues: Issue[], rule: string, message: string, context?: string) {
  issues.push({ level: 'error', rule, message, context });
}

function pushWarning(issues: Issue[], rule: string, message: string, context?: string) {
  issues.push({ level: 'warning', rule, message, context });
}

function validateHeader(header: ModuleSource['header'], errors: Issue[], warnings: Issue[]) {
  if (!header || typeof header !== 'object') {
    pushError(errors, 'header', 'fragmento sem objeto `header` — rode o ingest antes de validar');
    return;
  }
  if (!header.title || header.title.trim().length === 0) {
    pushError(errors, 'header.title', 'header.title está vazio');
  }

  if (!header.badge || header.badge.trim().length === 0) {
    pushError(errors, 'header.badge', 'header.badge está vazio');
  } else if (!/^Módulo \d+ de \d+(\s—.+)?$/.test(header.badge)) {
    pushWarning(
      warnings,
      'header.badge.format',
      `header.badge fora do padrão "Módulo N de M": "${header.badge}"`
    );
  }

  if (!header.subtitle || header.subtitle.trim().length === 0) {
    pushError(errors, 'header.subtitle', 'header.subtitle está vazio');
  } else if (header.subtitle.trim().length < 20) {
    pushWarning(
      warnings,
      'header.subtitle.length',
      `header.subtitle é muito curto (${header.subtitle.trim().length} chars; recomendado ≥ 20)`
    );
  }

  if (!header.progressLabel || header.progressLabel.trim().length === 0) {
    pushError(errors, 'header.progressLabel', 'header.progressLabel está vazio');
  } else if (!/^Módulo \d+ de \d+\s—\s.+$/.test(header.progressLabel) && !/^F\d+\s+concluído/.test(header.progressLabel)) {
    pushWarning(
      warnings,
      'header.progressLabel.format',
      `header.progressLabel fora do padrão "Módulo N de M — Slug": "${header.progressLabel}"`
    );
  }

  if (!Array.isArray(header.meta) || header.meta.length === 0) {
    pushError(errors, 'header.meta', 'header.meta está vazio (esperado 2-4 entradas)');
  } else if (header.meta.length < 2 || header.meta.length > 4) {
    pushWarning(
      warnings,
      'header.meta.length',
      `header.meta tem ${header.meta.length} entradas (recomendado 2-4)`
    );
  }
}

function validateNavLinks(
  navLinks: ModuleSource['navLinks'],
  sectionIds: Set<string>,
  errors: Issue[],
  warnings: Issue[]
) {
  if (!Array.isArray(navLinks) || navLinks.length === 0) {
    pushError(errors, 'navLinks.empty', 'navLinks está vazio (esperado ≥ 4 entradas)');
    return;
  }

  if (navLinks.length < 4) {
    pushWarning(
      warnings,
      'navLinks.length',
      `navLinks tem ${navLinks.length} entradas (recomendado ≥ 4)`
    );
  }

  for (const link of navLinks) {
    if (!link.id || !link.label) {
      pushError(errors, 'navLinks.shape', `navLink mal formado: ${JSON.stringify(link)}`);
      continue;
    }

    if (!sectionIds.has(link.id)) {
      pushError(
        errors,
        'navLinks.broken',
        `navLink "${link.label}" aponta para #${link.id}, mas não há <section id="${link.id}"> no html`
      );
    }
  }

  // Aviso reverso: section sem navLink (não-fatal)
  // Convenção: seções terminais como "resumo" são frequentemente excluídas
  // do navLinks por design (aluno chega rolando, não pelo menu). Não emitir
  // warning para essas — só para órfãs genuínas.
  const ALLOWED_ORPHAN_IDS = new Set(['resumo']);
  for (const id of sectionIds) {
    if (ALLOWED_ORPHAN_IDS.has(id)) continue;
    if (!navLinks.some((l) => l.id === id)) {
      pushWarning(
        warnings,
        'sections.orphan',
        `<section id="${id}"> existe no html mas não há entrada em navLinks`
      );
    }
  }
}

function validateHtmlStructure(
  html: string,
  document: Document,
  errors: Issue[],
  warnings: Issue[]
) {
  // Conteúdo proibido (descartado pelo pipeline; presença indica autor confuso)
  const forbiddenTags = ['<html', '<head', '<body', '<style', '<link', '<h1'];
  for (const tag of forbiddenTags) {
    if (html.toLowerCase().includes(tag)) {
      pushError(
        errors,
        'html.forbidden-tag',
        `html contém tag proibida "${tag}…" (descartado pelo pipeline; remover do fragmento)`
      );
    }
  }

  // Pelo menos 1 <section>
  const sections = document.querySelectorAll('section[id]');
  if (sections.length === 0) {
    pushError(errors, 'html.no-sections', 'html não contém nenhuma <section id="...">');
  }

  // Numeração das seções
  let lastNum = 0;
  document.querySelectorAll('h2 .num').forEach((numEl) => {
    const text = numEl.textContent || '';
    const n = parseInt(text.trim(), 10);
    if (Number.isFinite(n)) {
      if (n !== lastNum + 1) {
        pushWarning(
          warnings,
          'h2.num.sequence',
          `<h2><span class="num">${n}</span> esperado ${lastNum + 1}; pipeline renumera automaticamente`
        );
      }
      lastNum = n;
    }
  });
}

function validateQuizButtons(document: Document, errors: Issue[]) {
  // Agrupar attrs faltantes do mesmo botão em UMA mensagem (evita
  // duplicar contagem de errors quando um botão viola múltiplas regras).
  document.querySelectorAll('button.quiz-btn').forEach((btn, index) => {
    const text = (btn.textContent || '').trim().slice(0, 40);
    const missing: string[] = [];

    if (!btn.getAttribute('data-question-id')) missing.push('data-question-id');
    if (!btn.getAttribute('data-answer-key')) missing.push('data-answer-key');

    if (missing.length > 0) {
      // Tenta capturar a questão (h3 anterior mais próximo) para context.
      let questionContext = '';
      let cursor: Element | null = btn;
      while (cursor && !questionContext) {
        cursor = cursor.previousElementSibling || cursor.parentElement;
        if (cursor && cursor.tagName === 'H3') {
          questionContext = (cursor.textContent || '').trim().slice(0, 60);
        }
      }

      pushError(
        errors,
        'quiz.missing-attrs',
        `button.quiz-btn #${index + 1} sem ${missing.join(' e ')} ` +
          `(esperado após pipeline; em pre-ingest deve usar onclick="check('qid','A','expid')")`,
        questionContext || text
      );
    }
  });
}

function validateClassesAgainstAllowlist(
  document: Document,
  allowlist: Set<string>,
  warnings: Issue[]
) {
  const used = new Set<string>();
  document.querySelectorAll('[class]').forEach((el) => {
    const cls = el.getAttribute('class') || '';
    cls
      .split(/\s+/)
      .filter((c) => c.length > 0)
      .forEach((c) => used.add(c));
  });

  const missing = [...used].filter((c) => !allowlist.has(c)).sort();
  if (missing.length > 0) {
    pushWarning(
      warnings,
      'classes.not-in-ds',
      `${missing.length} classes usadas não existem no DS nem em globals.css: ${missing.slice(0, 12).join(', ')}${missing.length > 12 ? ', …' : ''}`
    );
  }
}

const PT_BR_TYPOS: Array<[RegExp, string]> = [
  [/\bnao\b/gi, 'não'],
  [/\bvoce\b/gi, 'você'],
  [/\bmatematica\b/gi, 'matemática'],
  [/\bfundamentos matematicos\b/gi, 'fundamentos matemáticos'],
  [/\balgoritmos\s+sao\b/gi, 'algoritmos são'],
  [/\bcomputacao\b/gi, 'computação'],
  [/\bestao\b/gi, 'estão'],
  [/\bsao\b/gi, 'são'],
  [/\bproximo\b/gi, 'próximo'],
  [/\bproprio\b/gi, 'próprio'],
];

function validatePtBrAccents(html: string, warnings: Issue[]) {
  // Remove tags + atributos para evitar falso-positivo em IDs como "tao-pequeno"
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  for (const [pattern, expected] of PT_BR_TYPOS) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      pushWarning(
        warnings,
        'pt-br.accent',
        `palavra sem acento detectada (${matches.length}×): "${matches[0]}" → "${expected}"`
      );
    }
  }
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------

async function loadModuleSource(slug: string): Promise<ModuleSource> {
  const sourcePath = path.join(process.cwd(), 'data', 'study', 'modules', `${slug}.source.json`);
  const raw = await readFile(sourcePath, 'utf8');
  return JSON.parse(raw) as ModuleSource;
}

async function validateOne(slug: string, allowlist: Set<string>): Promise<ValidationReport> {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];

  let source: ModuleSource;
  try {
    source = await loadModuleSource(slug);
  } catch (err: unknown) {
    pushError(errors, 'load.failed', `não consegui ler o source.json: ${(err as Error).message}`);
    return { slug, errors, warnings };
  }

  validateHeader(source.header, errors, warnings);

  const dom = new JSDOM(`<div id="root">${source.html}</div>`);
  const root = dom.window.document.querySelector('#root');
  if (!root) {
    pushError(errors, 'html.parse', 'não consegui parsear o html');
    return { slug, errors, warnings };
  }

  const sectionIds = new Set<string>();
  root.querySelectorAll('section[id]').forEach((s) => {
    const id = s.getAttribute('id') || '';
    if (id) sectionIds.add(id);
  });

  validateNavLinks(source.navLinks, sectionIds, errors, warnings);
  validateHtmlStructure(source.html, dom.window.document, errors, warnings);
  validateQuizButtons(dom.window.document, errors);
  validateClassesAgainstAllowlist(dom.window.document, allowlist, warnings);
  validatePtBrAccents(source.html, warnings);

  return { slug, errors, warnings };
}

function printReport(report: ValidationReport, strict: boolean) {
  const totalIssues = report.errors.length + report.warnings.length;
  const failed = report.errors.length > 0 || (strict && report.warnings.length > 0);
  const status = failed ? '✗ FAILED' : '✓ OK';
  // Em --strict os warnings falham o gate: a contagem precisa refletir isso,
  // senão o CI sai vermelho com um relatório dizendo "0 errors".
  const errCount = report.errors.length + (strict ? report.warnings.length : 0);
  const strictNote = strict && report.warnings.length > 0
    ? ` (inclui ${report.warnings.length} warnings promovidos a error)`
    : '';

  console.log(`\n${status}  ${report.slug}  (${errCount} errors${strictNote}, ${report.warnings.length} warnings)`);

  for (const e of report.errors) {
    console.log(`  ERROR    [${e.rule}] ${e.message}${e.context ? ` — "${e.context}"` : ''}`);
  }
  for (const w of report.warnings) {
    console.log(`  WARNING  [${w.rule}] ${w.message}${w.context ? ` — "${w.context}"` : ''}`);
  }

  if (totalIssues === 0) {
    console.log('  (sem problemas)');
  }
}

async function listAllSlugs(): Promise<string[]> {
  const dir = path.join(process.cwd(), 'data', 'study', 'modules');
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch (err: unknown) {
    console.error(`diretório de módulos não encontrado: ${dir} (${(err as Error).message})`);
    console.error('Rode a partir da raiz do repositório, ou use --slug <nome>.');
    process.exit(2);
  }
  return entries
    .filter((e) => e.endsWith('.source.json'))
    .map((e) => e.replace(/\.source\.json$/, ''))
    .sort();
}

async function main() {
  const args = process.argv.slice(2);
  const slugIdx = args.indexOf('--slug');
  const all = args.includes('--all');
  const strict = args.includes('--strict');

  let slugs: string[] = [];

  if (slugIdx >= 0) {
    const slug = args[slugIdx + 1];
    if (!slug) {
      console.error('uso: --slug <nome-do-modulo>');
      process.exit(2);
    }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
      // slug entra em path.join e vira rota no app: formato fechado evita
      // traversal e acento/espaço que quebrariam URL e registro.
      console.error(`slug em formato inválido: "${slug}" — use apenas a-z, 0-9 e hífen`);
      process.exit(2);
    }
    slugs = [slug];
  } else if (all) {
    slugs = await listAllSlugs();
    if (slugs.length === 0) {
      console.error('nenhum source.json em data/study/modules/');
      process.exit(2);
    }
  } else {
    console.error('uso: --slug <nome> OU --all');
    console.error('     --strict (promove warnings a errors)');
    process.exit(2);
  }

  const allowlist = await collectClassAllowlist();
  console.log(`(allowlist com ${allowlist.size} classes carregada de DS + globals.css)`);

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const slug of slugs) {
    const report = await validateOne(slug, allowlist);
    printReport(report, strict);
    totalErrors += report.errors.length + (strict ? report.warnings.length : 0);
    totalWarnings += report.warnings.length;
  }

  console.log(`\n────────────────────────────────────────`);
  console.log(`Total: ${totalErrors} errors${strict ? ' (modo strict: warnings promovidos)' : ''}, ${totalWarnings} warnings em ${slugs.length} módulo(s)`);

  const failed = totalErrors > 0 || (strict && totalWarnings > 0);
  process.exit(failed ? 1 : 0);
}

void main();
