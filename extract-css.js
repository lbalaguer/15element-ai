#!/usr/bin/env node
/**
 * extract-css.js — One-shot extractor of page-specific <style> blocks
 * from _src/**\/*.html into _styles/pages/[slug].css, replacing the
 * inline <style> in each HTML with <link rel="stylesheet" href="{{PAGE_CSS}}">.
 *
 * Slug rules (must match build.js):
 *   _src/index.html                        → home
 *   _src/servicios/index.html              → servicios
 *   _src/industrias/index.html             → industrias
 *   _src/casos/index.html                  → casos
 *   _src/servicios/<x>/index.html          → servicio-<x>
 *   _src/industrias/<x>/index.html         → industria-<x>
 *
 * Run once. Then `node build.js`.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC_DIR = path.join(ROOT, '_src');
const STYLES_PAGES_DIR = path.join(ROOT, '_styles', 'pages');

function slugForFile(htmlAbs) {
  const rel = path.relative(SRC_DIR, htmlAbs);
  const dir = path.dirname(rel).split(path.sep).filter(d => d !== '.' && d !== '');
  if (dir.length === 0) return 'home';
  if (dir.length === 1) return dir[0]; // servicios, industrias, casos
  if (dir[0] === 'servicios') return 'servicio-' + dir.slice(1).join('-');
  if (dir[0] === 'industrias') return 'industria-' + dir.slice(1).join('-');
  return dir.join('-');
}

function walk(d, files = []) {
  if (!fs.existsSync(d)) return files;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f, files);
    else if (e.name.endsWith('.html')) files.push(f);
  }
  return files;
}

fs.mkdirSync(STYLES_PAGES_DIR, { recursive: true });

const files = walk(SRC_DIR);
console.log(`[extract-css] Processing ${files.length} file(s)...`);

for (const f of files) {
  let html = fs.readFileSync(f, 'utf8');
  const rel = path.relative(ROOT, f);
  const slug = slugForFile(f);

  // Match the FIRST <style>...</style> block (page-specific styles).
  // Some pages contain JSON-LD inside <script type="application/ld+json">, never <style>.
  const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
  if (!styleMatch) {
    console.log(`  ⊘ ${rel} — no <style> block found (already extracted?)`);
    continue;
  }

  const css = styleMatch[1].trim();
  const cssOut = path.join(STYLES_PAGES_DIR, `${slug}.css`);

  // If the CSS file already exists with non-trivial content, don't overwrite (safety)
  if (fs.existsSync(cssOut) && fs.readFileSync(cssOut, 'utf8').trim().length > 200) {
    console.log(`  ⚠  ${rel} → ${path.relative(ROOT, cssOut)} (exists, skipping write)`);
  } else {
    const header = `/* ============================================================\n   ${rel} — page-specific styles\n   Chrome (nav/footer/etc.) lives in _styles/common.css\n   ============================================================ */\n\n`;
    fs.writeFileSync(cssOut, header + css + '\n');
  }

  // Replace the <style> block in HTML with a <link>
  html = html.replace(/<style>[\s\S]*?<\/style>/, '<link rel="stylesheet" href="{{PAGE_CSS}}">');
  fs.writeFileSync(f, html);

  console.log(`  ✓ ${rel} → _styles/pages/${slug}.css (${css.length} chars)`);
}

console.log('[extract-css] Done. Now run: node build.js');
