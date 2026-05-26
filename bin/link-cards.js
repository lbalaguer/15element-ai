#!/usr/bin/env node
const fs = require('fs');
const path = '_src/casos/index.html';
let s = fs.readFileSync(path, 'utf8');

const blogMap = {
  'NextCo': 'nextco-842-leads-b2b-sin-ads',
  'Itechmaint': 'itechmaint-energia-solar-chile-linkedin',
  'Spakio': 'spakio-amazon-oxxo-liverpool-pipeline-b2b',
  'Top Energy': 'top-energy-9m-usd-linkedin-organico',
  'Mercedes-Benz': 'mercedes-benz-cinepolis-linkedin-b2b-alto-ticket',
  'Cinépolis': 'mercedes-benz-cinepolis-linkedin-b2b-alto-ticket',
  'Nova Energía': 'nova-energia-ecuador-leads-solar-linkedin',
  'OpLogistics': 'oplogistics-pipeline-logistica-b2b-linkedin'
};

const lines = s.split('\n');
let changed = 0;
let i = 0;
while (i < lines.length) {
  const openRe = /^(\s*)<div class="(case-card|hero-case) reveal"(.*?)>\s*$/;
  const m = lines[i].match(openRe);
  if (!m) { i++; continue; }
  const indent = m[1], cardClass = m[2], rest = m[3];
  // Find h3 and matching closing </div>
  let depth = 1;
  let j = i + 1;
  let h3Name = '';
  for (; j < lines.length; j++) {
    const h3m = lines[j].match(/<h3>([^<]+)<\/h3>/);
    if (h3m && !h3Name) h3Name = h3m[1].trim();
    const opens = (lines[j].match(/<div\b/g) || []).length;
    const closes = (lines[j].match(/<\/div>/g) || []).length;
    depth += opens - closes;
    if (depth === 0) break;
  }
  if (j >= lines.length) { i++; continue; }
  if (h3Name && blogMap[h3Name]) {
    const slug = blogMap[h3Name];
    lines[i] = `${indent}<a href="/blog/${slug}/" class="${cardClass} reveal is-linked"${rest}>`;
    // close: replace last </div> on line j
    lines[j] = lines[j].replace(/<\/div>(\s*)$/, '</a>$1');
    // Insert CTA before close (only for case-card, not hero — hero already shows big metric)
    if (cardClass === 'case-card') {
      lines.splice(j, 0, `${indent}  <div class="case-card-cta">Ver caso completo →</div>`);
      j++;
    }
    changed++;
  }
  i = j + 1;
}

fs.writeFileSync(path, lines.join('\n'));
console.log('cards linkeadas:', changed);
