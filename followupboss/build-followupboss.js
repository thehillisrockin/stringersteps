#!/usr/bin/env node
/*
 * Build stringersteps.com/followupboss from the locked yellow-kit aiagent
 * scaffold. Clones the scaffold (keeps embedded fonts, brand, and every
 * mechanic), strips the lead gate (this guide is UNGATED + public), and swaps
 * in the Follow Up Boss content. Run: node build-followupboss.js
 */
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const SCAFFOLD = path.join(ROOT, '..', 'aiagent', 'index.html');

let s = fs.readFileSync(SCAFFOLD, 'utf8');

const connectB64 = fs.readFileSync(path.join(ROOT, 'assets', 'connect-screen-web.png')).toString('base64');
const CONNECT = 'data:image/png;base64,' + connectB64;

const NEWSCREENS = `
      <!-- WELCOME -->
      <section class="screen active" data-next="Let's go &rarr;" data-noback>
        <div class="eyebrow">Follow Up Boss + Claude &middot; Step-by-Step</div>
        <h1 class="big">Run Follow Up Boss from Claude</h1>
        <p class="lead">Connect your Follow Up Boss to Claude one time. Then you can run your whole CRM just by typing in plain English.</p>
        <p class="sub">Takes about ten minutes. Nothing to install. Your progress saves, so you can stop and pick it back&nbsp;up.</p>
        <div class="note">Dead simple, paint by numbers. You've got&nbsp;this.</div>
      </section>

      <!-- STEP 1 -->
      <section class="screen" data-next="Continue &rarr;">
        <div class="bignum">(1)</div>
        <div class="eyebrow">Step 1 of 5</div>
        <h1>Get your Follow Up Boss key</h1>
        <p class="lead">A key is like a password that lets Claude into your Follow Up Boss. You make one in a few&nbsp;clicks.</p>
        <a class="dl" href="https://app.followupboss.com" target="_blank" rel="noopener"><span class="emoji">&#128273;</span> Open Follow Up Boss <span class="tag">log in on a computer</span><span class="go">Open &rarr;</span></a>
        <div class="cue"><span class="cn">1</span><div class="cc"><div class="cap">Click your initials or photo in the <b>top right</b>, then click <b>Admin</b>.</div></div></div>
        <div class="cue"><span class="cn">2</span><div class="cc"><div class="cap">Click <b>API</b> in the menu, then click the blue <b>Create API Key</b> button.</div></div></div>
        <div class="cue"><span class="cn">3</span><div class="cc"><div class="cap">Name it <b>Claude</b>, click <b>Create API Key</b>, then <b>copy</b> the key it shows you.</div></div></div>
        <div class="note warn">Treat this key like a password. Never text it, email it, or post it anywhere. Anyone who has it can get into your&nbsp;CRM.</div>
        <label class="confirm"><input type="checkbox" class="cfm"><span class="cb"><svg viewBox="0 0 18 18"><path d="M3.5 9.5l3.3 3.3 7.7-8"/></svg></span><span class="ctxt">I copied my key</span></label>
      </section>

      <!-- STEP 2 -->
      <section class="screen" data-next="Continue &rarr;">
        <div class="bignum">(2)</div>
        <div class="eyebrow">Step 2 of 5</div>
        <h1>Open Claude's connectors</h1>
        <p class="lead">A connector is how Claude plugs into an outside tool. We're going to add one for Follow Up&nbsp;Boss.</p>
        <a class="dl" href="https://claude.ai/settings/connectors" target="_blank" rel="noopener"><span class="emoji">&#128279;</span> Open Claude connectors <span class="tag">claude.ai settings</span><span class="go">Open &rarr;</span></a>
        <div class="cue"><span class="cn">1</span><div class="cc"><div class="cap">In Claude, click your <b>initials</b> in the bottom left, then <b>Settings</b>, then <b>Connectors</b>.</div></div></div>
        <div class="note">Custom connectors need a paid Claude plan (Pro or higher). On the free plan? Take this as your&nbsp;sign.</div>
        <label class="confirm"><input type="checkbox" class="cfm"><span class="cb"><svg viewBox="0 0 18 18"><path d="M3.5 9.5l3.3 3.3 7.7-8"/></svg></span><span class="ctxt">I'm on the Connectors page</span></label>
      </section>

      <!-- STEP 3 -->
      <section class="screen" data-next="Continue &rarr;">
        <div class="bignum">(3)</div>
        <div class="eyebrow">Step 3 of 5</div>
        <h1>Add the connector</h1>
        <p class="lead">Click <b>Add custom connector</b>, then paste in the link&nbsp;below.</p>
        <div class="cue"><span class="cn">1</span><div class="cc"><div class="cap">Click <b>Add</b>, then <b>Add custom connector</b>:</div>
          <div class="menx"><div class="menx-top"><span class="mb">&#128269;</span><span class="mb on">Add &#9662;</span></div><div class="menx-list"><div class="mxi"><span class="mxic">&#9776;</span>Browse connectors</div><div class="mxi hl"><span class="mxic">&#8943;</span>Add custom connector</div></div></div>
        </div></div>
        <div class="cue"><span class="cn">2</span><div class="cc"><div class="cap">Name it <b>Follow Up Boss</b>. For the URL, paste this&nbsp;exactly:</div>
          <div class="prompt-box"><button class="copy">Copy</button><pre>https://fub-connect.vercel.app/api/mcp</pre></div>
        </div></div>
        <div class="cue"><span class="cn">3</span><div class="cc"><div class="cap">Click <b>Add</b>. Claude opens a connect screen next.</div></div></div>
        <div class="note">Use a different AI tool that takes custom connectors? Paste the same link there. It works the same&nbsp;way.</div>
        <label class="confirm"><input type="checkbox" class="cfm"><span class="cb"><svg viewBox="0 0 18 18"><path d="M3.5 9.5l3.3 3.3 7.7-8"/></svg></span><span class="ctxt">I added the connector</span></label>
      </section>

      <!-- STEP 4 -->
      <section class="screen" data-next="Continue &rarr;">
        <div class="bignum">(4)</div>
        <div class="eyebrow">Step 4 of 5</div>
        <h1>Paste your key</h1>
        <p class="lead">Claude opens this screen. Paste the key you copied in Step 1, then click <b>Connect</b>.</p>
        <img class="shot" src="__CONNECT_IMG__" alt="The Connect Follow Up Boss to Claude screen, with a box to paste your API key and a yellow Connect button">
        <div class="note">That's it. Claude sends you back, and your Follow Up Boss is&nbsp;connected.</div>
        <label class="confirm"><input type="checkbox" class="cfm"><span class="cb"><svg viewBox="0 0 18 18"><path d="M3.5 9.5l3.3 3.3 7.7-8"/></svg></span><span class="ctxt">I'm connected</span></label>
      </section>

      <!-- STEP 5 -->
      <section class="screen" data-next="See what you did &rarr;">
        <div class="bignum">(5)</div>
        <div class="eyebrow">Step 5 of 5</div>
        <h1>Try it out</h1>
        <p class="lead">Start a new chat in Claude and type this to make sure it&nbsp;worked:</p>
        <div class="prompt-box"><button class="copy">Copy</button><pre>Check my Follow Up Boss connection. Who am I logged in as?</pre></div>
        <p class="sub">Claude should answer with your name and account. Now try real&nbsp;work:</p>
        <div class="prompt-box"><button class="copy">Copy</button><pre>Find everyone in my Follow Up Boss tagged Hot that nobody has contacted in the last two weeks. List their names and phone numbers.</pre></div>
        <div class="note">Add a note, create a lead, build a task, log a call, start an action plan. Just ask in plain&nbsp;English.</div>
        <label class="confirm"><input type="checkbox" class="cfm"><span class="cb"><svg viewBox="0 0 18 18"><path d="M3.5 9.5l3.3 3.3 7.7-8"/></svg></span><span class="ctxt">It works</span></label>
      </section>

      <!-- FINISH -->
      <section class="screen" data-final data-noback>
        <div class="done-ic">&#10003;</div>
        <h1 class="big" style="text-align:center">Your CRM is wired into&nbsp;Claude</h1>
        <p class="lead" style="text-align:center">You can now run your whole Follow Up Boss just by talking to&nbsp;Claude.</p>
        <div class="recap" id="recap">
          <div><span class="c">&#10003;</span> Made your Follow Up Boss key</div>
          <div><span class="c">&#10003;</span> Opened Claude's connectors</div>
          <div><span class="c">&#10003;</span> Added the Follow Up Boss connector</div>
          <div><span class="c">&#10003;</span> Pasted your key and connected</div>
          <div><span class="c">&#10003;</span> Ran your first CRM command</div>
        </div>
        <div class="cta">
          <div class="ce">Free tool</div>
          <h3>Now find out who's about to&nbsp;buy</h3>
          <p>Your database is full of people closer to buying than you think. BuyerPrediction reads your CRM and shows you the ones most likely to move next, so you know exactly who to call. Try it&nbsp;free.</p>
          <a class="ctabtn" href="https://predictingbuyers.com" target="_blank" rel="noopener">See BuyerPrediction &rarr;</a>
        </div>
      </section>
`;

