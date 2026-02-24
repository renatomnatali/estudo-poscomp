#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = process.cwd();

function walk(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      walk(fullPath, fileList);
      continue;
    }

    fileList.push(fullPath);
  }

  return fileList;
}

function checkJsSyntax(files) {
  for (const file of files) {
    const run = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (run.status !== 0) {
      process.stderr.write(run.stderr || run.stdout);
      throw new Error(`Falha de sintaxe JS em ${file}`);
    }
  }
}

function checkJson(files) {
  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf8');
    try {
      JSON.parse(raw);
    } catch (error) {
      throw new Error(`JSON inválido em ${file}: ${error.message}`);
    }
  }
}

function checkHtmlLinks(files) {
  const broken = [];
  const attrRegex = /(href|src)="([^"]+)"/g;

  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    let match;

    while ((match = attrRegex.exec(html))) {
      const value = match[2];
      if (!value || value.startsWith('http://') || value.startsWith('https://') || value.startsWith('#') || value.startsWith('data:')) {
        continue;
      }

      const target = value.split('#')[0].split('?')[0];
      if (!target || target.startsWith('/')) continue;

      const resolved = path.resolve(path.dirname(file), target);
      if (!fs.existsSync(resolved)) {
        broken.push({ file, target });
      }
    }
  }

  if (broken.length > 0) {
    broken.forEach((item) => {
      process.stderr.write(`Link quebrado: ${path.relative(root, item.file)} -> ${item.target}\n`);
    });
    throw new Error(`Total de links quebrados: ${broken.length}`);
  }
}

const allFiles = walk(root);
const jsFiles = allFiles.filter((file) => file.endsWith('.js') || file.endsWith('.cjs') || file.endsWith('.mjs'));
const jsonFiles = allFiles.filter((file) => file.endsWith('.json'));
const htmlFiles = allFiles.filter((file) => file.startsWith(path.join(root, 'src', 'web')) && file.endsWith('.html'));

checkJsSyntax(jsFiles);
checkJson(jsonFiles);
checkHtmlLinks(htmlFiles);

process.stdout.write('lint ok\n');
