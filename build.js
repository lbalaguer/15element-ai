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
const BASELINE_PATH = path.join(ROOT, '.build-warnings-baseline.json');

// ------------------------------------------------------------
// CLI flags
// ------------------------------------------------------------
const argv = process.argv.slice(2);
const FLAG_UPDATE_BASELINE = argv.includes('--update-baseline');
const FLAG_SHOW_BASELINE = argv.includes('--show-baseline');

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

// ------------------------------------------------------------
// Guard 5: posts-grid card count. .posts-grid es grid de 3 cols
// rígido en common.css. Card sola o 2 cards = huecos visuales.
// Reglas:
//   - posts-grid featured-row → exactamente 3 cards
//   - posts-grid (regular)   → múltiplo de 3 (3, 6, 9, 12...)
// ------------------------------------------------------------
function findBadPostsGrids(html) {
  const errors = [];
  const re = /<div\s+class="posts-grid([^"]*)"[^>]*>([\s\S]*?)<\/div>\s*(?=<(?:div|section|footer|main|aside|nav|article|\/section|!--)|$)/g;
  let m, i = 0;
  while ((m = re.exec(html))) {
    i++;
    const classExtra = m[1] || '';
    const isFeatured = /\bfeatured-row\b/.test(classExtra);
    const inner = m[2];
    const cards = (inner.match(/<a\s+[^>]*class="[^"]*\bpost-card\b/g) || []).length;
    if (cards === 0) continue;
    if (isFeatured && cards !== 3) {
      errors.push(`grid #${i} (featured-row) tiene ${cards} cards — debe ser 3 exactos`);
    } else if (!isFeatured && cards % 3 === 1) {
      errors.push(`grid #${i} (posts-grid) tiene ${cards} cards — 1 card sola en última fila (2 huecos). Agrega 2 o saca 1.`);
    }
  }
  return errors;
}

const PARTIALS = ['nav', 'footer', 'nav-en', 'footer-en', 'wa-float', 'theme-script', 'vt-lightbox', 'case-modal', 'case-modal-en'];

// ------------------------------------------------------------
// Cases data — single source of truth for case modal across
// /catalogo/, /casos/, /en/case-studies/, /en/catalog/.
// Loaded once at build start; injected via {{CASES_DATA}} token.
// ------------------------------------------------------------
const CASES_DATA_PATH = path.join(ROOT, '_data', 'cases.json');
let CASES_DATA_JSON = '{}';
if (fs.existsSync(CASES_DATA_PATH)) {
  const raw = fs.readFileSync(CASES_DATA_PATH, 'utf8').trim();
  try { JSON.parse(raw); CASES_DATA_JSON = raw; }
  catch (e) { console.error(`[build] ERROR: _data/cases.json invalid JSON: ${e.message}`); }
}

const CASES_DATA_EN_PATH = path.join(ROOT, '_data', 'cases-en.json');
let CASES_DATA_EN_JSON = '{}';
if (fs.existsSync(CASES_DATA_EN_PATH)) {
  const raw = fs.readFileSync(CASES_DATA_EN_PATH, 'utf8').trim();
  try { JSON.parse(raw); CASES_DATA_EN_JSON = raw; }
  catch (e) { console.error(`[build] ERROR: _data/cases-en.json invalid JSON: ${e.message}`); }
}

// ------------------------------------------------------------
// i18n — pares hreflang ES↔EN (MVP Tornado Fase 1). Solo las páginas
// listadas aquí reciben <link hreflang>. El resto del sitio ES no se toca.
// esRel/enRel = path relativo a _src (con index.html). es/en = URL pública.
// ------------------------------------------------------------
const HREFLANG_PAIRS = [
  { esRel: 'index.html',                              enRel: 'en/index.html',                           es: '/',                             en: '/en/' },
  { esRel: 'servicios/seo-aeo-geo/index.html',        enRel: 'en/services/aeo-seo/index.html',          es: '/servicios/seo-aeo-geo/',       en: '/en/services/aeo-seo/' },
  { esRel: 'servicios/linkedin-prospecting/index.html', enRel: 'en/services/linkedin-prospecting/index.html', es: '/servicios/linkedin-prospecting/', en: '/en/services/linkedin-prospecting/' },
  { esRel: 'servicios/consultoria-b2b/index.html',    enRel: 'en/services/consulting/index.html',       es: '/servicios/consultoria-b2b/',   en: '/en/services/consulting/' },
  { esRel: 'casos/index.html',                        enRel: 'en/case-studies/index.html',              es: '/casos/',                       en: '/en/case-studies/' },
  { esRel: 'nosotros/index.html',                     enRel: 'en/about/index.html',                     es: '/nosotros/',                    en: '/en/about/' },
  { esRel: 'contacto/index.html',                     enRel: 'en/contact/index.html',                   es: '/contacto/',                    en: '/en/contact/' },
  { esRel: 'blog/index.html',                         enRel: 'en/blog/index.html',                      es: '/blog/',                        en: '/en/blog/' },
];

