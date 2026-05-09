import path from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
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
  script?: string;
}

interface QuizHandlerMetadata {
  questionId: string;
  answerKey: string;
  explanation?: string;
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

function sanitizeBrokenOnclickAttributeQuotes(html: string) {
  const marker = 'onclick="';
  let cursor = 0;
  let output = '';

  while (cursor < html.length) {
    const start = html.indexOf(marker, cursor);
    if (start < 0) {
      output += html.slice(cursor);
      break;
    }

    output += html.slice(cursor, start + marker.length);
    let index = start + marker.length;

    while (index < html.length) {
      const char = html[index] || '';
      if (char === '"') {
        let lookahead = index + 1;
        while (lookahead < html.length && /\s/.test(html[lookahead] || '')) {
          lookahead += 1;
        }

        const next = html[lookahead] || '';
        const closesAttribute = next === '>' || (next === '/' && html[lookahead + 1] === '>');
        if (closesAttribute) {
          output += '"';
          index += 1;
          break;
        }

        output += '&quot;';
        index += 1;
        continue;
      }

      output += char;
      index += 1;
    }

    cursor = index;
  }

  return output;
}

function unescapeJsString(value: string) {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

function normalizeJsArgument(token: string) {
  const trimmed = token.trim();
  if (trimmed.length >= 2) {
    const quote = trimmed[0];
    const tail = trimmed[trimmed.length - 1];
    if ((quote === "'" || quote === '"') && tail === quote) {
      return unescapeJsString(trimmed.slice(1, -1));
    }
  }

  return trimmed;
}

function splitJsArguments(raw: string) {
  const parts: string[] = [];
  let chunk = '';
  let quote: "'" | '"' | null = null;
  let escaped = false;
  let depth = 0;

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index] || '';

    if (quote) {
      chunk += char;
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === "'" || char === '"') {
      quote = char;
      chunk += char;
      continue;
    }

    if (char === '(' || char === '[' || char === '{') {
      depth += 1;
      chunk += char;
      continue;
    }

    if (char === ')' || char === ']' || char === '}') {
      depth = Math.max(0, depth - 1);
      chunk += char;
      continue;
    }

    if (char === ',' && depth === 0) {
      if (chunk.trim().length > 0) {
        parts.push(normalizeJsArgument(chunk));
      } else {
        parts.push('');
      }
      chunk = '';
      continue;
    }

    chunk += char;
  }

  if (chunk.trim().length > 0) {
    parts.push(normalizeJsArgument(chunk));
  }

  return parts;
}

function parseOnclickInvocation(onclick: string) {
  const trimmed = onclick.trim().replace(/;$/, '');
  const match = trimmed.match(/^([A-Za-z_$][\w$]*)\s*\(([\s\S]*)\)$/);
  if (!match) {
    return null;
  }

  return {
    name: match[1] || '',
    args: splitJsArguments(match[2] || ''),
  };
}

