#!/usr/bin/env node
// Convierte assets/evidencia/*.{png,jpg,jpeg} → .webp (q 78, max 1600px ancho).
// Solo procesa caso-* (ignora otras imgs).
import { readdirSync, statSync, existsSync, unlinkSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import sharp from 'sharp';

const dir = join(process.cwd(), 'assets/evidencia');
const files = readdirSync(dir).filter(f => /^caso-.*\.(png|jpg|jpeg)$/i.test(f));

let totalIn = 0, totalOut = 0, ok = 0, skip = 0;
for (const f of files) {
  const src = join(dir, f);
  const name = basename(f, extname(f));
  const out = join(dir, name + '.webp');
  if (existsSync(out)) { skip++; continue; }
  const inSz = statSync(src).size;
  try {
    await sharp(src).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 78 }).toFile(out);
    const outSz = statSync(out).size;
    totalIn += inSz; totalOut += outSz; ok++;
    console.log(`✓ ${f}  ${(inSz/1024).toFixed(0)}KB → ${(outSz/1024).toFixed(0)}KB  (${Math.round((1-outSz/inSz)*100)}%)`);
  } catch (e) {
    console.log(`✗ ${f}  ${e.message}`);
  }
}
console.log(`\n${ok} converted, ${skip} skipped. Total: ${(totalIn/1024/1024).toFixed(2)} MB → ${(totalOut/1024/1024).toFixed(2)} MB (saved ${Math.round((1-totalOut/totalIn)*100)}%)`);
