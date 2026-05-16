#!/usr/bin/env node
/**
 * Netlify manual deploy via file digest API.
 * Uploads all git-tracked files to the site.
 *
 * One-shot script — not part of the build chain.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const { execSync } = require('child_process');

const SITE_ID = 'b0d3bc77-051b-4f66-b208-81a61414915b';
const TOKEN = process.env.NETLIFY_AUTH_TOKEN;
if (!TOKEN) { console.error('Missing NETLIFY_AUTH_TOKEN'); process.exit(1); }

// ---- Get list of files to deploy (git tracked) ----
const tracked = execSync('git ls-files', { encoding: 'utf8' })
  .trim().split('\n').filter(Boolean);

console.log(`[deploy] ${tracked.length} files to consider`);

// Filter: only include files we actually want served
// Exclude build sources that Netlify users shouldn't reach directly
const EXCLUDE_PREFIXES = ['_partials/', '_src/', '.gitignore', 'README.md',
                          'build.js', 'extract-css.js', 'migrate.js',
                          'deploy-netlify.js'];
const filesToDeploy = tracked.filter(f =>
  !EXCLUDE_PREFIXES.some(p => f === p || f.startsWith(p))
);
console.log(`[deploy] ${filesToDeploy.length} files after excluding build sources`);

// ---- Compute SHA1 of each file ----
const manifest = {};
const fileBuffers = {};
for (const f of filesToDeploy) {
  const buf = fs.readFileSync(f);
  const sha1 = crypto.createHash('sha1').update(buf).digest('hex');
  // Netlify expects paths with leading slash, OS-independent separator
  const key = '/' + f.replace(/\\/g, '/');
  manifest[key] = sha1;
  fileBuffers[key] = buf;
}

// ---- HTTPS helpers ----
function httpsRequest(opts, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(opts, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const data = Buffer.concat(chunks).toString();
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); }
          catch (_e) { resolve(data); }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 500)}`));
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  // 1. POST deploy manifest
  console.log('[deploy] Posting manifest...');
  const deploy = await httpsRequest({
    hostname: 'api.netlify.com',
    path: `/api/v1/sites/${SITE_ID}/deploys`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    }
  }, JSON.stringify({ files: manifest }));

  console.log(`[deploy] Deploy ID: ${deploy.id}`);
  console.log(`[deploy] Required uploads: ${deploy.required?.length || 0}`);

  // 2. Upload each required file
  // `required` contains SHA1s that Netlify doesn't have yet
  const requiredSet = new Set(deploy.required || []);
  const uploads = Object.entries(manifest)
    .filter(([_p, sha]) => requiredSet.has(sha))
    .map(([p, _sha]) => p);

  let done = 0;
  for (const p of uploads) {
    const buf = fileBuffers[p];
    await httpsRequest({
      hostname: 'api.netlify.com',
      path: `/api/v1/deploys/${deploy.id}/files${p}`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': buf.length
      }
    }, buf);
    done++;
    if (done % 10 === 0 || done === uploads.length) {
      console.log(`  ↑ ${done}/${uploads.length}`);
    }
  }

  // 3. Poll deploy state
  console.log('[deploy] Waiting for ready state...');
  let final = deploy;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 2000));
    final = await httpsRequest({
      hostname: 'api.netlify.com',
      path: `/api/v1/sites/${SITE_ID}/deploys/${deploy.id}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    if (final.state === 'ready' || final.state === 'error') break;
    process.stdout.write(`.`);
  }
  console.log('');
  console.log(`[deploy] State: ${final.state}`);
  console.log(`[deploy] URL:   ${final.deploy_ssl_url}`);
  console.log(`[deploy] Live:  ${final.ssl_url}`);
  if (final.error_message) console.log(`[deploy] Error: ${final.error_message}`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