// --- transforms ---
// 1. strip the lead-gate DOM and unlock the stage (ungated guide)
s = s.replace(/<!-- ===== LEAD GATE ===== -->[\s\S]*?<div class="stage locked" id="stage">/, '<div class="stage" id="stage">');
// 2. strip the lead-gate controller script
s = s.replace(/<!-- ===== LEAD GATE CONTROLLER ===== -->[\s\S]*?<\/script>\n/, '');
// 3. swap the screens
const START = '<div class="body" id="screens">';
const END = '<div class="nav" id="nav">';
const a = s.indexOf(START), b = s.indexOf(END, a);
s = s.slice(0, a) + START + '\n' + NEWSCREENS + '\n    </div>\n    ' + s.slice(b);
// 4. empty the unused onboarding prompt block
s = s.replace(/(<script type="text\/plain" id="onboardingPrompt">)[\s\S]*?(<\/script>)/, '$1$2');
// 5. AEO + slug + title
s = s.split('https://stringersteps.com/aiagent').join('https://stringersteps.com/followupboss');
s = s.split('Set Up Your First AI Agent').join('Connect Follow Up Boss to Claude');
s = s.split('A free, dead-simple walkthrough that gets your first AI agent running, one step at a time. No code and no jargon, just click and go.')
     .join('A free, dead-simple walkthrough to connect your Follow Up Boss CRM to Claude, one step at a time. No code and no jargon, just click and go.');
