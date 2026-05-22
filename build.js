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

// ------------------------------------------------------------
// CSS class validator — BULLETPROOF guard contra clases sin estilo.
// Atrapa el bug del 2026-05-20 (.post-faqs/.post-quote sin CSS) ANTES
// del push. Cualquier sesión que cree un blog con una clase que no tiene
// CSS en colors+common+pageCSS va a ver un WARNING grande en el build.
// ------------------------------------------------------------
// Clases que legítimamente NO necesitan CSS propio (hooks JS, markers,
// o estilizadas solo vía atributo/estado). Si agregas una clase a esta
// lista, documenta por qué.
const CLASS_ALLOWLIST = new Set([
  'reveal',          // IntersectionObserver hook (sí tiene CSS, por si acaso)
  'is-active',       // estado de filtro/chip
  'noscript',        // fallback
  'hero-copy',       // wrapper de layout en /nosotros/ (sin estilo propio necesario)
  'btn-linkedin',    // modificador sobre .btn .btn-ghost (hereda estilo del botón)
]);
function classesInHtml(html) {
  const set = new Set();
  const re = /class="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) {
    m[1].split(/\s+/).forEach(c => { if (c) set.add(c); });
  }
  return set;
}
function classesInCss(css) {
  const set = new Set();
  const re = /\.(-?[_a-zA-Z][_a-zA-Z0-9-]*)/g;
  let m;
  while ((m = re.exec(css))) set.add(m[1]);
  return set;
}
function findOrphanClasses(html, combinedCss) {
  const used = classesInHtml(html);
  const defined = classesInCss(combinedCss);
  const orphans = [];
  for (const c of used) {
    if (CLASS_ALLOWLIST.has(c)) continue;
    if (!defined.has(c)) orphans.push(c);
  }
  return orphans.sort();
}

// ------------------------------------------------------------
// Guard 2: tokens/includes sin resolver. Si un {{VAR}} o
// <!-- @include x --> sobrevive al build, queda texto crudo en prod.
// ------------------------------------------------------------
function findUnresolvedTokens(html) {
  const found = new Set();
  let m;
  const tokenRe = /\{\{\s*[A-Z_]+\s*\}\}/g;
  while ((m = tokenRe.exec(html))) found.add(m[0]);
  const includeRe = /<!--\s*@include\s+[\w-]+\s*-->/g;
  while ((m = includeRe.exec(html))) found.add(m[0].trim());
  return [...found];
}

// ------------------------------------------------------------
// Guard 3: JSON-LD roto. Google ignora en silencio un schema con
// JSON inválido → se pierden rich results / citas AEO. Parseamos
// cada <script type="application/ld+json"> y reportamos los rotos.
// ------------------------------------------------------------
function findBrokenJsonLd(html) {
  const errors = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m, i = 0;
  while ((m = re.exec(html))) {
    i++;
    const raw = m[1].trim();
    if (!raw) { errors.push(`bloque #${i} vacío`); continue; }
    try { JSON.parse(raw); }
    catch (e) { errors.push(`bloque #${i}: ${e.message}`); }
  }
  return errors;
}

