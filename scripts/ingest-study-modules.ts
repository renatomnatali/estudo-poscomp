import path from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

interface ModuleSourcePayload {
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

function stripHtml(raw: string) {
  return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeModuleLabels(value: string) {
  return value.replace(/m[oó]dulo\s*(\d+)\s*de\s*8/gi, 'Módulo $1 de 9');
}

function stripHeaderIconPrefix(value: string) {
  return value
    .replace(/^[\s\uFE0E\uFE0F\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}]+/u, '')
    .trim();
}

function renumberModuleSectionsFromOne(html: string) {
  let chapterNumber = 1;
  return html.replace(/(<h2>\s*<span class="num">)\d+(<\/span>)/gi, (_match, prefix, suffix) => {
    const value = `${prefix}${chapterNumber}${suffix}`;
    chapterNumber += 1;
    return value;
  });
}

function annotateQuizButtons(html: string) {
  const dom = new JSDOM(`<div id="module-root">${html}</div>`);
  const document = dom.window.document;
  const root = document.querySelector('#module-root');
  if (!root) {
    return html;
  }

  root.querySelectorAll('button.quiz-btn[onclick]').forEach((button) => {
    const onclick = button.getAttribute('onclick') || '';
    const match = onclick.match(
      /check\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])?\s*\)/i
    );

    if (match) {
      button.setAttribute('data-question-id', match[1] || '');
      button.setAttribute('data-answer-key', (match[2] || '').toUpperCase());
      if (match[3]) {
        button.setAttribute('data-explanation-id', match[3]);
      }
    }

    button.removeAttribute('onclick');
  });

  root.querySelectorAll('button.preset-btn[onclick]').forEach((button) => {
    const onclick = button.getAttribute('onclick') || '';
    const match = onclick.match(/loadPreset\(\s*['"]([^'"]+)['"]\s*\)/i);
    if (match) {
      button.setAttribute('data-preset-id', match[1] || '');
    }
    button.removeAttribute('onclick');
  });

  root.querySelectorAll('button.sim-btn[onclick]').forEach((button) => {
    const onclick = (button.getAttribute('onclick') || '').trim();
    if (/simInit\s*\(/i.test(onclick)) {
      button.setAttribute('data-sim-action', 'init');
    } else if (/simStep\s*\(/i.test(onclick)) {
      button.setAttribute('data-sim-action', 'step');
    } else if (/simRun\s*\(/i.test(onclick)) {
      button.setAttribute('data-sim-action', 'run');
    } else if (/simReset\s*\(/i.test(onclick)) {
      button.setAttribute('data-sim-action', 'reset');
    }
    button.removeAttribute('onclick');
  });

  root.querySelectorAll('[onclick]').forEach((element) => {
    element.removeAttribute('onclick');
  });

  return root.innerHTML;
}

function buildImportedModuleSource(html: string): ModuleSourcePayload {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const headerRoot = document.querySelector('.lesson-header') ?? document.querySelector('header');
  const navRoot = document.querySelector('.section-nav') ?? document.querySelector('nav');
  const contentRoot = document.querySelector('.lesson-content') ?? document.querySelector('main');

  const badge = normalizeModuleLabels(stripHtml(headerRoot?.querySelector('.module-badge')?.textContent || ''));
  const title = stripHtml(headerRoot?.querySelector('h1')?.textContent || '');
  const subtitle = stripHtml(headerRoot?.querySelector('.subtitle')?.textContent || '');
  const progressLabel = normalizeModuleLabels(stripHtml(headerRoot?.querySelector('.progress-label')?.textContent || ''));

  const metaElements =
    headerRoot?.querySelectorAll('.header-meta span') && headerRoot.querySelectorAll('.header-meta span').length > 0
      ? headerRoot.querySelectorAll('.header-meta span')
      : headerRoot?.querySelectorAll('span');

  const meta = Array.from(metaElements || [])
    .map((entry) => stripHeaderIconPrefix(stripHtml(entry.textContent || '')))
    .filter((item) => item.length > 0);

  const navLinks = Array.from(navRoot?.querySelectorAll('a[href^="#"]') || []).map((entry) => ({
    id: (entry.getAttribute('href') || '').replace(/^#/, ''),
    label: stripHtml(entry.textContent || ''),
  }));

  let bodyHtml = '';
  const sections = Array.from((contentRoot || document).querySelectorAll('section[id]'));
  if (sections.length > 0) {
    bodyHtml = sections.map((section) => section.outerHTML).join('\n\n');
  } else if (contentRoot) {
    const cloned = contentRoot.cloneNode(true) as HTMLElement;
    cloned.querySelector('.mod-nav')?.remove();
    bodyHtml = cloned.innerHTML;
  }

  const sanitizedMain = renumberModuleSectionsFromOne(annotateQuizButtons(bodyHtml).trim());

  return {
    header: { badge, title, subtitle, meta, progressLabel },
    navLinks,
    html: sanitizedMain,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const slugArgIndex = args.indexOf('--slug');
  const inputArgIndex = args.indexOf('--input');

  const slug = slugArgIndex >= 0 ? String(args[slugArgIndex + 1] || '').trim() : 'modulo-01';
  const inputFromArg = inputArgIndex >= 0 ? String(args[inputArgIndex + 1] || '').trim() : '';

  const inputPath = inputFromArg
    ? path.resolve(process.cwd(), inputFromArg)
    : path.join(
        process.cwd(),
        'Spec',
        'mockup',
        'import',
        slug === 'modulo-01' ? 'modulo-01-fundamentos.html' : `${slug}.html`
      );

  const outputPath = path.join(process.cwd(), 'data', 'study', 'modules', `${slug}.source.json`);

  const sourceHtml = await readFile(inputPath, 'utf8');
  const payload = buildImportedModuleSource(sourceHtml);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`Conteúdo gerado para ${slug}: ${outputPath}`);
}

void main();