// 6. storage key + top-bar labels
s = s.split('ss-aiagent').join('ss-followupboss');
s = s.replace('<div class="cardlabel">AI Agents</div>', '<div class="cardlabel">Follow Up Boss</div>');
s = s.replace(`plabel.textContent="Let's set up your agent"`, `plabel.textContent="Let's connect your CRM"`);
// 7. embed the real connect screenshot
s = s.replace('__CONNECT_IMG__', CONNECT);
// 7b. rotate the background photo (rule: never reuse the last guide's photo)
const bgB64 = fs.readFileSync(path.join(ROOT, 'assets', 'bg.jpg')).toString('base64');
s = s.replace(/data:image\/jpeg;base64,[A-Za-z0-9+\/=]+/, 'data:image/jpeg;base64,' + bgB64);
// 8. scrub inherited em-dashes (two CSS comments + a print-only video caption)
s = s.replace('a video — watch it in the online guide', 'a video. Watch it in the online guide');
s = s.split('—').join('-');

fs.writeFileSync(path.join(ROOT, 'index.html'), s);
console.log('wrote followupboss/index.html  (' + (s.length / 1024).toFixed(0) + ' KB)');
// sanity checks
const checks = {
  'no gate DOM': !s.includes('id="gate"'),
  'no gate script': !s.includes('stratus-lead-gate'),
  'stage unlocked': s.includes('<div class="stage" id="stage">'),
  'connector url present': s.includes('fub-connect.vercel.app/api/mcp'),
  'buyerprediction cta': s.includes('predictingbuyers.com'),
  'key renamed': s.includes("ss-followupboss-v1") && !s.includes('ss-aiagent'),
  'connect img embedded': s.includes('data:image/png;base64,'),
  'no em dash': !/—/.test(s),
  'slug set': s.includes('stringersteps.com/followupboss') && !s.includes('stringersteps.com/aiagent'),
};
for (const [k, v] of Object.entries(checks)) console.log((v ? 'OK  ' : 'FAIL ') + k);
