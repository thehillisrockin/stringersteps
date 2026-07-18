#!/usr/bin/env node
/*
 * Stringer Steps hub build — THE YELLOW 2026 design (locked by Phil 2026-07-18).
 * Reads guides.json + hub-src/page.template.html + hub-src/assets/, writes
 * index.html + sitemap.xml + llms.txt. Only visibility:"public" guides are
 * ever emitted. Private guides stay direct-link folders and never appear on
 * the hub, the sitemap, or llms.txt.
 *
 * Design rules baked in (see vault phil-stringer-brand-kit-2026.md):
 * - photography-forward hero, grain, SUPR display, Seasalt at DISPLAY size
 * - Seasalt Doodles annotations, yellow #F6C627 as sparse accent
 * - never the phrase "no fluff"; no one-or-two-word orphan lines
 * Zero dependencies. Run: node build.js
 */
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const SRC = path.join(ROOT, 'hub-src');

const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'guides.json'), 'utf8'));
const SITE = data.site || 'https://stringersteps.com';
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const pub = data.guides.filter((g) => g.visibility === 'public');
const flagships = pub.filter((g) => g.flagship);
let featured = pub.filter((g) => g.featured).sort((a, b) => (b.updated || '').localeCompare(a.updated || ''));
if (featured.length > 1) console.warn('WARN: more than one featured guide, using most recent: ' + featured[0].keyword);
let featuredGuide = featured[0] || [...pub].sort((a, b) => (b.updated || '').localeCompare(a.updated || ''))[0] || null;

// ---------- fragments (yellow-kit markup; classes live in the template CSS) ----------
function minicard(g) {
  return `<a class="minicard" href="/${esc(g.keyword)}">
            <span class="mkw">${esc(String(g.keyword).toUpperCase())}</span>
            <h5>${esc(g.title)}</h5>
            <p>${esc(g.oneLineOutcome)}</p>
            <span class="mgo">OPEN GUIDE →</span>
          </a>`;
}

const startHereSection = flagships.length ? `
  <section class="band" id="start-here" aria-labelledby="sh-h">
    <div class="wrap">
      <h2 class="sh" id="sh-h">NEW TO THIS? START WITH&nbsp;THESE.</h2>
      <div class="mini-grid">
        ${flagships.map(minicard).join('\n        ')}
      </div>
    </div>
  </section>` : '';

const featuredSection = `
  <section class="band" id="new-this-week" aria-labelledby="ntw-h">
    <div class="wrap">
      <span class="slabel seasalt">new this week
        <svg class="stroke" width="150" height="10" viewBox="0 0 150 10" fill="none" aria-hidden="true"><path d="M3 6 C50 3, 100 3, 147 5" stroke-width="3.4" stroke-linecap="round"/></svg>
      </span>
      ${featuredGuide ? `<a class="feature" href="/${esc(featuredGuide.keyword)}" id="ntw-h">
        <span class="kw">${esc(String(featuredGuide.keyword).toUpperCase())}</span>
        <h3>${esc(featuredGuide.title)}</h3>
        <p>${esc(featuredGuide.oneLineOutcome)}</p>
        <span class="go">OPEN THE GUIDE <span class="doodle" aria-hidden="true">f</span></span>
      </a>
      <div class="feature-note"><span class="script seasalt">heard me say ${esc(String(featuredGuide.keyword).toUpperCase())} on a video? this is&nbsp;it.</span></div>` :
      `<div class="feature" id="ntw-h" style="cursor:default">
        <h3>THE FIRST GUIDES DROP&nbsp;SOON.</h3>
        <p>I'm building these one at a time. Grab the Launchpad below and you'll catch each one the day it goes&nbsp;live.</p>
      </div>`}
    </div>
  </section>`;

const topicsSection = `
  <section class="band" id="topics" aria-labelledby="topics-h">
    <div class="wrap">
      <h2 class="sh" id="topics-h">PICK WHAT YOU'RE TRYING TO FIGURE&nbsp;OUT.</h2>
      <div class="pillars">
        ${data.pillars.map((p) => {
          const gs = pub.filter((g) => g.topic === p.key);
          return `<div class="pillar">
          <h4><span class="doodle" aria-hidden="true">c</span>${esc(p.label)}</h4>
          <p class="blurb">${esc(p.blurb)}</p>${gs.length ? '\n          ' + gs.map(minicard).join('\n          ') : ''}
        </div>`;
        }).join('\n        ')}
      </div>
      <div class="soonline">
        <span class="script seasalt">more guides drop all&nbsp;the&nbsp;time.</span>
        <a href="#weekly">GET THE LAUNCHPAD →</a>
      </div>
    </div>
  </section>`;

// ---------- assemble ----------
let html = fs.readFileSync(path.join(SRC, 'page.template.html'), 'utf8');
html = html
  .replace('{{START_HERE_SECTION}}', startHereSection)
  .replace('{{FEATURED_SECTION}}', featuredSection)
  .replace('{{TOPICS_SECTION}}', topicsSection)
  .replace('{{CTA_TARGET}}', flagships.length ? 'start-here' : 'topics');

// inline assets as data URIs: {{A:filename}}
html = html.replace(/\{\{A:([a-z0-9.\-]+)\}\}/g, (m, f) =>
  fs.readFileSync(path.join(SRC, 'assets', f)).toString('base64'));

if (html.includes('{{')) throw new Error('unresolved template token remains');
fs.writeFileSync(path.join(ROOT, 'index.html'), html);

// sitemap.xml (root + public guides only)
const urls = [SITE + '/'].concat(pub.map((g) => g.url || (SITE + '/' + g.keyword)));
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => '  <url><loc>' + esc(u) + '</loc></url>').join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);

// llms.txt (public guides only)
const llms = `# Stringer Steps
Free step-by-step walkthroughs by Phil Stringer. Public library at ${SITE}. New guides drop all the time.

## Guides
${pub.length ? pub.map((g) => `- ${g.title} — ${g.oneLineOutcome} — ${g.url || (SITE + '/' + g.keyword)}`).join('\n') : '- The first guides are being published now. Check back or subscribe at ' + SITE + ' .'}
`;
fs.writeFileSync(path.join(ROOT, 'llms.txt'), llms);

console.log('Built index.html, sitemap.xml, llms.txt (yellow kit)');
console.log('  public guides: ' + pub.length + '  |  flagships: ' + flagships.length + '  |  featured: ' + (featuredGuide ? featuredGuide.keyword : 'none (empty-state)'));
console.log('  private (kept off hub/sitemap): ' + data.guides.filter((g) => g.visibility === 'private').map((g) => g.keyword).join(', '));
