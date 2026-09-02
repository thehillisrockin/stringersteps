#!/usr/bin/env node
// Bake Phil's saved edits into the public guides and push. Runs every minute
// from launchd (com.philstringer.stringersteps-publish). For each public guide
// with a baseline: fetch its overrides, and if they changed since last time,
// regenerate <guide>/index.html = baseline + overrides, commit, push.
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const HOME = process.env.HOME || '/Users/philstringer';
const STATE = path.join(HOME, '.stringersteps-publish-state.json');
const LOG = path.join(HOME, 'Library/Logs/stringersteps-publish.log');
const API = 'https://training.philstringer.com/api/guide-edits?guide=';
const log = (m) => fs.appendFileSync(LOG, new Date().toISOString() + ' ' + m + '\n');

const OPEN_RE = (id) => new RegExp(`(<[a-z0-9]+[^>]*\\sdata-e="${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>)`, 'i');
function replaceInner(html, id, inner) {
  const m = html.match(OPEN_RE(id)); if (!m) return html;
  const openEnd = m.index + m[0].length; const tagName = (m[0].match(/^<([a-z0-9]+)/i) || [])[1]; if (!tagName) return html;
  const open = new RegExp(`<${tagName}\\b`, 'gi'), close = new RegExp(`</${tagName}\\s*>`, 'gi');
  let depth = 1, i = openEnd;
  while (i < html.length && depth > 0) { open.lastIndex = i; close.lastIndex = i; const o = open.exec(html), c = close.exec(html); if (!c) return html;
    if (o && o.index < c.index) { depth++; i = o.index + o[0].length; } else { depth--; i = c.index + (depth === 0 ? 0 : c[0].length); } }
  if (depth !== 0) return html;
  return html.slice(0, openEnd) + inner + html.slice(i);
}
const applyEdits = (html, edits) => edits.reduce((h, e) => (e && e.edit_id && typeof e.html === 'string') ? replaceInner(h, e.edit_id, e.html) : h, html);

const state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : {};
const man = JSON.parse(fs.readFileSync(path.join(ROOT, 'guides.json'), 'utf8'));
const changed = [];
for (const g of man.guides.filter((x) => x.visibility === 'public')) {
  const k = g.keyword, base = path.join(ROOT, '_baselines', k + '.html');
  if (!fs.existsSync(base)) continue;
  let edits;
  try { const r = await fetch(API + encodeURIComponent(k), { cache: 'no-store' }); const d = await r.json();
    edits = (d.edits || []).map((e) => ({ edit_id: e.edit_id, html: e.html })).sort((a, b) => a.edit_id.localeCompare(b.edit_id)); }
  catch (e) { log(`${k}: fetch failed ${e.message}`); continue; }
  const sig = JSON.stringify(edits);
  if (state[k] === sig) continue;
  const out = applyEdits(fs.readFileSync(base, 'utf8'), edits);
  const target = path.join(ROOT, k, 'index.html');
  if (fs.readFileSync(target, 'utf8') !== out) { fs.writeFileSync(target, out); changed.push([k, edits.length]); }
  state[k] = sig;
}
if (changed.length) {
  try {
    const files = changed.map((c) => c[0] + '/index.html');
    execSync(`git add ${files.join(' ')}`, { cwd: ROOT });
    const msg = changed.map((c) => `${c[0]}: Phil's edits (${c[1]} blocks)`).join('; ');
    execSync(`git commit -q -m ${JSON.stringify(msg)}`, { cwd: ROOT });
    execSync('git push -q origin HEAD', { cwd: ROOT, stdio: 'pipe' });
    log('published ' + JSON.stringify(changed));
  } catch (e) { log('git failed: ' + String(e.message).slice(0, 300)); process.exit(1); }
}
fs.writeFileSync(STATE, JSON.stringify(state));
