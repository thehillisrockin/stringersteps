#!/usr/bin/env node
/*
 * Stringer Steps hub build.
 * Reads guides.json, writes index.html + sitemap.xml + llms.txt.
 * Only visibility:"public" guides are ever emitted. Private guides
 * (workshop homework, fred, etc.) stay direct-link folders and never
 * appear on the hub, the sitemap, or llms.txt.
 * Zero dependencies. Run: node build.js
 */
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

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

// ---------- fragments ----------
function card(g) {
  return `<a class="card" href="/${esc(g.keyword)}">
        <span class="kw">${esc(String(g.keyword).toUpperCase())}</span>
        <h3>${esc(g.title)}</h3>
        <p>${esc(g.oneLineOutcome)}</p>
        <span class="go">Open guide &rarr;</span>
      </a>`;
}

const startHereSection = flagships.length ? `
  <section class="band" id="start-here" aria-labelledby="sh-h">
    <div class="wrap">
      <p class="eyebrow">Start Here</p>
      <h2 id="sh-h">New to this? These are the ones I'd hand you first.</h2>
      <div class="cards">
        ${flagships.map(card).join('\n        ')}
      </div>
    </div>
  </section>` : '';

const featuredSection = featuredGuide ? `
  <section class="band featured" id="new-this-week" aria-labelledby="ntw-h">
    <div class="wrap">
      <p class="eyebrow amber">New This Week</p>
      <a class="feature-card" href="/${esc(featuredGuide.keyword)}">
        <span class="kw big">${esc(String(featuredGuide.keyword).toUpperCase())}</span>
        <h2 id="ntw-h">${esc(featuredGuide.title)}</h2>
        <p class="lead">${esc(featuredGuide.oneLineOutcome)}</p>
        <span class="btn">Open this week's guide &rarr;</span>
        <span class="feature-note">Heard me say "${esc(String(featuredGuide.keyword).toUpperCase())}" on a video or live? This is it.</span>
      </a>
    </div>
  </section>` : `
  <section class="band featured" id="new-this-week" aria-labelledby="ntw-h">
    <div class="wrap">
      <p class="eyebrow amber">New This Week</p>
      <div class="feature-card empty">
        <h2 id="ntw-h">The first guides drop this week.</h2>
        <p class="lead">I'm building these one at a time, and the newest one lands right here every week. Grab the weekly email so you catch them the day they go live.</p>
        <a class="btn" href="#weekly">Get the weekly email &rarr;</a>
      </div>
    </div>
  </section>`;

