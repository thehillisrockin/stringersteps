#!/usr/bin/env node
// SUPR K fix. The SUPR display font draws its K as a near-H (two slabs with a
// tiny notch), so "GROK BOT" reads "GROH BOT" on a phone. We keep the real K in
// the text (search, screen readers, copy/paste) and paint a clean K over it:
// every K/k in SUPR-set text gets <span class="k">, the letter goes transparent,
// and a K-shaped CSS mask filled with currentColor sits on top.
//
// Which elements are SUPR-set is read from the page's own CSS (a small cascade:
// selectors, specificity, inheritance, inline styles), so h1s, .cta h3, hub card
// titles and anything added later are all covered without a hand-kept list.
// Idempotent: old wraps are removed and re-applied, so it is safe to run on any
// page, any number of times. Used by:
//   - tools/stamp-edit-ids.mjs   (every stamped guide + its baseline)
//   - tools/publish-edits.mjs    (Phil's /edit overrides arrive unwrapped)
//   - build.js                   (hub index.html + 404.html)
//   - by hand:  node tools/supr-k.cjs <guide>... | --all
'use strict';
const fs = require('fs');
const path = require('path');

const KSVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 49 100' preserveAspectRatio='none'>"
  + "<path d='M0 0H17V40L31 0H49L33 46L49 100H31L17 58V100H0Z'/></svg>";
const MASK = `url("${KSVG}") no-repeat .02em 0/.34em .7em`;
const MARK = '/* SUPR K fix';
// The mask hangs from the top of the letter's box, which is the font's ascent.
// SUPR's hhea ascent is its cap height (700/1000) but its Windows ascent is 825,
// so without the overrides below the K would float .125em high on Windows.
const METRICS = 'ascent-override:70%;descent-override:20%;line-gap-override:0%;';
const CSS = `<style>${MARK}: the font's K reads as H. The real letter stays in the text; a clean K is painted over it. Wraps come from tools/supr-k.cjs. */`
  // the fill covers only the K's own box, so no mask edge can leak a hairline beside it (seen in print PDFs)
  + `.k{-webkit-text-fill-color:transparent;background:linear-gradient(currentColor,currentColor) no-repeat .02em 0/.34em .7em;-webkit-mask:${MASK};mask:${MASK}}`
  // while Phil types in /edit, show plain letters so the caret and new text stay visible
  + `body.ed [data-e]:focus .k{-webkit-text-fill-color:currentColor;background:none;-webkit-mask:none;mask:none}`
  + `@media print{.k{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>`;

// For pages whose scripts write SUPR text after load (botcheck results, the Fred
// joke card): wrap Ks in anything added later. Static wraps still do the rest.
const RUNTIME_MARK = '/* SUPR K runtime';
const RUNTIME = `<script>${RUNTIME_MARK}: wraps K in SUPR text that scripts add after load. See tools/supr-k.cjs. */`
  + `(function(){var S=/^\\s*["']?SUPR/i;function fix(r){if(!r||r.nodeType!==1)return;`
  + `var w=document.createTreeWalker(r,NodeFilter.SHOW_TEXT),n,todo=[];`
  + `while((n=w.nextNode())){var p=n.parentElement;if(p&&!p.classList.contains('k')&&/[Kk]/.test(n.data)&&S.test(getComputedStyle(p).fontFamily))todo.push(n);}`
  + `todo.forEach(function(n){var f=document.createDocumentFragment();n.data.split(/([Kk])/).forEach(function(t,i){if(!t)return;`
  + `if(i%2){var s=document.createElement('span');s.className='k';s.textContent=t;f.appendChild(s);}else f.appendChild(document.createTextNode(t));});`
  + `n.parentNode.replaceChild(f,n);});}`
  + `fix(document.body);new MutationObserver(function(ms){ms.forEach(function(m){if(m.type==='characterData')fix(m.target.parentNode);`
  + `else m.addedNodes.forEach(function(a){fix(a.nodeType===1?a:a.parentNode);});});}).observe(document.body,{childList:true,subtree:true,characterData:true});})();</script>`;

const VOID = new Set('area base br col embed hr img input link meta source track wbr param'.split(' '));
const RAW = new Set(['script', 'style', 'textarea', 'title']);
const OLD = /<span( class="k")?>([Kk])<\/span>/y;
const TOKEN = /<!--[\s\S]*?-->|<![^>]*>|<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:\s+[^\s=\/>]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/g;

