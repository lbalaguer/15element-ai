#!/usr/bin/env node
/**
 * migrate.js — One-shot migration from inline HTML pages to _src/ + placeholders.
 *
 * For each HTML page in the project root (excluding tooling dirs):
 *   1. Replace <nav class="nav">...</nav> with <!-- @include nav -->
 *   2. Replace <footer>...</footer> with <!-- @include footer -->
 *   3. Replace <a class="wa-float">...</a> with <!-- @include wa-float -->
 *   4. Replace bottom <script> (theme toggle + reveal IO) with <!-- @include theme-script -->
 *   5. Rewrite asset paths (./assets/ ../assets/ etc.) to {{ASSETS}}/
 *   6. Rewrite colors_and_type.css link and add common.css link
 *   7. Save to _src/<same-relative-path>
 *
 * Run once. After this, manually run `node build.js` to regenerate root HTMLs.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC_DIR = path.join(ROOT, '_src');
const EXCLUDE_DIRS = new Set([
  '_partials', '_styles', '_src', 'node_modules',
  'preview', 'ui_kits', 'youtube', 'assets', '.git'
]);

function walkHtml(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (EXCLUDE_DIRS.has(e.name)) continue;
      walkHtml(full, files);
    } else if (e.isFile() && e.name.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

function migrate(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  const before = html.length;

  // 1. NAV: replace <nav class="nav">...</nav> with placeholder
  html = html.replace(/<nav class="nav">[\s\S]*?<\/nav>\s*\n/, '<!-- @include nav -->\n');

  // 2. FOOTER: replace <footer>...</footer>
  html = html.replace(/<footer>[\s\S]*?<\/footer>\s*\n/, '<!-- @include footer -->\n');

  // 3. WhatsApp float: <a class="wa-float" ...>...</a>
  html = html.replace(/<a class="wa-float"[\s\S]*?<\/a>\s*\n/, '<!-- @include wa-float -->\n');

  // 4. Bottom <script> with theme toggle + reveal IO
  // Match a <script>...</script> block that contains 'themeToggle' (only one in each page)
  html = html.replace(/<script>\s*\n?(?:const|var|let)?[\s\S]*?themeToggle[\s\S]*?<\/script>\s*\n?/, '<!-- @include theme-script -->\n');

  // 5. Asset paths: ./assets/  ../assets/  ../../assets/  →  {{ASSETS}}/
  html = html.replace(/(?:\.\.?\/)+assets\//g, '{{ASSETS}}/');

  // 6. colors_and_type.css link replacement + add common.css
  html = html.replace(
    /<link rel="stylesheet" href="(?:\.\.?\/)+colors_and_type\.css">/,
    '<link rel="stylesheet" href="{{COLORS_CSS}}">\n<link rel="stylesheet" href="{{COMMON_CSS}}">'
  );

  // Write to _src
  const rel = path.relative(ROOT, filePath);
  const destPath = path.join(SRC_DIR, rel);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, html, 'utf8');

  const after = html.length;
  const delta = before - after;
  return { rel, delta };
}

const files = walkHtml(ROOT);
if (files.length === 0) {
  console.log('[migrate] No HTML files found in root.');
  process.exit(0);
}

console.log(`[migrate] Found ${files.length} HTML page(s). Migrating to _src/ ...`);
for (const f of files) {
  const { rel, delta } = migrate(f);
  console.log(`  → ${rel}  (-${delta} bytes deduplicated)`);
}
console.log(`[migrate] Done. Now run: node build.js`);
