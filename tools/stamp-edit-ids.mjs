#!/usr/bin/env node
// Stamp data-e edit ids onto every block of copy in a guide, idempotently, and
// save the stamped page as the guide's baseline (_baselines/<guide>.html).
// Phil's edits (team.philstringer.com/edit) are stored against these ids; the
// publisher (tools/publish-edits.mjs) bakes them onto the baseline and pushes.
//   node tools/stamp-edit-ids.mjs <guide>
import fs from 'fs';
import path from 'path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const g = process.argv[2];
if (!g) { console.error('usage: node tools/stamp-edit-ids.mjs <guide>'); process.exit(1); }
const file = path.join(ROOT, g, 'index.html');
let html = fs.readFileSync(file, 'utf8');

const KINDS = [
  [(t, c) => t === 'h1', 'h1'], [(t, c) => t === 'h3', 'h3'],
  [(t, c) => /\beyebrow\b/.test(c), 'eyebrow'], [(t, c) => t === 'p' && /\blead\b/.test(c), 'lead'],
  [(t, c) => t === 'p' && /\bsub\b/.test(c), 'sub'], [(t, c) => /\bnote\b/.test(c), 'note'],
  [(t, c) => /\bcap\b/.test(c), 'cap'], [(t, c) => /\bctxt\b/.test(c), 'ctxt'], [(t, c) => /\bshotcap\b/.test(c), 'shotcap'],
  [(t, c) => /\bce\b/.test(c), 'cta-ce'], [(t, c) => /\bctabtn\b/.test(c), 'cta-btn'], [(t, c) => t === 'pre', 'pre'],
  [(t, c) => t === 'a' && /\bdl\b/.test(c), 'dl'], [(t, c) => /\bstepmenu-sub\b/.test(c), 'menu-sub'], [(t, c) => /\bsc-b\b/.test(c), 'skill'],
];
const TAG = /<(h1|h3|p|div|span|label|pre|a)\b([^>]*)>/g;

function stampChunk(chunk, slug, counters) {
  // blocks that need their parent for a kind: the finish CTA paragraph and recap rows
  const ranges = [];
  for (const [re, kind] of [[/<div class="cta">/g, 'cta-p'], [/<div class="recap"[^>]*>/g, 'recap']]) {
    let m; while ((m = re.exec(chunk))) {
      let depth = 1, i = m.index + m[0].length; const open = /<div\b/g, close = /<\/div>/g;
      while (depth && i < chunk.length) { open.lastIndex = i; close.lastIndex = i; const o = open.exec(chunk), c = close.exec(chunk); if (!c) break;
        if (o && o.index < c.index) { depth++; i = o.index + 4; } else { depth--; i = c.index + (depth ? 6 : 0); } }
      ranges.push([m.index, i, kind]);
    }
  }
  return chunk.replace(TAG, (m, tag, attrs, offset) => {
    if (/\sdata-e=/.test(attrs)) return m;
    const cls = ((attrs.match(/\sclass="([^"]*)"/) || [])[1] || '');
    let kind = null;
    for (const [test, k] of KINDS) if (test(tag, cls)) { kind = k; break; }
    if (!kind) {
      const r = ranges.find((r) => offset > r[0] && offset < r[1]);
      if (r && r[2] === 'cta-p' && tag === 'p') kind = 'cta-p';
      if (r && r[2] === 'recap' && tag === 'div' && !cls) kind = 'recap';
    }
    if (!kind) return m;
    const key = slug + '.' + kind; counters[key] = (counters[key] || 0) + 1;
    return `<${tag}${attrs} data-e="${key}-${counters[key]}">`;
  });
}

const counters = {};
const parts = html.split(/(?=<section class="screen)/);
let out = '', n = 0, seen = new Set();
for (const part of parts) {
  let slug = 'global';
  if (part.startsWith('<section class="screen')) {
    const open = part.slice(0, part.indexOf('>') + 1);
    slug = (open.match(/data-screen="([^"]+)"/) || [])[1] || (open.match(/\sid="([^"]+)"/) || [])[1] || ('screen-' + n);
    n++;
  }
  if (seen.has(slug)) slug = slug + '-' + n; seen.add(slug);
  out += stampChunk(part, slug, counters);
}
const total = Object.values(counters).reduce((a, b) => a + b, 0);
fs.writeFileSync(file, out);
fs.writeFileSync(path.join(ROOT, '_baselines', g + '.html'), out);
console.log(`${g}: ${total} editable blocks stamped, baseline written`);