function findMatchingBrace(source: string, openBraceIndex: number) {
  let depth = 0;
  let quote: "'" | '"' | null = null;
  let escaped = false;

  for (let index = openBraceIndex; index < source.length; index += 1) {
    const char = source[index] || '';

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === "'" || char === '"') {
      quote = char;
      continue;
    }

    if (char === '{') {
      depth += 1;
      continue;
    }

    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function parseStringConcatenation(expr: string) {
  const tokens: string[] = [];
  let chunk = '';
  let quote: "'" | '"' | null = null;
  let escaped = false;
  let depth = 0;

  for (let index = 0; index < expr.length; index += 1) {
    const char = expr[index] || '';

    if (quote) {
      chunk += char;
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === "'" || char === '"') {
      quote = char;
      chunk += char;
      continue;
    }

    if (char === '(' || char === '[' || char === '{') {
      depth += 1;
      chunk += char;
      continue;
    }

    if (char === ')' || char === ']' || char === '}') {
      depth = Math.max(0, depth - 1);
      chunk += char;
      continue;
    }

    if (char === '+' && depth === 0) {
      if (chunk.trim().length > 0) {
        tokens.push(chunk.trim());
      }
      chunk = '';
      continue;
    }

    chunk += char;
  }

  if (chunk.trim().length > 0) {
    tokens.push(chunk.trim());
  }

  const stringParts = tokens
    .map((token) => {
      const trimmed = token.trim();
      if (trimmed.length < 2) {
        return '';
      }

      const quoteChar = trimmed[0];
      const tailChar = trimmed[trimmed.length - 1];
      if ((quoteChar === "'" || quoteChar === '"') && quoteChar === tailChar) {
        return unescapeJsString(trimmed.slice(1, -1));
      }

      return '';
    })
    .filter((part) => part.length > 0);

  return stringParts.join('');
}

function extractQuizHandlerMetadata(scriptSource: string, functionName: string): QuizHandlerMetadata | null {
  const functionPattern = new RegExp(`function\\s+${functionName}\\s*\\([^)]*\\)\\s*\\{`, 'i');
  const functionMatch = scriptSource.match(functionPattern);
  if (!functionMatch || functionMatch.index === undefined) {
    return null;
  }

  const openBraceIndex = scriptSource.indexOf('{', functionMatch.index);
  if (openBraceIndex < 0) {
    return null;
  }

  const closeBraceIndex = findMatchingBrace(scriptSource, openBraceIndex);
  if (closeBraceIndex < 0) {
    return null;
  }

  const body = scriptSource.slice(openBraceIndex + 1, closeBraceIndex);

  const explicitQuestionId =
    body.match(/input\[name=['"]([^'"]+)['"]\]/i)?.[1] ||
    body.match(/getElementById\(\s*['"]([^'"]+)-res['"]\s*\)/i)?.[1] ||
    '';

  const fallbackQuestionId = functionName.match(/q(\d+)/i)?.[0] || '';
  const questionId = explicitQuestionId || fallbackQuestionId;

  const answerKey = (body.match(/sel\.value\s*===\s*['"]([^'"]+)['"]/i)?.[1] || '').toUpperCase();
  if (!questionId || !answerKey) {
    return null;
  }

  let explanation = '';
  const explanationExpr = body.match(/(?:const|let|var)\s+explanation\s*=\s*([\s\S]*?);/i)?.[1] || '';
  if (explanationExpr) {
    explanation = parseStringConcatenation(explanationExpr).trim();
  }

  return { questionId, answerKey, explanation };
}

function annotateQuizButtons(html: string, scriptSource = '') {
  const dom = new JSDOM(`<div id="module-root">${html}</div>`);
  const document = dom.window.document;
  const root = document.querySelector('#module-root');
  if (!root) {
    return html;
  }

  root.querySelectorAll('button.quiz-btn[onclick]').forEach((button) => {
    const onclick = button.getAttribute('onclick') || '';
    const invocation = parseOnclickInvocation(onclick);
    if (!invocation) {
      button.removeAttribute('onclick');
      return;
    }

    if (invocation.name.toLowerCase() === 'check' && invocation.args.length >= 2) {
      const questionId = String(invocation.args[0] || '').trim();
      const answerKey = String(invocation.args[1] || '').trim().toUpperCase();
      const explanation = invocation.args.length > 2 ? String(invocation.args[2] || '').trim() : '';

      if (questionId && answerKey) {
        button.setAttribute('data-question-id', questionId);
        button.setAttribute('data-answer-key', answerKey);
      }
      if (explanation) {
        button.setAttribute('data-explanation', explanation);
      }
    } else {
      const metadata = extractQuizHandlerMetadata(scriptSource, invocation.name);
      if (metadata) {
        button.setAttribute('data-question-id', metadata.questionId);
        button.setAttribute('data-answer-key', metadata.answerKey);
        if (metadata.explanation) {
          button.setAttribute('data-explanation', metadata.explanation);
        }
      }
    }

    button.removeAttribute('onclick');
  });

  root.querySelectorAll('button.preset-btn[onclick]').forEach((button) => {
    const onclick = button.getAttribute('onclick') || '';
    const invocation = parseOnclickInvocation(onclick);
    if (invocation && (invocation.name.toLowerCase() === 'loadpreset' || invocation.name.toLowerCase() === 'afnload')) {
      const presetId = String(invocation.args[0] || '').trim();
      if (presetId) {
        button.setAttribute('data-preset-id', presetId);
      }
    }
    button.removeAttribute('onclick');
  });

  root.querySelectorAll('button.sim-btn[onclick]').forEach((button) => {
    const onclick = button.getAttribute('onclick') || '';
    const invocation = parseOnclickInvocation(onclick);
    const actionName = invocation?.name.toLowerCase() || '';

    if (actionName === 'siminit' || actionName === 'afninit') {
      button.setAttribute('data-sim-action', 'init');
    } else if (actionName === 'simstep' || actionName === 'afnstep') {
      button.setAttribute('data-sim-action', 'step');
    } else if (actionName === 'simrun' || actionName === 'afnrun') {
      button.setAttribute('data-sim-action', 'run');
    } else if (actionName === 'simreset' || actionName === 'afnreset') {
      button.setAttribute('data-sim-action', 'reset');
    } else if (actionName === 'sbstep') {
      button.setAttribute('data-sim-action', 'subset-step');
    } else if (actionName === 'sball') {
      button.setAttribute('data-sim-action', 'subset-all');
    } else if (actionName === 'sbreset') {
      button.setAttribute('data-sim-action', 'subset-reset');
    }

    button.removeAttribute('onclick');
  });

  return root.innerHTML;
}

function firstNonEmptyText(root: ParentNode | null, selectors: string[]) {
  for (const selector of selectors) {
    const value = stripHtml((root?.querySelector(selector)?.textContent || '').trim());
    if (value.length > 0) {
      return value;
    }
  }
  return '';
}

export function buildImportedModuleSource(html: string): ModuleSourcePayload {
  const normalizedHtml = sanitizeBrokenOnclickAttributeQuotes(html);
  const dom = new JSDOM(normalizedHtml);
  const document = dom.window.document;

  const headerRoot = document.querySelector('.lesson-header') ?? document.querySelector('header');
  const navRoot = document.querySelector('.section-nav') ?? document.querySelector('nav');
  const contentRoot = document.querySelector('.lesson-content') ?? document.querySelector('main');

  const badge = normalizeModuleLabels(firstNonEmptyText(headerRoot, ['.module-badge', '.hero-tag']));
  const title = firstNonEmptyText(headerRoot, ['h1', '.hero-title']);
  const subtitle = firstNonEmptyText(headerRoot, ['.subtitle', '.hero-sub']);
  const progressLabel = normalizeModuleLabels(
    firstNonEmptyText(headerRoot, ['.progress-label']) ||
      firstNonEmptyText(document, ['.topbar-breadcrumb .current'])
  );

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

  const scriptSource = Array.from(document.querySelectorAll('script'))
    .map((scriptTag) => scriptTag.textContent || '')
    .join('\n');

  const sanitizedMain = renumberModuleSectionsFromOne(annotateQuizButtons(bodyHtml, scriptSource).trim());

  return {
    header: { badge, title, subtitle, meta, progressLabel },
    navLinks,
    html: sanitizedMain,
    script: scriptSource.trim() || undefined,
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

const entrypointArg = process.argv[1];
const isDirectExecution =
  typeof entrypointArg === 'string' && import.meta.url === pathToFileURL(entrypointArg).href;

if (isDirectExecution) {
  void main();
}