// Páginas EN reusan el CSS de su par ES (no duplicamos CSS en MVP).
const EN_CSS_MAP = {
  '': 'home',
  'services/aeo-seo': 'servicio-seo-aeo-geo',
  'services/ai-advertising': 'servicio-seo-aeo-geo',
  'services/linkedin-prospecting': 'servicio-linkedin-prospecting',
  'services/buying-signals': 'servicio-senales-de-compra',
  'services/consulting': 'servicio-consultoria-b2b',
  'seo-agency-mississauga': 'servicio-seo-aeo-geo',
  'seo-agency-ottawa': 'servicio-seo-aeo-geo',
  'case-studies': 'casos',
  'about': 'nosotros',
  'contact': 'contacto',
  'blog': 'blog',
  'war-room': 'war-room',
};

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
  if (dirParts[0] === 'en') {
    // Páginas EN reusan el CSS de su par ES (ver EN_CSS_MAP arriba)
    const enKey = dirParts.slice(1).join('/');
    slug = EN_CSS_MAP[enKey] || (enKey.startsWith('blog/') ? 'blog-post' : 'home');
  }
  else if (dirParts.length === 0 || dirParts[0] === '.') slug = 'home';
  // Legal pages share legal.css — evaluar ANTES del catch de length===1
  // (si no, slug='politica-de-privacidad' busca un CSS inexistente y la página
  //  se sirve sin estilo. Bug detectado por el validador 2026-05-20.)
  else if (dirParts[0] === 'politica-de-privacidad' || dirParts[0] === 'terminos-de-servicio') slug = 'legal';
  else if (dirParts.length === 1) slug = dirParts[0]; // 'servicios', 'industrias', 'casos'
  else if (dirParts[0] === 'servicios') slug = 'servicio-' + dirParts.slice(1).join('-');
  else if (dirParts[0] === 'industrias') slug = 'industria-' + dirParts.slice(1).join('-');
  else if (dirParts[0] === 'blog') slug = 'blog-post'; // all blog posts share the same CSS
  else if (dirParts[0] === 'casos' && dirParts.length >= 2) slug = 'casos-spoke'; // all /casos/<slug>/ share CSS
  else slug = dirParts.join('-');
  const pageCssAbs = path.join(ROOT, '_styles', 'pages', `${slug}.css`);
  const pageCssPath = relativePath(srcAbs, `_styles/pages/${slug}.css`) + '?v=' + hashFile(pageCssAbs);

  // Page-level token substitutions
  html = html.replace(/\{\{ASSETS\}\}/g, assetsPath);
  html = html.replace(/\{\{COLORS_CSS\}\}/g, colorsCssPath);
  html = html.replace(/\{\{COMMON_CSS\}\}/g, commonCssPath);
  html = html.replace(/\{\{PAGE_CSS\}\}/g, pageCssPath);
  html = html.replace(/\{\{CASES_DATA\}\}/g, CASES_DATA_JSON);
  html = html.replace(/\{\{CASES_DATA_EN\}\}/g, CASES_DATA_EN_JSON);

  // ----------------------------------------------------------------
  // i18n: hreflang ES↔EN (MVP Tornado). Solo páginas en HREFLANG_PAIRS.
  // El resto del sitio no se toca (aditivo, cero riesgo al ES existente).
  // ----------------------------------------------------------------
  const relNorm = rel.replace(/\\/g, '/');
  const hlPair = HREFLANG_PAIRS.find(p => p.esRel === relNorm || p.enRel === relNorm);
  if (hlPair) {
    const hl = `<link rel="alternate" hreflang="es" href="https://15element.ai${hlPair.es}">\n<link rel="alternate" hreflang="en" href="https://15element.ai${hlPair.en}">\n<link rel="alternate" hreflang="x-default" href="https://15element.ai${hlPair.es}">`;
    html = html.replace('</head>', `${hl}\n</head>`);
  }

  // ----------------------------------------------------------------
  // ANALYTICS: Google Tag Manager — inyectado en TODAS las páginas.
  // Script en <head>, noscript inmediatamente después de <body>.
  // ----------------------------------------------------------------
  // PERF: GTM diferido hasta primera interacción del usuario (scroll/mouse/
  // touch/tecla/click) O timeout de respaldo de 5s — lo que ocurra primero.
  // Saca gtm.js (~165 KiB unused JS + long tasks) del critical path de carga,
  // sube el score de Lighthouse mobile. El timeout es 5s (no 3.5s) porque a 3.5s
  // se colaba dentro del trace de Lighthouse en corridas lentas → TBT 350ms
  // intermitente. Trade-off: bounces <5s sin interacción no se registran en GA4
  // (el timeout es la red de seguridad). 2026-06-08.
  const gtmHead = `<!-- Google Tag Manager (deferred until interaction) -->\n<script>(function(w,d,s,l,i){w[l]=w[l]||[];var loaded=false;\nfunction gtmLoad(){if(loaded)return;loaded=true;\nw[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});\nvar f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';\nj.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;\nf.parentNode.insertBefore(j,f);}\nvar ev=['scroll','mousemove','touchstart','keydown','click'];\nev.forEach(function(e){w.addEventListener(e,gtmLoad,{once:true,passive:true});});\nsetTimeout(gtmLoad,5000);\n})(window,document,'script','dataLayer','GTM-5H7ZB6GD');</script>\n<!-- End Google Tag Manager -->`;
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
  // PERF: fuentes SELF-HOSTED same-origin (2026-06-08). Antes se cargaban de
  // Google Fonts (preconnect + preload gstatic + stylesheet async). Eso metía
  // DNS+connect a Google en el critical path → FCP/LCP ~3.0s clavado en mobile
  // slow 4G + varianza de red. Ahora los woff2 viven en /assets/fonts/ y las
  // @font-face están en colors_and_type.css (inline). Aquí solo:
  //   1. quitar los preconnect a Google (ya no se usan),
  //   2. reemplazar el preload de Saira gstatic por preloads locales de las 3
  //      fuentes críticas above-the-fold (hero H1 Saira 800 = LCP, body IBM
  //      Plex Sans 400, eyebrow IBM Plex Mono 600). El resto carga vía @font-face.
  // ----------------------------------------------------------------
  const localFontPreloads = [
    `<link rel="preload" href="${assetsPath}/fonts/saira-condensed-800.woff2" as="font" type="font/woff2" crossorigin>`,
    `<link rel="preload" href="${assetsPath}/fonts/ibm-plex-sans-400.woff2" as="font" type="font/woff2" crossorigin>`,
    `<link rel="preload" href="${assetsPath}/fonts/ibm-plex-mono-600.woff2" as="font" type="font/woff2" crossorigin>`,
  ].join('\n');
  html = html.replace(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*\n?/g, '');
  html = html.replace(/<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com"[^>]*>\s*\n?/g, '');
  html = html.replace(
    /<link rel="preload" href="https:\/\/fonts\.gstatic\.com\/s\/sairacondensed[^"]+" as="font"[^>]+>/,
    localFontPreloads
  );

  // ----------------------------------------------------------------
  // PERF: Inline all local CSS into <style> (eliminates 3 render-blocking
  // requests, saves ~2,500ms LCP on mobile slow 4G). Trade-off: HTML grows
  // ~12KB per page, but no critical path latency from CSS.
  // ----------------------------------------------------------------
  const colorsCssContent = readCssIfExists(path.join(ROOT, 'colors_and_type.css'));
  const commonCssContent = readCssIfExists(path.join(ROOT, '_styles', 'common.css'));
  const pageCssContent   = readCssIfExists(pageCssAbs);
  // Resolver {{ASSETS}} dentro del CSS (p.ej. url({{ASSETS}}/fonts/x.woff2) de
  // las @font-face self-hosted) a la ruta relativa por profundidad de la página.
  const combinedCss = [colorsCssContent, commonCssContent, pageCssContent]
    .filter(Boolean).join('\n')
    .replace(/\{\{ASSETS\}\}/g, assetsPath);

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
  const postsGridErrors = findBadPostsGrids(html);
  return { rel, orphans, unresolvedTokens, jsonLdErrors, internalLinks, postsGridErrors };
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
const allPostsGrids = [];
const linksByPage = []; // { rel, links: [...] }
for (const f of files) {
  const { rel, orphans, unresolvedTokens, jsonLdErrors, internalLinks, postsGridErrors } = processFile(f);
  const flags = [];
  if (orphans.length) { allOrphans.push({ rel, orphans }); flags.push(`clases sin CSS: ${orphans.join(', ')}`); }
  if (unresolvedTokens.length) { allTokens.push({ rel, tokens: unresolvedTokens }); flags.push(`tokens sin resolver: ${unresolvedTokens.join(', ')}`); }
  if (jsonLdErrors.length) { allJsonLd.push({ rel, errs: jsonLdErrors }); flags.push(`JSON-LD roto`); }
  if (postsGridErrors.length) { allPostsGrids.push({ rel, errs: postsGridErrors }); flags.push(`posts-grid roto`); }
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

// ------------------------------------------------------------
// BASELINE SYSTEM — distingue deuda heredada (aceptada) de deuda nueva.
// Caso de uso: si tocas /blog/X y el build escupe warnings de /catalogo/ que
// no son tuyos, el sistema los reconoce como baseline y no te bloquea.
// Si introduces deuda NUEVA, el build falla con exit 1 y lista solo lo NUEVO.
// Para aceptar deuda deliberadamente: `node build.js --update-baseline`.
// ------------------------------------------------------------
// Normaliza path separators a forward-slash (cross-platform: baseline generado
// en Windows debe matchear el mismo path comparado en Linux/macOS).
function normPath(p) { return p.replace(/\\/g, '/'); }

function buildCurrentWarnings() {
  // Normaliza warnings a estructura comparable: { guard: { file: [items] } }
  const cur = { orphan_classes: {}, unresolved_tokens: {}, json_ld: {}, broken_links: {}, posts_grid: {} };
  for (const { rel, orphans } of allOrphans) cur.orphan_classes[normPath(rel)] = orphans.slice().sort();
  for (const { rel, tokens } of allTokens) cur.unresolved_tokens[normPath(rel)] = tokens.slice().sort();
  for (const { rel, errs } of allJsonLd) cur.json_ld[normPath(rel)] = errs.slice().sort();
  for (const { rel, errs } of allPostsGrids) cur.posts_grid[normPath(rel)] = errs.slice().sort();
  const brokenByFile = {};
  for (const { rel, href } of brokenLinks) { (brokenByFile[normPath(rel)] ||= []).push(href); }
  for (const f of Object.keys(brokenByFile)) cur.broken_links[f] = brokenByFile[f].sort();
  return cur;
}

function readBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
  } catch (e) {
    console.error(`[build] BASELINE corrupto en ${BASELINE_PATH}: ${e.message}`);
    process.exit(2);
  }
}

