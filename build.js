#!/usr/bin/env node
/**
 * 15Element.AI build script
 * --------------------------
 * Reads _src/**\/*.html (source pages with placeholders),
 * injects partials from _partials/, and writes finished
 * pages to repo root (or the path mirroring _src/).
 *
 * Placeholders supported (HTML comments, so they don't break in src files):
 *   <!-- @include nav -->
 *   <!-- @include footer -->
 *   <!-- @include wa-float -->
 *   <!-- @include theme-script -->
 *
 * Inside partials, {{ASSETS}} is replaced with the relative path to /assets
 * based on the depth of the destination file. E.g.:
 *   /index.html              -> ./assets
 *   /servicios/index.html    -> ../assets
 *   /servicios/seo-aeo-geo/  -> ../../assets
 *
 * Same for {{STYLES}} (path to colors_and_type.css + common.css).
 *
 * Run:  node build.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const SRC_DIR = path.join(ROOT, '_src');
const PARTIALS_DIR = path.join(ROOT, '_partials');
const STYLES_DIR = path.join(ROOT, '_styles');

// ------------------------------------------------------------
// Compute SHA-8 hash of CSS files for cache-busting query strings
// (Netlify serves CSS with long cache; hash changes = browser re-fetches)
// ------------------------------------------------------------
function hashFile(absPath) {
  if (!fs.existsSync(absPath)) return '0';
  const buf = fs.readFileSync(absPath);
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 8);
}

function readCssIfExists(absPath) {
  if (!fs.existsSync(absPath)) return '';
  return fs.readFileSync(absPath, 'utf8');
}

function escapeRe(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const PARTIALS = ['nav', 'footer', 'wa-float', 'theme-script'];

// ------------------------------------------------------------
// Load partials into memory
// ------------------------------------------------------------
const partialsCache = {};
for (const name of PARTIALS) {
  const file = path.join(PARTIALS_DIR, `${name}.html`);
  if (!fs.existsSync(file)) {
    console.warn(`[build] WARN: partial ${name}.html not found at ${file}`);
    continue;
  }
  partialsCache[name] = fs.readFileSync(file, 'utf8');
}

// ------------------------------------------------------------
// Walk _src recursively
// ------------------------------------------------------------
function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, fileList);
    else if (e.isFile() && e.name.endsWith('.html')) fileList.push(full);
  }
  return fileList;
}

// ------------------------------------------------------------
// Calculate relative paths from a file to /assets or /_styles
// ------------------------------------------------------------
function relativePath(fromFileAbs, toRel) {
  // depth = number of directories between fromFile and SRC_DIR root
  const relFromSrc = path.relative(SRC_DIR, fromFileAbs);
  const depth = relFromSrc.split(path.sep).length - 1; // subtract 1 for filename
  if (depth === 0) return './' + toRel;
  return '../'.repeat(depth) + toRel;
}

// ------------------------------------------------------------
// Process a single source file
// ------------------------------------------------------------
function processFile(srcAbs) {
  let html = fs.readFileSync(srcAbs, 'utf8');

  const assetsPath = relativePath(srcAbs, 'assets');
  // Append SHA-8 hash to CSS URLs so browsers re-fetch when content changes
  const colorsCssPath = relativePath(srcAbs, 'colors_and_type.css') + '?v=' + hashFile(path.join(ROOT, 'colors_and_type.css'));
  const commonCssPath = relativePath(srcAbs, '_styles/common.css') + '?v=' + hashFile(path.join(ROOT, '_styles', 'common.css'));

  // Inject partials
  for (const [name, content] of Object.entries(partialsCache)) {
    const re = new RegExp(`<!--\\s*@include\\s+${name}\\s*-->`, 'g');
    // Replace {{ASSETS}} inside partial with the per-page relative path
    const resolved = content.replace(/\{\{ASSETS\}\}/g, assetsPath);
    html = html.replace(re, resolved);
  }

  // Compute page slug for {{PAGE_CSS}} resolution
  // index.html → 'home'
  // servicios/index.html → 'servicios'
  // servicios/seo-aeo-geo/index.html → 'servicio-seo-aeo-geo'
  // industrias/manufactura/index.html → 'industria-manufactura'
  const rel = path.relative(SRC_DIR, srcAbs);
  const dirParts = path.dirname(rel).split(path.sep).filter(Boolean);
  let slug;
  if (dirParts.length === 0 || dirParts[0] === '.') slug = 'home';
  else if (dirParts.length === 1) slug = dirParts[0]; // 'servicios', 'industrias', 'casos'
  else if (dirParts[0] === 'servicios') slug = 'servicio-' + dirParts.slice(1).join('-');
  else if (dirParts[0] === 'industrias') slug = 'industria-' + dirParts.slice(1).join('-');
  else if (dirParts[0] === 'blog') slug = 'blog-post'; // all blog posts share the same CSS
  else if (dirParts[0] === 'politica-de-privacidad' || dirParts[0] === 'terminos-de-servicio') slug = 'legal';
  else slug = dirParts.join('-');
  const pageCssAbs = path.join(ROOT, '_styles', 'pages', `${slug}.css`);
  const pageCssPath = relativePath(srcAbs, `_styles/pages/${slug}.css`) + '?v=' + hashFile(pageCssAbs);

  // Page-level token substitutions
  html = html.replace(/\{\{ASSETS\}\}/g, assetsPath);
  html = html.replace(/\{\{COLORS_CSS\}\}/g, colorsCssPath);
  html = html.replace(/\{\{COMMON_CSS\}\}/g, commonCssPath);
  html = html.replace(/\{\{PAGE_CSS\}\}/g, pageCssPath);

  // ----------------------------------------------------------------
  // PERF: async-load Google Fonts (non-blocking) — inserta después del
  // preload del woff2. Saves ~750ms LCP on mobile.
  // ----------------------------------------------------------------
  const fontsAsync = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@400;500;600;700;800;900&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@400;500;600;700;800;900&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"></noscript>`;
  // Inserta después del preload de Saira Condensed
  html = html.replace(
    /(<link rel="preload" href="https:\/\/fonts\.gstatic\.com\/s\/sairacondensed[^"]+" as="font"[^>]+>)/,
    `$1\n${fontsAsync}`
  );

  // ----------------------------------------------------------------
  // PERF: Inline all local CSS into <style> (eliminates 3 render-blocking
  // requests, saves ~2,500ms LCP on mobile slow 4G). Trade-off: HTML grows
  // ~12KB per page, but no critical path latency from CSS.
  // ----------------------------------------------------------------
  const colorsCssContent = readCssIfExists(path.join(ROOT, 'colors_and_type.css'));
  const commonCssContent = readCssIfExists(path.join(ROOT, '_styles', 'common.css'));
  const pageCssContent   = readCssIfExists(pageCssAbs);
  const combinedCss = [colorsCssContent, commonCssContent, pageCssContent].filter(Boolean).join('\n');

  // Remove the 3 link tags (now versioned URLs) and inject inline <style>
  html = html.replace(new RegExp('<link rel="stylesheet" href="' + escapeRe(colorsCssPath) + '">\\s*\\n?', 'g'), '');
  html = html.replace(new RegExp('<link rel="stylesheet" href="' + escapeRe(commonCssPath) + '">\\s*\\n?', 'g'), '');
  html = html.replace(new RegExp('<link rel="stylesheet" href="' + escapeRe(pageCssPath) + '">\\s*\\n?', 'g'), '');
  html = html.replace('</head>', `<style>${combinedCss}</style>\n</head>`);

  // ----------------------------------------------------------------
  // PERF: Remove .reveal class from above-the-fold elements (LCP fix).
  // The IntersectionObserver delays element rendering until JS runs;
  // for above-fold elements this costs 5+ seconds on mobile slow 4G.
  // Apply only to hero copy that's always visible on initial paint.
  // ----------------------------------------------------------------
  html = html.replace(/class="hero-eyebrow reveal"/g, 'class="hero-eyebrow"');
  html = html.replace(/class="reveal hero-eyebrow"/g, 'class="hero-eyebrow"');
  html = html.replace(/<h1 class="reveal">/g, '<h1>');
  html = html.replace(/class="lead reveal"/g, 'class="lead"');
  html = html.replace(/class="reveal lead"/g, 'class="lead"');
  html = html.replace(/class="hero-ctas reveal"/g, 'class="hero-ctas"');
  html = html.replace(/class="reveal hero-ctas"/g, 'class="hero-ctas"');
  html = html.replace(/class="hero-proofs reveal"/g, 'class="hero-proofs"');
  html = html.replace(/class="reveal hero-proofs"/g, 'class="hero-proofs"');

  // Output path: mirror _src/ structure in repo root (rel computed above)
  const outAbs = path.join(ROOT, rel);
  const outDir = path.dirname(outAbs);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outAbs, html, 'utf8');
  return rel;
}

// ------------------------------------------------------------
// Run
// ------------------------------------------------------------
const files = walk(SRC_DIR);
if (files.length === 0) {
  console.log('[build] No source files found in _src/ — nothing to do.');
  process.exit(0);
}

console.log(`[build] Building ${files.length} page(s)...`);
for (const f of files) {
  const rel = processFile(f);
  console.log(`  ✓ ${rel}`);
}
console.log(`[build] Done.`);