// ------------------------------------------------------------
// Guard 4: links internos rotos (404). Recolecta hrefs absolutos
// (/blog/..., /servicios/...) para validar al final contra los
// archivos realmente generados.
// ------------------------------------------------------------
function extractInternalLinks(html) {
  const links = new Set();
  const re = /href="(\/[^"]*)"/g;
  let m;
  while ((m = re.exec(html))) links.add(m[1]);
  return [...links];
}
function internalLinkToFile(href) {
  let p = href.split('#')[0].split('?')[0];
  if (!p) return null;            // era solo #ancla
  if (p === '/') return 'index.html';
  p = p.replace(/^\//, '');
  if (p.endsWith('/')) return p + 'index.html';
  if (!path.extname(p)) return p + '/index.html'; // dir sin slash final
  return p;                        // archivo con extensión (sitemap.xml, etc.)
}

const PARTIALS = ['nav', 'footer', 'wa-float', 'theme-script', 'vt-lightbox'];

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
  // Legal pages share legal.css — evaluar ANTES del catch de length===1
  // (si no, slug='politica-de-privacidad' busca un CSS inexistente y la página
  //  se sirve sin estilo. Bug detectado por el validador 2026-05-20.)
  else if (dirParts[0] === 'politica-de-privacidad' || dirParts[0] === 'terminos-de-servicio') slug = 'legal';
  else if (dirParts.length === 1) slug = dirParts[0]; // 'servicios', 'industrias', 'casos'
  else if (dirParts[0] === 'servicios') slug = 'servicio-' + dirParts.slice(1).join('-');
  else if (dirParts[0] === 'industrias') slug = 'industria-' + dirParts.slice(1).join('-');
  else if (dirParts[0] === 'blog') slug = 'blog-post'; // all blog posts share the same CSS
  else slug = dirParts.join('-');
  const pageCssAbs = path.join(ROOT, '_styles', 'pages', `${slug}.css`);
  const pageCssPath = relativePath(srcAbs, `_styles/pages/${slug}.css`) + '?v=' + hashFile(pageCssAbs);

  // Page-level token substitutions
  html = html.replace(/\{\{ASSETS\}\}/g, assetsPath);
  html = html.replace(/\{\{COLORS_CSS\}\}/g, colorsCssPath);
  html = html.replace(/\{\{COMMON_CSS\}\}/g, commonCssPath);
  html = html.replace(/\{\{PAGE_CSS\}\}/g, pageCssPath);

  // ----------------------------------------------------------------
  // ANALYTICS: Google Tag Manager — inyectado en TODAS las páginas.
  // Script en <head>, noscript inmediatamente después de <body>.
  // ----------------------------------------------------------------
  const gtmHead = `<!-- Google Tag Manager -->\n<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':\nnew Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],\nj=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=\n'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);\n})(window,document,'script','dataLayer','GTM-5H7ZB6GD');</script>\n<!-- End Google Tag Manager -->`;
  const gtmNoscript = `<!-- Google Tag Manager (noscript) -->\n<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5H7ZB6GD"\nheight="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>\n<!-- End Google Tag Manager (noscript) -->`;
  html = html.replace('<head>', `<head>\n${gtmHead}`);
  html = html.replace(/<body([^>]*)>/, `<body$1>\n${gtmNoscript}`);

  // ----------------------------------------------------------------
  // SEO: Google Search Console verification meta tag — SOLO en home.
  // GSC verificó la propiedad URL prefix https://15element.ai/ y solo
  // necesita el tag en esa página. Tenerlo en todas las páginas era
  // over-engineering innecesario (cleaned up 2026-05-16).
  // ----------------------------------------------------------------
  const isHome = path.relative(SRC_DIR, srcAbs) === 'index.html';
  if (isHome) {
    const gscVerification = `<meta name="google-site-verification" content="MJzwxG12ePDeg1KA2sFAtH9QuTXmde9BRXjUCJtLfgI">`;
    const bingVerification = `<meta name="msvalidate.01" content="EB03E647D23C04F04ECB0DD43A869C1E">`;
    html = html.replace(
      /(<meta name="viewport"[^>]+>)/,
      `$1\n${gscVerification}\n${bingVerification}`
    );
  }

  // ----------------------------------------------------------------
  // PERF: async-load Google Fonts (non-blocking) — inserta después del
  // preload del woff2. Saves ~750ms LCP on mobile.
  //
  // CLS fix: also preload IBM Plex Sans 400 latin (the body font).
  // Without this preload, when IBM Plex finishes loading async, the body
  // text re-renders with different metrics → layout shift (~0.2 CLS).
  // NOTE: Google Fonts versions URLs (v23 etc) — if these expire, re-curl
  // https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400 to get
  // the new latin subset woff2 URL and update here.
  // ----------------------------------------------------------------
  const ibmPlexPreload = `<link rel="preload" href="https://fonts.gstatic.com/s/ibmplexsans/v23/zYXGKVElMYYaJe8bpLHnCwDKr932-G7dytD-Dmu1swZSAXcomDVmadSD6llDB6g4.woff2" as="font" type="font/woff2" crossorigin>`;
  const fontsAsync = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@400;500;600;700;800;900&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@400;500;600;700;800;900&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"></noscript>`;
  // Inserta después del preload de Saira Condensed
  html = html.replace(
    /(<link rel="preload" href="https:\/\/fonts\.gstatic\.com\/s\/sairacondensed[^"]+" as="font"[^>]+>)/,
    `$1\n${ibmPlexPreload}\n${fontsAsync}`
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

  // BULLETPROOF: 4 guards que cazan fallas silenciosas antes de prod
  const orphans = findOrphanClasses(html, combinedCss);
  const unresolvedTokens = findUnresolvedTokens(html);
  const jsonLdErrors = findBrokenJsonLd(html);
  const internalLinks = extractInternalLinks(html);
  return { rel, orphans, unresolvedTokens, jsonLdErrors, internalLinks };
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
const allOrphans = [];
const allTokens = [];
const allJsonLd = [];
const linksByPage = []; // { rel, links: [...] }
for (const f of files) {
  const { rel, orphans, unresolvedTokens, jsonLdErrors, internalLinks } = processFile(f);
  const flags = [];
  if (orphans.length) { allOrphans.push({ rel, orphans }); flags.push(`clases sin CSS: ${orphans.join(', ')}`); }
  if (unresolvedTokens.length) { allTokens.push({ rel, tokens: unresolvedTokens }); flags.push(`tokens sin resolver: ${unresolvedTokens.join(', ')}`); }
  if (jsonLdErrors.length) { allJsonLd.push({ rel, errs: jsonLdErrors }); flags.push(`JSON-LD roto`); }
  linksByPage.push({ rel, links: internalLinks });
  console.log(flags.length ? `  ⚠ ${rel}  (${flags.join(' | ')})` : `  ✓ ${rel}`);
}

// Guard 4 (post-loop): validar links internos contra archivos generados
const brokenLinks = [];
for (const { rel, links } of linksByPage) {
  for (const href of links) {
    const file = internalLinkToFile(href);
    if (!file) continue;
    if (!fs.existsSync(path.join(ROOT, file))) brokenLinks.push({ rel, href });
  }
}

function banner(title, lines) {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`⚠  ${title}`);
  console.log('───────────────────────────────────────────────────────────');
  for (const l of lines) console.log(l);
  console.log('═══════════════════════════════════════════════════════════');
}

if (allOrphans.length) {
  const lines = ['  Clases usadas en HTML sin CSS en colors+common+pageCSS (se ven sin estilo).',
    '  Arregla: agrega el CSS, usa una clase existente, o métela a CLASS_ALLOWLIST.'];
  for (const { rel, orphans } of allOrphans) { lines.push(`  ${rel}:`); for (const c of orphans) lines.push(`      .${c}`); }
  banner('CLASES SIN CSS', lines);
}
if (allTokens.length) {
  const lines = ['  Tokens {{VAR}} o @include que NO se resolvieron (queda texto crudo en prod).'];
  for (const { rel, tokens } of allTokens) lines.push(`  ${rel}: ${tokens.join(', ')}`);
  banner('TOKENS / INCLUDES SIN RESOLVER', lines);
}
if (allJsonLd.length) {
  const lines = ['  Schema JSON-LD inválido → Google lo ignora en silencio (pierdes rich results / AEO).'];
  for (const { rel, errs } of allJsonLd) { lines.push(`  ${rel}:`); for (const e of errs) lines.push(`      ${e}`); }
  banner('JSON-LD ROTO', lines);
}
if (brokenLinks.length) {
  const lines = ['  Links internos que apuntan a páginas/archivos que NO existen (404 + daño SEO).'];
  for (const { rel, href } of brokenLinks) lines.push(`  ${rel} → ${href}`);
  banner('LINKS INTERNOS ROTOS', lines);
}

const totalIssues = allOrphans.length + allTokens.length + allJsonLd.length + brokenLinks.length;
console.log(`[build] Done.${totalIssues ? ` (⚠ ${totalIssues} problema(s) — revisar arriba ANTES de pushear)` : ' (4/4 guards OK)'}`);