function writeBaseline(current) {
  const data = {
    version: 1,
    generated_at: new Date().toISOString(),
    generated_by: 'node build.js --update-baseline',
    note: 'Deuda técnica conocida y aceptada. El build pasa si los warnings actuales son subset de este file. Si introduces deuda nueva, el build falla. Para regenerar este file deliberadamente: `node build.js --update-baseline`.',
    guards: current.guards
  };
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function diffWarnings(current, baseline) {
  // Retorna { newItems: {guard:{file:[items]}}, resolvedItems: {...}, totalNew, totalResolved, totalKnown }
  const base = (baseline && baseline.guards) || {};
  const newItems = {};
  const resolvedItems = {};
  let totalNew = 0, totalResolved = 0, totalKnown = 0;
  const guards = ['orphan_classes', 'unresolved_tokens', 'json_ld', 'broken_links', 'posts_grid'];
  for (const g of guards) {
    const curG = current[g] || {};
    const baseG = base[g] || {};
    const allFiles = new Set([...Object.keys(curG), ...Object.keys(baseG)]);
    for (const f of allFiles) {
      const curSet = new Set(curG[f] || []);
      const baseSet = new Set(baseG[f] || []);
      const newOnly = [...curSet].filter(x => !baseSet.has(x));
      const resolvedOnly = [...baseSet].filter(x => !curSet.has(x));
      const known = [...curSet].filter(x => baseSet.has(x));
      if (newOnly.length) {
        (newItems[g] ||= {})[f] = newOnly.sort();
        totalNew += newOnly.length;
      }
      if (resolvedOnly.length) {
        (resolvedItems[g] ||= {})[f] = resolvedOnly.sort();
        totalResolved += resolvedOnly.length;
      }
      totalKnown += known.length;
    }
  }
  return { newItems, resolvedItems, totalNew, totalResolved, totalKnown };
}

const GUARD_LABELS = {
  orphan_classes: 'CLASES SIN CSS',
  unresolved_tokens: 'TOKENS / INCLUDES SIN RESOLVER',
  json_ld: 'JSON-LD ROTO',
  broken_links: 'LINKS INTERNOS ROTOS',
  posts_grid: 'POSTS-GRID ROTO'
};

function printGuardSection(guardKey, byFile, header) {
  const lines = [header];
  for (const f of Object.keys(byFile).sort()) {
    lines.push(`  ${f}:`);
    for (const item of byFile[f]) {
      // Para orphan_classes: prefijo "." para legibilidad
      const display = guardKey === 'orphan_classes' ? `.${item}` : item;
      lines.push(`      ${display}`);
    }
  }
  banner(GUARD_LABELS[guardKey], lines);
}

const currentWarnings = { guards: buildCurrentWarnings() };

// Modo --show-baseline: imprime el baseline actual y sale
if (FLAG_SHOW_BASELINE) {
  const b = readBaseline();
  if (!b) { console.log('[build] No hay baseline. Corre `node build.js --update-baseline` para generar.'); process.exit(0); }
  console.log(JSON.stringify(b, null, 2));
  process.exit(0);
}

// Modo --update-baseline: persiste warnings actuales como baseline aceptado
if (FLAG_UPDATE_BASELINE) {
  writeBaseline(currentWarnings);
  const counts = {};
  for (const g of Object.keys(currentWarnings.guards)) {
    counts[g] = Object.values(currentWarnings.guards[g]).reduce((acc, arr) => acc + arr.length, 0);
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✓ BASELINE actualizado: ${BASELINE_PATH}`);
  console.log('───────────────────────────────────────────────────────────');
  console.log(`  Deuda total registrada: ${total} item(s)`);
  for (const g of Object.keys(counts)) if (counts[g]) console.log(`    ${GUARD_LABELS[g]}: ${counts[g]}`);
  console.log('  COMMITEAR ESTE FILE para que el resto del equipo lo respete.');
  console.log('═══════════════════════════════════════════════════════════');
  process.exit(0);
}

// Modo normal: comparar contra baseline
const baseline = readBaseline();

// Caso 1: NO hay baseline (primera corrida del sistema). Imprime informativo, no falla.
if (!baseline) {
  let totalRaw = 0;
  for (const g of Object.keys(currentWarnings.guards)) {
    const byFile = currentWarnings.guards[g];
    if (Object.keys(byFile).length) {
      totalRaw += Object.values(byFile).reduce((a, arr) => a + arr.length, 0);
      printGuardSection(g, byFile, '  Deuda actual (no hay baseline para comparar todavía).');
    }
  }
  console.log('');
  if (totalRaw === 0) {
    console.log('[build] ✓ 5/5 guards OK. Sin deuda. Para crear snapshot baseline: `node build.js --update-baseline`');
  } else {
    console.log(`[build] ⚠  ${totalRaw} warning(s) sin baseline. Para aceptar este estado como deuda conocida: \`node build.js --update-baseline\``);
  }
  process.exit(0);
}

