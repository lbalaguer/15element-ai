#!/usr/bin/env node
/**
 * Image optimization — PNG → WebP via sharp
 * -----------------------------------------
 * Converts heavy PNG assets to WebP while keeping the original PNG
 * archived in /assets/source/ as a safety net.
 *
 * SEO/AEO consideration: WebP outputs are kept at >= 1200px wide so
 * they remain valid as og:image and JSON-LD Person.image (LinkedIn,
 * Twitter, FB, and Google all require >= 1200px wide for rich preview).
 *
 * Run:  npm run optimize:images
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ASSETS = path.join(__dirname, 'assets');
const SOURCE_BACKUP = path.join(ASSETS, 'source');

const TARGETS = [
  // Photos: 1200px wide preserves og:image rich preview minimum
  { name: 'Luis2.png', width: 1200, quality: 75 },
  { name: 'Luis3.png', width: 1200, quality: 75 },
  { name: 'LuisAiStudio1.png', width: 1200, quality: 75 },
  { name: 'LuisAiStudio2.png', width: 1200, quality: 75 },
  { name: 'LuisAiStudio3.png', width: 1200, quality: 75 },
  { name: 'LuisAiStudio4.png', width: 1200, quality: 75 },
  { name: 'LuisAiStudio5.png', width: 1200, quality: 75 },
  { name: 'LuisAiStudio6.png', width: 1200, quality: 75 },
  { name: 'LuisAiStudio7.png', width: 1200, quality: 75 },
  { name: 'LuisAiStudio8.png', width: 1200, quality: 75 },
  { name: 'LuisAiStudio9.png', width: 1200, quality: 75 },
  { name: 'LuisAiStudio10.png', width: 1200, quality: 75 },

  // Logos: 3x retina of display size. Quality 90 to preserve crisp edges.
  // Display: nav 100x34, footer 86x30, drawer 100x34 → 300x105 is plenty
  { name: 'logo-horizontal-color.png',          width: 300, quality: 90 },
  { name: 'logo-horizontal-navy.png',           width: 300, quality: 90 },
  { name: 'logo-horizontal-color-on-navy.png',  width: 300, quality: 90 },
  { name: 'logo-horizontal-white-on-navy.png',  width: 300, quality: 90 },
  // Mark logos: largest display ~520px (hero-decor), 600 wide covers all uses
  { name: 'logo-mark-color.png',          width: 600, quality: 90 },
  { name: 'logo-mark-navy.png',           width: 600, quality: 90 },
  { name: 'logo-mark-white-on-navy.png',  width: 600, quality: 90 },
];

(async () => {
  if (!fs.existsSync(SOURCE_BACKUP)) fs.mkdirSync(SOURCE_BACKUP, { recursive: true });

  for (const t of TARGETS) {
    const pngPath = path.join(ASSETS, t.name);
    const webpPath = pngPath.replace(/\.png$/i, '.webp');
    const backupPath = path.join(SOURCE_BACKUP, t.name);

    if (!fs.existsSync(pngPath)) {
      console.log(`  − skip ${t.name} (not found in /assets/)`);
      continue;
    }

    const beforeKB = Math.round(fs.statSync(pngPath).size / 1024);
    const meta = await sharp(pngPath).metadata();

    await sharp(pngPath)
      .resize({ width: t.width, withoutEnlargement: true, kernel: 'lanczos3' })
      .webp({ quality: t.quality, effort: 6 })
      .toFile(webpPath);

    const afterKB = Math.round(fs.statSync(webpPath).size / 1024);
    const saved = Math.round(((beforeKB - afterKB) / beforeKB) * 100);

    // Backup the original PNG (only if not already archived)
    if (!fs.existsSync(backupPath)) fs.copyFileSync(pngPath, backupPath);

    console.log(
      `  ✓ ${t.name}  ${meta.width}×${meta.height} ${beforeKB}KB` +
      `  →  ${path.basename(webpPath)}  ${t.width}px wide ${afterKB}KB  (-${saved}%)`
    );
  }

  console.log('\n[optimize] Done. Originals archived in /assets/source/.');
  console.log('[optimize] Now run: node build.js  (after updating HTML refs to .webp).');
})().catch((e) => {
  console.error('[optimize] FAILED:', e.message);
  process.exit(1);
});