const topicsSection = `
  <section class="band" id="topics" aria-labelledby="topics-h">
    <div class="wrap">
      <p class="eyebrow">Browse by Topic</p>
      <h2 id="topics-h">Pick what you're trying to figure out.</h2>
      <div class="pillars">
        ${data.pillars.map((p) => {
          const gs = pub.filter((g) => g.topic === p.key);
          const body = gs.length
            ? `<div class="cards small">${gs.map(card).join('')}</div>`
            : `<p class="soon">More coming here soon. I add guides for this every week. <a href="#weekly">Get the weekly email</a> and I'll send the new ones as they drop.</p>`;
          return `<div class="pillar">
          <h3>${esc(p.label)}</h3>
          <p class="blurb">${esc(p.blurb)}</p>
          ${body}
        </div>`;
        }).join('\n        ')}
      </div>
    </div>
  </section>`;

// ---------- page ----------
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Stringer Steps &middot; Free step-by-step guides that get you unstuck</title>
<meta name="description" content="A free, growing library of dead-simple interactive walkthroughs by Phil Stringer. Using AI, getting found online, and running your business smarter, one small step at a time. New guides every week.">
<link rel="canonical" href="${SITE}/">
<meta property="og:title" content="Stringer Steps">
<meta property="og:description" content="Free step-by-step guides that actually get you unstuck. New ones every week.">
<meta property="og:url" content="${SITE}/">
<meta property="og:type" content="website">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"CollectionPage","name":"Stringer Steps","url":"${SITE}/","description":"A free, growing library of step-by-step interactive guides by Phil Stringer.","author":{"@type":"Person","name":"Phil Stringer","url":"https://philstringer.com"}}
</script>
<style>
:root{
  --paper:#F2EDE4; --card:#FBF8F1; --bg:#E7DECF; --red:#8F2211; --red-deep:#6E190C;
  --amber:#E8AC13; --blue:#88B1DB; --ink:#221C18; --espresso:#2B1D15; --muted:#6b5f52;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{
  margin:0; background:var(--paper); color:var(--ink);
  font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
  font-size:18px; line-height:1.6; text-wrap:pretty;
  -webkit-font-smoothing:antialiased;
}
/* faded grain */
body::before{
  content:""; position:fixed; inset:0; z-index:0; pointer-events:none; opacity:.05;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
.wrap{max-width:1060px; margin:0 auto; padding:0 22px; position:relative; z-index:1}
a{color:var(--red); text-decoration:none}
h1,h2,h3{font-family:Anton,Impact,sans-serif; font-weight:400; letter-spacing:.4px; line-height:1.02; text-wrap:balance; margin:0}
.eyebrow{font-family:Anton,sans-serif; letter-spacing:2px; text-transform:uppercase; font-size:.8rem; color:var(--red); margin:0 0 10px}
.eyebrow.amber{color:var(--espresso); background:var(--amber); display:inline-block; padding:4px 12px; border-radius:2px}

/* header */
header.top{position:relative; z-index:2}
.top .wrap{display:flex; align-items:center; justify-content:space-between; padding-top:22px; padding-bottom:22px}
.mark{font-family:Anton,sans-serif; font-size:1.5rem; letter-spacing:1px; color:var(--ink); text-transform:uppercase}
.mark b{color:var(--red)}
.top nav a{color:var(--ink); font-weight:600; font-size:.95rem; margin-left:22px}
.top nav a:hover{color:var(--red)}

/* hero */
.hero{position:relative; z-index:1; padding:52px 0 30px}
.hero h1{font-size:clamp(2.6rem,7vw,5rem); color:var(--ink)}
.hero h1 .r{color:var(--red)}
.hero .sub{font-size:1.3rem; font-weight:600; margin:22px 0 14px; max-width:40ch}
.hero .what{font-size:1.08rem; color:var(--espresso); max-width:52ch; margin:0 0 6px}
.hero .rhythm{font-weight:700; margin-top:14px}
.cta-row{display:flex; gap:16px; align-items:center; flex-wrap:wrap; margin-top:28px}
.btn{display:inline-block; background:var(--red); color:#FBF8F1; font-weight:700; font-family:Inter,sans-serif;
  padding:14px 26px; border-radius:3px; font-size:1.05rem; border:0; cursor:pointer}
.btn:hover{background:var(--red-deep)}
.btn.amber{background:var(--amber); color:var(--espresso)}
.textlink{font-weight:600}

/* bands */
.band{padding:44px 0; position:relative; z-index:1}
.band + .band{border-top:2px solid rgba(143,34,17,.12)}
.band h2{font-size:clamp(1.7rem,3.5vw,2.4rem); color:var(--ink); max-width:24ch}
.band > .wrap > h2{margin:6px 0 26px}

/* cards */
.cards{display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:18px}
.cards.small{grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:14px; margin-top:14px}
.card{display:flex; flex-direction:column; gap:8px; background:var(--card); border:1px solid rgba(43,29,21,.14);
  border-left:4px solid var(--red); border-radius:4px; padding:20px; color:var(--ink); transition:transform .12s, box-shadow .12s}
.card:hover{transform:translateY(-2px); box-shadow:0 10px 24px rgba(43,29,21,.12)}
.card h3{font-size:1.25rem; letter-spacing:.3px; text-wrap:balance}
.card p{margin:0; font-size:1rem; color:var(--espresso)}
.kw{font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace; font-size:.72rem; letter-spacing:1.5px;
  color:var(--red); font-weight:700}
.go{margin-top:auto; font-weight:700; color:var(--red); font-size:.95rem}

/* featured */
.featured .wrap{}
.feature-card{display:block; background:var(--ink); color:var(--card); border-radius:6px; padding:34px; margin-top:12px;
  border-left:6px solid var(--amber)}
.feature-card:hover{background:#191411}
.feature-card .kw.big{font-size:.9rem; color:var(--amber)}
.feature-card h2{color:#FBF8F1; font-size:clamp(1.8rem,4vw,2.7rem); margin:10px 0 12px; max-width:22ch}
.feature-card .lead{font-size:1.15rem; color:#E7DECF; max-width:48ch}
.feature-card .btn{margin-top:18px}
.feature-card.empty .btn{background:var(--amber); color:var(--espresso)}
.feature-note{display:block; margin-top:16px; font-size:.9rem; color:#b9ab99}

/* pillars */
.pillars{display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:26px; margin-top:8px}
.pillar h3{font-size:1.4rem; color:var(--red-deep)}
.pillar .blurb{font-size:1rem; color:var(--espresso); margin:6px 0 10px}
.pillar .soon{font-size:.95rem; color:var(--muted); background:rgba(232,172,19,.14); border-radius:4px; padding:12px 14px; margin:0}

/* how it works */
.how{background:var(--ink); color:var(--card)}
.how .eyebrow{color:var(--amber)}
.how h2{color:#FBF8F1}
.how-grid{display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:24px; margin-top:22px}
.how-grid .b h3{color:var(--amber); font-size:1.3rem; margin-bottom:6px}
.how-grid .b p{margin:0; color:#E7DECF}

/* weekly capture */
.weekly{background:var(--amber)}
.weekly h2{color:var(--espresso); max-width:20ch}
.weekly p{color:var(--espresso); max-width:46ch; font-weight:500}
form.cap{display:flex; gap:10px; flex-wrap:wrap; margin-top:18px; max-width:520px}
form.cap input{flex:1 1 240px; padding:14px 16px; border:2px solid var(--espresso); border-radius:3px; font-size:1rem;
  font-family:Inter,sans-serif; background:#FBF8F1; color:var(--ink)}
form.cap button{background:var(--espresso); color:var(--amber); border:0; padding:14px 24px; border-radius:3px;
  font-weight:700; font-size:1rem; cursor:pointer; font-family:Inter,sans-serif}
.fineprint{font-size:.85rem; color:var(--espresso); margin-top:10px}
.cap-msg{margin-top:12px; font-weight:700; color:var(--espresso)}

/* footer */
footer{background:var(--espresso); color:#d8cdbd; padding:40px 0; position:relative; z-index:1}
footer a{color:var(--amber)}
footer .who{max-width:52ch; margin:0 0 18px}
footer nav a{margin-right:18px; font-weight:600}
footer .fine{margin-top:18px; font-size:.85rem; color:#a99c8a}

@media (max-width:640px){
  body{font-size:17px}
  .top nav{display:none}
  .feature-card{padding:24px}
}
</style>
</head>
<body>
<header class="top">
  <div class="wrap">
    <span class="mark">Stringer<b>Steps</b></span>
    <nav>
      <a href="#topics">Browse</a>
      <a href="#new-this-week">This Week</a>
      <a href="#weekly">Weekly Email</a>
    </nav>
  </div>
</header>

<main>
  <section class="hero">
    <div class="wrap">
      <h1>Free step-by-step guides that actually get you <span class="r">unstuck.</span></h1>
      <p class="sub">Real walkthroughs that show you one click at a time. No fluff, no 40-page PDF, no guessing what to do next.</p>
      <p class="what">This is my growing library of dead-simple guides. Each one takes something that feels hard, using AI, getting found online, running your business smarter, and breaks it into small steps you just follow.</p>
      <p class="what rhythm">New ones drop every week. Pick one and go.</p>
      <div class="cta-row">
        <a class="btn" href="#${flagships.length ? 'start-here' : 'topics'}">Start Here</a>
        <a class="textlink" href="#topics">or browse everything below</a>
      </div>
    </div>
  </section>
${startHereSection}
${featuredSection}
${topicsSection}

  <section class="band how" aria-labelledby="how-h">
    <div class="wrap">
      <p class="eyebrow">How this works</p>
      <h2 id="how-h">Free, simple, and always growing.</h2>
      <div class="how-grid">
        <div class="b"><h3>It's free.</h3><p>Read any guide, all the way through. No wall, no catch.</p></div>
        <div class="b"><h3>It's simple.</h3><p>One step per screen. Check it off, move to the next.</p></div>
        <div class="b"><h3>It grows.</h3><p>I add new ones every week. Come back, or grab the weekly email below.</p></div>
      </div>
    </div>
  </section>

  <section class="band weekly" id="weekly" aria-labelledby="weekly-h">
    <div class="wrap">
      <h2 id="weekly-h">Get a new Stringer Step every week.</h2>
      <p>One short email. The newest guide, plus the one thing to do with it. No fluff.</p>
      <form class="cap" data-kit="REPLACE_WITH_KIT_FORM_ACTION" onsubmit="return ssCap(event)">
        <input type="email" name="email_address" placeholder="you@email.com" aria-label="Your email" required>
        <button type="submit">Sign me up</button>
      </form>
      <p class="fineprint">Free. Unsubscribe anytime, no hard feelings.</p>
      <p class="cap-msg" id="capMsg" hidden></p>
    </div>
  </section>
</main>

<footer>
  <div class="wrap">
    <p class="who">Built by Phil Stringer. I teach entrepreneurs and local businesses how to use AI to save time and get found. More at <a href="https://philstringer.com">philstringer.com</a>.</p>
    <nav>
      <a href="#topics">Browse by Topic</a>
      <a href="#new-this-week">New This Week</a>
      <a href="#weekly">Weekly Email</a>
    </nav>
    <p class="fine">&copy; Stringer Steps &middot; a Phil Stringer / Stratus Global project</p>
  </div>
</footer>

<script>
function ssCap(e){
  e.preventDefault();
  var f=e.target, action=f.getAttribute('data-kit'), msg=document.getElementById('capMsg');
  if(!action || action.indexOf('REPLACE_WITH')===0){
    msg.textContent="You're early. The weekly email opens this week, I'll have signup live in a couple of days.";
    msg.hidden=false; return false;
  }
  f.setAttribute('action',action); f.setAttribute('method','post'); f.submit();
  return true;
}
</script>
</body>
</html>
`;

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
Free step-by-step walkthroughs by Phil Stringer. Public library at ${SITE}. New guides every week.

## Guides
${pub.length ? pub.map((g) => `- ${g.title} — ${g.oneLineOutcome} — ${g.url || (SITE + '/' + g.keyword)}`).join('\n') : '- New guides are being published weekly. Check back or subscribe at ' + SITE + ' .'}
`;
fs.writeFileSync(path.join(ROOT, 'llms.txt'), llms);

console.log('Built index.html, sitemap.xml, llms.txt');
console.log('  public guides: ' + pub.length + '  |  flagships: ' + flagships.length + '  |  featured: ' + (featuredGuide ? featuredGuide.keyword : 'none (empty-state)'));
console.log('  private (kept off hub/sitemap): ' + data.guides.filter((g) => g.visibility === 'private').map((g) => g.keyword).join(', '));