// Caso 2: Hay baseline. Comparar.
const { newItems, resolvedItems, totalNew, totalResolved, totalKnown } = diffWarnings(currentWarnings.guards, baseline);

if (totalNew > 0) {
  console.log('');
  console.log('🚨 DEUDA NUEVA DETECTADA — bloqueando build');
  for (const g of Object.keys(newItems)) {
    printGuardSection(g, newItems[g], `  ⚠ NUEVO (no estaba en baseline). Arregla o acepta con \`node build.js --update-baseline\`.`);
  }
}

if (totalResolved > 0) {
  console.log('');
  console.log(`✓ ${totalResolved} item(s) de deuda RESUELTOS desde el último baseline.`);
  console.log('  Para limpiar el baseline: `node build.js --update-baseline`');
  for (const g of Object.keys(resolvedItems)) {
    const fileCount = Object.keys(resolvedItems[g]).length;
    const itemCount = Object.values(resolvedItems[g]).reduce((a, arr) => a + arr.length, 0);
    console.log(`    ${GUARD_LABELS[g]}: ${itemCount} item(s) en ${fileCount} archivo(s)`);
  }
}

console.log('');
if (totalNew > 0) {
  console.log(`[build] ❌ FAIL — ${totalNew} deuda(s) NUEVA(s). ${totalKnown} item(s) de baseline conocidos.`);
  process.exit(1);
} else if (totalKnown > 0) {
  console.log(`[build] ✓ 5/5 guards OK. (${totalKnown} item(s) de deuda baseline conocidos${totalResolved ? `, ${totalResolved} resuelto(s)` : ''})`);
  process.exit(0);
} else {
  console.log(`[build] ✓ 5/5 guards OK. Sin deuda${totalResolved ? ` (${totalResolved} resuelto(s) desde baseline)` : ''}.`);
  process.exit(0);
}