// ---------- CSS: which selectors set which font ----------
function isSuprFont(v) {
  const first = v.trim().split(',')[0].trim().replace(/^['"]|['"]$/g, '');
  return /^SUPR$/i.test(first) || /^var\(--supr\b/i.test(first);
}
function fontOf(decls) {
  // last font-family / font declaration in the block wins
  let out = null; const re = /(?:^|;)\s*(font-family|font)\s*:\s*([^;]+)/gi; let m;
  while ((m = re.exec(decls))) {
    const v = m[2].replace(/!important/i, '').trim();
    if (/^(inherit|unset|initial|revert)$/i.test(v)) { out = null; continue; }
    if (m[1].toLowerCase() === 'font') {
      if (/SUPR|var\(--supr/i.test(v)) out = true;
      else if (/,|["']|\b(sans-serif|serif|cursive|monospace|system-ui)\b|var\(--/.test(v)) out = false;
      continue;
    }
    out = isSuprFont(v);
  }
  return out;
}
function parseCompound(s) {
  if (/[:\[]/.test(s)) return null; // pseudo / attribute selectors: not used to set fonts here
  const c = { tag: null, classes: [], id: null };
  const re = /([a-zA-Z][\w-]*)|\.([\w-]+)|#([\w-]+)|\*|(\[[^\]]*\])|(:[\w-]+(?:\([^)]*\))?)/g; let m, pos = 0;
  while ((m = re.exec(s))) {
    if (m.index !== pos) return null; pos = re.lastIndex;
    if (m[1]) c.tag = m[1].toLowerCase(); else if (m[2]) c.classes.push(m[2]); else if (m[3]) c.id = m[3];
  }
  return pos === s.length ? c : null;
}
function parseSelector(sel) {
  const parts = sel.trim().replace(/\s*>\s*/g, ' > ').split(/\s+/);
  const chain = []; let child = false;
  for (const p of parts) {
    if (p === '>') { child = true; continue; }
    const c = parseCompound(p); if (!c) return null;
    chain.push({ ...c, child }); child = false;
  }
  if (!chain.length) return null;
  const spec = chain.reduce((a, c) => [a[0] + (c.id ? 1 : 0), a[1] + c.classes.length, a[2] + (c.tag ? 1 : 0)], [0, 0, 0]);
  return { chain, spec: spec[0] * 1e6 + spec[1] * 1e3 + spec[2] };
}
function fontRules(html) {
  const rules = []; let order = 0;
  const styles = []; const sre = /<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi; let m;
  while ((m = sre.exec(html))) styles.push(m[1]);
  for (let css of styles) {
    css = css.replace(/\/\*[\s\S]*?\*\//g, '');
    // flatten: drop @font-face / @keyframes / print blocks, keep rules inside screen @media
    const walk = (text, skip) => {
      const re = /([^{}]+)\{/g; let mm; re.lastIndex = 0; let idx = 0;
      while (idx < text.length) {
        re.lastIndex = idx; mm = re.exec(text); if (!mm) break;
        const head = mm[1].trim(); let depth = 1, j = re.lastIndex;
        while (j < text.length && depth) { if (text[j] === '{') depth++; else if (text[j] === '}') depth--; j++; }
        const body = text.slice(re.lastIndex, j - 1);
        if (head.startsWith('@')) {
          if (/^@media/i.test(head) && !/\bprint\b/i.test(head)) walk(body, false);
        } else if (!skip) {
          const f = fontOf(body);
          if (f !== null) for (const s of head.split(',')) { const p = parseSelector(s); if (p) rules.push({ ...p, supr: f, order: order++ }); }
        }
        idx = j;
      }
    };
    walk(css, false);
  }
  return rules;
}
function matches(chain, stack) {
  // stack: array of {tag, classes:Set, id}; last = the element itself
  let si = stack.length - 1; let ci = chain.length - 1;
  const ok = (c, e) => (!c.tag || c.tag === e.tag) && (!c.id || c.id === e.id) && c.classes.every((k) => e.classes.has(k));
  if (!ok(chain[ci], stack[si])) return false;
  const rec = (ci, si) => {
    if (ci < 0) return true;
    const needChild = chain[ci + 1].child;
    for (let s = si; s >= 0; s--) {
      if (ok(chain[ci], stack[s]) && rec(ci - 1, s - 1)) return true;
      if (needChild) return false;
    }
    return false;
  };
  return rec(ci - 1, si - 1);
}

// ---------- HTML walk ----------
function attr(attrs, name) {
  const m = attrs.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return m ? (m[1] ?? m[2] ?? m[3]) : null;
}
const wrapText = (t) => t.replace(/(&[#a-zA-Z0-9]+;)|([Kk])/g, (m, ent, k) => ent || `<span class="k">${k}</span>`);

function wrapPage(html, rules) {
  let out = '', last = 0, count = 0;
  const stack = [{ tag: '#root', classes: new Set(), id: null, supr: false }];
  TOKEN.lastIndex = 0; let m;
  const text = (t) => {
    const top = stack[stack.length - 1];
    if (top.supr && /[Kk]/.test(t)) { const w = wrapText(t); count += (w.length - t.length) / '<span class="k"></span>'.length; return w; }
    return t;
  };
  while ((m = TOKEN.exec(html))) {
    out += text(html.slice(last, m.index)); last = TOKEN.lastIndex;
    const tok = m[0];
    if (m[1]) { // end tag
      const name = m[1].toLowerCase();
      for (let s = stack.length - 1; s > 0; s--) if (stack[s].tag === name) { stack.length = s; break; }
      out += tok; continue;
    }
    if (!m[2]) { out += tok; continue; } // comment / doctype
    const name = m[2].toLowerCase(); const attrs = m[3] || '';
    // an earlier wrap (ours), or the bare <span>K</span> the /edit sanitizer leaves in SUPR text: unwrap, re-wrap below
    OLD.lastIndex = m.index; const old = OLD.exec(html);
    if (old && (old[1] || stack[stack.length - 1].supr)) {
      out += text(old[2]); last = TOKEN.lastIndex = OLD.lastIndex; continue;
    }
    out += tok;
    if (RAW.has(name)) { // copy raw text through untouched
      const end = html.toLowerCase().indexOf(`</${name}`, last); const stop = end < 0 ? html.length : end;
      out += html.slice(last, stop); last = stop; TOKEN.lastIndex = stop; continue;
    }
    if (VOID.has(name) || m[4]) continue;
    const el = { tag: name, classes: new Set((attr(attrs, 'class') || '').split(/\s+/).filter(Boolean)), id: attr(attrs, 'id') };
    const probe = stack.slice(1).concat(el);
    let best = null;
    for (const r of rules) if (matches(r.chain, probe) && (!best || r.spec > best.spec || (r.spec === best.spec && r.order > best.order))) best = r;
    const inline = attr(attrs, 'style'); const inl = inline ? fontOf(inline) : null;
    el.supr = inl !== null ? inl : best ? best.supr : stack[stack.length - 1].supr;
    stack.push(el);
  }
  out += text(html.slice(last));
  return { html: out, count };
}

function fixPage(html, { runtime = false } = {}) {
  // strip any earlier CSS block + wraps, then re-derive everything
  let s = html.replace(/<style>\/\* SUPR K fix[\s\S]*?<\/style>\n?/g, '');
  if (runtime && !s.includes(RUNTIME_MARK)) s = s.replace(/<\/body>(?![\s\S]*<\/body>)/, RUNTIME + '\n</body>');
  const { html: wrapped, count } = wrapPage(s, fontRules(s));
  if (!count && !s.includes(RUNTIME_MARK)) return { html: s, count };
  s = wrapped.replace('</head>', CSS + '\n</head>');
  s = s.replace(/@font-face\s*\{\s*font-family\s*:\s*(['"]?)SUPR\1\s*;(?!ascent-override)/g, (m) => m + METRICS);
  return { html: s, count };
}

module.exports = { fixPage, CSS, KSVG };

if (require.main === module) {
  const ROOT = path.resolve(__dirname, '..');
  let args = process.argv.slice(2);
  const runtime = args.includes('--runtime'); args = args.filter((a) => a !== '--runtime');
  if (!args.length) { console.error('usage: node tools/supr-k.cjs [--runtime] <guide>... | --all'); process.exit(1); }
  if (args[0] === '--all') args = fs.readdirSync(ROOT).filter((d) => fs.existsSync(path.join(ROOT, d, 'index.html')));
  for (const g of args) {
    for (const f of [path.join(ROOT, g, 'index.html'), path.join(ROOT, '_baselines', g + '.html')]) {
      if (!fs.existsSync(f)) continue;
      const before = fs.readFileSync(f, 'utf8'); const { html, count } = fixPage(before, { runtime });
      if (html !== before) fs.writeFileSync(f, html);
      console.log(`${path.relative(ROOT, f)}: ${count} K${count === 1 ? '' : 's'} wrapped${html === before ? ' (no change)' : ''}`);
    }
  }
}
