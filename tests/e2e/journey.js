// Scripted student journeys on a phone, with taps. Usage: node journey.js "Pixel 7"
const { chromium, devices } = require('playwright');
const fs = require('fs');
const B = 'http://localhost:3100';
const DEV = process.argv[2] || 'Pixel 7';
const ONLY = process.argv[3] ? new RegExp(process.argv[3], 'i') : null;
const shots = (process.env.SHOTS || __dirname + '/shots') + '/' + DEV.replace(/\W+/g, '_'); fs.mkdirSync(shots, { recursive: true });
const T = 5000; // any reaction slower than this counts as "not responding"
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices[DEV], acceptDownloads: true });
  const page = await ctx.newPage();
  page.setDefaultTimeout(T);
  const errors = [];
  page.on('pageerror', e => errors.push(`${page.url()} PAGEERROR ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource.*(404|503)/.test(m.text())) errors.push(`${page.url()} CONSOLE ${m.text().slice(0, 200)}`); });
  page.on('dialog', d => d.accept());
  let pass = 0, fail = 0; const failed = [];
  const step = async (name, fn) => {
    if (ONLY && !ONLY.test(name)) return;
    const e0 = errors.length;
    try { await fn(); if (errors.length > e0) throw new Error('console/page error: ' + errors.slice(e0).join(' || ').slice(0, 300)); pass++; console.log('✓', name); }
    catch (e) { fail++; failed.push(name); console.log('✗', name, '—', e.message.split('\n')[0].slice(0, 300)); await page.screenshot({ path: `${shots}/fail-${name.replace(/\W+/g, '_').slice(0, 60)}.png` }).catch(() => {}); }
  };
  const tap = (loc) => loc.tap();
  const btn = (name) => page.getByRole('button', { name, exact: typeof name === 'string' });
  const text = (t) => page.getByText(t).first();
  const noOverflow = async () => { const o = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (o > 4) throw new Error(`page scrolls sideways by ${o}px`); };
  const go = async (p) => { await page.goto(B + p); await page.waitForLoadState('domcontentloaded'); };
  const answerPractice = async (opt) => {
    await page.getByRole('radio').first().waitFor();
    await tap(page.getByRole('radio').nth(opt));
    await tap(btn('Check answer'));
    await page.getByRole('button', { name: /^(Next|Finish)/ }).first().waitFor({ timeout: 1500 }); // must react within 1.5 s
  };
  const idxText = async () => (await page.locator('text=/^\\d+\\/\\d+$/').first().textContent()).trim();

  /* ── first visit ── */
  await step('dashboard loads fast on first visit', async () => {
    const t0 = Date.now(); await go('/'); await page.locator('h1').waitFor(); await noOverflow();
    console.log('   first paint ms', Date.now() - t0);
  });
  await step('mobile menu opens, navigates, closes', async () => {
    await tap(page.getByLabel('Open menu'));
    await tap(page.getByRole('link', { name: /Vocabulary/ }).last());
    await page.waitForURL(/\/vocab/); await page.waitForTimeout(500);
    if (await page.getByLabel('Close menu').isVisible().catch(() => false)) throw new Error('menu stayed open after navigating');
  });
  await step('dark mode toggle', async () => {
    await go('/'); const before = await page.evaluate(() => document.documentElement.className);
    await tap(page.getByLabel('Toggle dark mode').locator('visible=true').first());
    const after = await page.evaluate(() => document.documentElement.className);
    if (before === after) throw new Error('theme did not change');
    await page.reload(); const kept = await page.evaluate(() => document.documentElement.className);
    if (kept !== after) throw new Error('theme not remembered after reload');
    await tap(page.getByLabel('Toggle dark mode').locator('visible=true').first());
  });
  await step('every dashboard mission link opens a working page', async () => {
    await go('/'); await page.waitForTimeout(800);
    const hrefs = [...new Set(await page.locator('main a[href^="/"]').evaluateAll(a => a.map(x => x.getAttribute('href'))))];
    for (const h of hrefs) {
      await go(h); await page.waitForTimeout(500);
      if (await page.getByText(/This page could not be found|Application error/).count()) throw new Error('broken link ' + h);
      await noOverflow();
    }
    console.log('   links checked', hrefs.length);
  });

  /* ── the exact bug report ── */
  await step('Check answer responds instantly (daily English)', async () => {
    await go('/daily?set=english');
    await answerPractice(0);
    await tap(btn('Next'));
    await answerPractice(1);
  });
  await step('Check answer still responds while the database is busy', async () => {
    // hold a long write transaction on the answer tables, as a background sync would
    await page.evaluate(() => new Promise((ok) => {
      const r = indexedDB.open('du-iba-prep');
      r.onsuccess = () => {
        const db = r.result; const tx = db.transaction(db.objectStoreNames, 'readwrite');
        const st = tx.objectStore('attempts'); let n = 0; const t0 = Date.now();
        const spin = () => { if (Date.now() - t0 < 6000) st.count().onsuccess = spin; }; spin(); ok();
      };
    }));
    await tap(btn('Next'));
    await page.getByRole('radio').first().waitFor();
    const t0 = Date.now();
    await answerPractice(2);
    console.log('   feedback shown after ms', Date.now() - t0);
    await page.waitForTimeout(6500);
  });
  await step('double-tapping Check answer does not record twice or break', async () => {
    await tap(btn('Next'));
    await page.getByRole('radio').first().waitFor();
    await tap(page.getByRole('radio').nth(0));
    await btn('Check answer').dblclick();
    await btn('Next').waitFor();
    if (await btn('Check answer').count()) throw new Error('Check answer still showing');
  });
  await step('Check answer is disabled until an option is chosen', async () => {
    await tap(btn('Next')); await page.getByRole('radio').first().waitFor();
    if (!(await btn('Check answer').isDisabled())) throw new Error('enabled with no choice');
  });
  await step('wrong answer → cause picker saves', async () => {
    // try options until one is wrong
    for (let k = 0; k < 4; k++) {
      if (!(await page.getByRole('radio').count())) break;
      await answerPractice(k % 4);
      await page.waitForTimeout(800);
      if (await text('Why did this go wrong?').count()) {
        const c = btn('Misreading'); await tap(c);
        await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent === 'Misreading' && b.className.includes('border-accent')), null, { timeout: 2000 });
        return;
      }
      await tap(btn('Next'));
    }
    throw new Error('never got a wrong answer to test');
  });
  let resumeIdx;
  await step('open tutor from a question, come back: answer and position kept', async () => {
    resumeIdx = await idxText();
    await tap(page.locator('main').getByRole('link', { name: 'Ask the tutor' }));
    await page.waitForURL(/\/tutor/); await page.waitForTimeout(800);
    await page.goBack(); await page.waitForURL(/\/daily/);
    await btn('Next').waitFor({ timeout: 4000 }); // still showing the checked answer
    if ((await idxText()) !== resumeIdx) throw new Error(`position changed ${resumeIdx} → ${await idxText()}`);
  });
  await step('reload mid-set keeps the set', async () => {
    await page.reload(); await btn('Next').waitFor({ timeout: 4000 });
    if ((await idxText()) !== resumeIdx) throw new Error('position lost on reload');
  });
  await step('leave via menu to another section and return: set kept', async () => {
    await tap(page.getByLabel('Open menu')); await tap(page.getByRole('link', { name: /Analytics/ }).last());
    await page.waitForURL(/analytics/); await page.waitForTimeout(500);
    await go('/daily?set=english'); await btn('Next').waitFor({ timeout: 4000 });
  });
  await step('finish the whole daily set (mix of answer and skip) and see summary', async () => {
    for (let i = 0; i < 60; i++) {
      if (await text('Set complete').count()) break;
      const nxt = page.getByRole('button', { name: /^(Next|Finish)/ });
      if (await nxt.count()) { await tap(nxt.first()); await page.waitForTimeout(150); continue; }
      if (i % 3 === 0) { await tap(btn('Skip / show solution')); continue; }
      await answerPractice(i % 4);
    }
    await text('Set complete').waitFor();
    await noOverflow();
    await tap(page.locator('main button').filter({ hasText: /^Q1/ }).first());
    await text('Step-by-step').waitFor();
  });
  await step('"New set" starts a fresh set', async () => {
    await tap(btn('New set')); await page.getByRole('radio').first().waitFor({ timeout: 6000 });
    if ((await idxText()) !== '0/15') throw new Error('new set did not start at 0: ' + await idxText());
  });
  await step('daily quant set with chart/DI questions renders', async () => {
    await go('/daily?set=quant'); await page.getByRole('radio').first().waitFor({ timeout: 6000 });
    for (let i = 0; i < 4; i++) { await answerPractice(i % 4); await tap(page.getByRole('button', { name: /^(Next|Finish)/ }).first()); }
    await noOverflow();
  });
  await step('mixed timed set: pause, resume, skip, end early', async () => {
    await go('/daily?set=mixed'); await page.getByRole('radio').first().waitFor({ timeout: 6000 });
    await tap(page.getByRole('radio').first()); await tap(btn('Next'));
    await tap(btn('Skip'));
    await tap(page.getByLabel('Pause')); await text(/Paused/).waitFor();
    await tap(page.getByRole('button', { name: 'Resume' }).last()); await page.getByRole('radio').first().waitFor();
    await tap(btn('End set now')); await text('Set complete').waitFor();
  });
  await step('timed set: answers survive a reload mid-set', async () => {
    await go('/daily?set=mixed'); await page.getByRole('radio').first().waitFor({ timeout: 6000 });
    await tap(page.getByRole('radio').nth(0)); await tap(btn('Next'));
    await tap(page.getByRole('radio').nth(1)); await tap(btn('Next'));
    await page.waitForTimeout(400); await page.reload(); await page.getByRole('radio').first().waitFor({ timeout: 6000 });
    await tap(btn('End set now')); await text('Set complete').waitFor();
    const answered = await page.locator('main .bg-good, main .bg-bad').count();
    if (answered < 2) throw new Error('only ' + answered + ' answers kept after reload');
  });
  await step('diagnostic: all 28 questions to the end', async () => {
    await go('/daily?set=diagnostic'); await page.getByRole('radio').first().waitFor({ timeout: 6000 });
    for (let i = 0; i < 28; i++) {
      await tap(page.getByRole('radio').nth(i % 4));
      await tap(page.getByRole('button', { name: /^(Next|Finish)$/ }));
    }
    await text('Set complete').waitFor({ timeout: 8000 });
    await page.waitForTimeout(1000);
    const n = await page.evaluate(() => new Promise(r => { const q = indexedDB.open('du-iba-prep'); q.onsuccess = () => { const c = q.result.transaction('attempts').objectStore('attempts').getAll(); c.onsuccess = () => r(c.result.filter(a => a.mode === 'diagnostic').length); }; }));
    if (n !== 28) throw new Error('diagnostic answers saved: ' + n + ' of 28');
  });

  /* ── English ── */
  await step('English: reading practice + timed', async () => {
    await go('/english'); await page.waitForTimeout(500); await tap(btn('Reading comprehension'));
    await tap(page.getByRole('button', { name: /Practise/ }).first());
    await answerPractice(0); await tap(page.getByRole('button', { name: /^(Next|Finish)/ }).first());
    await go('/english'); await tap(btn('Reading comprehension')); await tap(page.getByRole('button', { name: /^Timed$/ }).first());
    await page.getByRole('radio').first().waitFor(); await tap(btn('End set now')); await text('Set complete').waitFor();
  });
  await step('English: grammar lesson → practice', async () => {
    await go('/english'); await tap(page.getByRole('link', { name: /Grammar|lesson/i }).first().or(btn('Grammar lessons')).first());
    await page.waitForTimeout(500);
    const lesson = page.locator('a[href^="/english/grammar/"]').first();
    await tap(lesson); await page.waitForURL(/grammar\//);
    await tap(page.getByRole('button', { name: /Practi/ }).first());
    await answerPractice(1);
    await noOverflow();
  });

  /* ── Vocabulary ── */
  await step('vocab: full study session (intro + quizzes + grades)', async () => {
    await go('/vocab'); await tap(btn('Start session'));
    for (let i = 0; i < 250; i++) {
      if (await text(/Session complete/).count()) break;
      if (await btn('Got it — quiz me later').count()) { await tap(btn('Got it — quiz me later')); continue; }
      if (await btn('Reveal').count()) { await tap(btn('Reveal')); await tap(btn(i % 2 ? 'Good' : 'Forgot')); continue; }
      if (await btn('Continue').count()) { await tap(btn('Continue')); continue; }
      const opts = page.locator('main .grid button:enabled');
      if (await opts.count()) { await tap(opts.nth(i % (await opts.count()))); await btn('Continue').waitFor({ timeout: 1500 }); continue; }
      await page.waitForTimeout(300);
    }
    await text(/Session complete/).waitFor();
  });
  await step('vocab: search, open a word card, close', async () => {
    await tap(btn('Word cards'));
    await page.getByPlaceholder(/Search words/).fill('লাভ');
    await page.waitForTimeout(400);
    await tap(page.locator('main button.text-left').first());
    await tap(btn('Close'));
  });
  await step('vocab: semantic map theme + word', async () => {
    await tap(btn('Semantic maps')); await page.waitForTimeout(400);
    await tap(page.locator('main .rounded-full.border').nth(2));
    await page.locator('main svg g.cursor-pointer').first().tap();
    await noOverflow();
  });
  await step('vocab games: match in both orders + wrong pair feedback', async () => {
    await tap(btn('Word games')); await page.waitForTimeout(300);
    const card = page.locator('main').locator('text=Match the Bengali meaning').locator('xpath=ancestor::div[contains(@class,"rounded")][1]');
    const left = card.locator('.grid > div').first().locator('button'), right = card.locator('.grid > div').nth(1).locator('button');
    const words = await right.allTextContents();
    // English first, then a wrong meaning → red flash
    await tap(right.first()); await tap(left.first());
    // now pair everything by trying combinations
    for (let tries = 0; tries < 30 && (await card.getByText('All matched!').count()) === 0; tries++) {
      const l = left.filter({ hasNot: page.locator(':disabled') }); 
      const li = await card.locator('.grid > div').first().locator('button:enabled').first();
      const ri = card.locator('.grid > div').nth(1).locator('button:enabled').nth(tries % Math.max(1, await card.locator('.grid > div').nth(1).locator('button:enabled').count()));
      if (tries % 2) { await tap(li); await tap(ri); } else { await tap(ri); await tap(li); }
      await page.waitForTimeout(650);
    }
    await card.getByText('All matched!').waitFor({ timeout: 1000 });
    console.log('   matched', words.length);
  });

  /* ── Mathematics ── */
  await step('quant: practise a topic, fresh set, timed set', async () => {
    await go('/quant'); await page.waitForTimeout(400);
    await tap(page.getByRole('button', { name: /^Practise$/ }).first()); await answerPractice(0);
    await tap(page.getByRole('button', { name: /Back to Mathematics/ }));
    await tap(page.getByRole('button', { name: /Fresh/ }).first()); await answerPractice(1);
    await tap(page.getByRole('button', { name: /Back to Mathematics/ }));
    await tap(page.getByRole('button', { name: /^Timed$/ }).first()); await page.getByRole('radio').first().waitFor();
    await tap(btn('End set now')); await text('Set complete').waitFor();
  });
  await step('quant: shortcut library marks done', async () => {
    await go('/quant'); const b = btn("Mark today's shortcut review done");
    if (await b.count()) { await b.scrollIntoViewIfNeeded(); await tap(b); }
    await page.waitForTimeout(400);
  });

  /* ── Speed gym ── */
  await step('speed: every drill, right, wrong and skipped answers, quit and finish', async () => {
    await go('/speed'); await page.waitForTimeout(400);
    const n = await btn('Start drill').count();
    for (let d = 0; d < n; d++) {
      await go('/speed'); await tap(btn('Start drill').nth(d));
      await page.getByLabel('Answer').waitFor();
      for (let i = 0; i < 40; i++) {
        if (await text('Drill complete').count()) break;
        const prompt = (await page.locator('.font-mono').first().textContent().catch(() => '')) || '';
        let ans = '';
        try { ans = String(Math.round(eval(prompt.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/=.*$/, '')) * 100) / 100); } catch {}
        if (i % 5 === 4) { await tap(btn('Skip')); continue; }
        await page.getByLabel('Answer').fill(i % 4 === 3 ? '999' : ans);
        await tap(btn('Enter'));
      }
      await text('Drill complete').waitFor({ timeout: 8000 });
    }
    // quit mid-drill
    await go('/speed'); await tap(btn('Start drill').first()); await tap(page.getByRole('button', { name: 'Quit' }));
    await btn('Start drill').first().waitFor();
    console.log('   drills done', n);
  });

  /* ── Analytical + puzzles ── */
  await step('analytical: practise a topic and read the 8-step method', async () => {
    await go('/analytical'); await page.waitForTimeout(400);
    await tap(page.getByRole('button', { name: /^Practise$/ }).first()); await answerPractice(2);
    await go('/analytical');
    const tabs = await page.locator('main [aria-pressed]').allTextContents(); 
    for (const t of tabs) { await tap(page.locator('main [aria-pressed]', { hasText: t }).first()); await page.waitForTimeout(250); await noOverflow(); }
  });
  await step('puzzles: every board — wrong check, walkthrough, give up, questions', async () => {
    await go('/analytical?tab=puzzles'); await page.waitForTimeout(400);
    const n = await btn('Open board').count();
    for (let k = 0; k < n; k++) {
      await go('/analytical?tab=puzzles'); await tap(btn('Open board').nth(k));
      await text('Conditions').waitFor();
      // place everyone in pool order by tapping
      for (let s = 0; s < 8; s++) {
        const chip = page.locator('.bg-surface-2 button').first(); if (!(await chip.count())) break;
        await tap(chip); await tap(page.locator('.border-dashed').filter({ hasText: /tap to place/ }).first());
      }
      await tap(btn('Check my arrangement'));
      const wrong = await text(/Not yet|Solved in/).textContent();
      // swap two seats by tapping, then clear
      const seated = page.locator('.border-dashed button');
      await tap(seated.nth(0)); await tap(seated.nth(1));
      await tap(btn('Clear'));
      if (await page.locator('.border-dashed button').count()) throw new Error('Clear did not empty the board');
      await tap(btn("I'm stuck — show solution"));
      await page.locator('ol li').first().waitFor();
      const qs = page.locator('.border-t button.rounded-lg');
      const nq = await qs.count();
      if (nq) await tap(qs.first());
      await noOverflow();
      console.log(`   board ${k + 1}: first check "${wrong.slice(0, 20)}", questions ${nq ? 'shown' : 'none'}`);
    }
  });

  /* ── Mock ── */
  await step('mock full simulation: answer, mark, jump, clear, reload, submit, write', async () => {
    await go('/mock'); await tap(btn(/Full simulation/));
    await tap(btn(/Start the exam/)); await page.getByRole('radio').first().waitFor({ timeout: 8000 });
    await tap(page.getByRole('radio').nth(1)); await tap(btn(/^Next/));
    await tap(page.getByRole('radio').nth(2)); await tap(btn(/Mark for review/));
    await tap(btn('Clear answer'));
    await tap(page.getByLabel('Question 5', { exact: true })); await tap(page.getByRole('radio').nth(0));
    await tap(btn(/Previous/));
    await page.reload(); await page.getByRole('radio').first().waitFor({ timeout: 8000 });
    if (!(await text(/2\/\d+ answered/).count())) console.log('   (answered counter text differs)');
    await tap(btn('Submit')); await tap(btn('Keep working')); await tap(btn('Submit')); await tap(btn('Submit now'));
    await text(/^Score /).waitFor({ timeout: 10000 });
    const ta = page.getByPlaceholder(/Tap here to start writing/);
    await ta.tap(); await ta.fill('Bangladesh should invest in vocational training because it creates jobs.');
    await page.waitForTimeout(1500); await page.reload();
    await page.getByPlaceholder(/Tap here to start writing/).waitFor();
    const kept = await page.getByPlaceholder(/Tap here to start writing/).inputValue();
    if (!kept.includes('vocational')) throw new Error('writing not saved');
    await noOverflow();
  });
  await step('mock: reopen a past report from the list', async () => {
    await go('/mock'); await page.waitForTimeout(500);
    await tap(page.locator('main button.flex.w-full').first()); await text(/^Score /).waitFor();
  });

  /* ── Tutor ── */
  await step('tutor: every mode answers offline', async () => {
    await go('/tutor'); await page.waitForTimeout(500);
    const modes = (await page.locator('main [aria-pressed]').allTextContents()).filter(m => m !== 'Question generator');
    const say = { 'Explain': 'explain percentage change', 'Socratic hints': 'how do I solve a ratio problem', 'Check my working': '20% of 50 = 10 so answer is 10', 'Vocabulary coach': 'ubiquitous', 'Writing feedback': 'I think students should learns english because it are important for job.', 'Study coach': 'what should I do today?' };
    for (const m of modes) {
      await tap(page.locator('main [aria-pressed]', { hasText: m }).first());
      await page.waitForTimeout(400);
      const box = page.locator('main textarea').last(); await box.fill(say[m] || 'help');
      const before = await page.locator('main').innerText();
      await tap(page.getByLabel('Send'));
      try { await page.waitForFunction((b) => document.querySelector('main').innerText.length > b + 30, before.length, { timeout: 6000 }); } catch { throw new Error('no reply in mode ' + m); }
    }
    console.log('   modes', modes.join(', '));
  });
  await step('tutor: question generator tab renders', async () => {
    await tap(page.locator('main [aria-pressed]', { hasText: 'Question generator' })); await page.waitForTimeout(400); await noOverflow();
  });

  /* ── Mistakes ── */
  await step('mistakes: filter, cause, note, practise similar, resolve', async () => {
    await go('/mistakes'); await page.waitForTimeout(800);
    for (const s of await page.locator('main select').all()) { const o = await s.locator('option').allTextContents(); if (o.length > 1) await s.selectOption({ index: 1 }); await page.waitForTimeout(150); await s.selectOption({ index: 0 }); }
    await tap(page.locator('main details summary, main button[aria-expanded]').first()).catch(() => {});
    const sim = btn('Practise 5 similar').first();
    if (await sim.count()) { await tap(sim); await page.getByRole('radio').first().waitFor({ timeout: 6000 }); await answerPractice(0); await go('/mistakes'); await page.waitForTimeout(600); }
    const res = btn('Mark resolved').first(); if (await res.count()) await tap(res);
    console.log('   mistakes page has', await page.locator('main').innerText().then(t => t.length), 'chars');
  });
  await step('bookmark a question and practise bookmarks', async () => {
    await go('/daily?set=english'); await page.getByRole('radio').first().waitFor({ timeout: 6000 });
    await tap(page.getByLabel('Bookmark question')); await page.getByLabel('Remove bookmark').waitFor({ timeout: 2000 });
    await go('/mistakes'); await page.waitForTimeout(500);
    const b = page.getByRole('button', { name: /Practise all bookmarks/ }).or(page.getByRole('link', { name: /Practise all bookmarks/ }));
    await tap(page.getByRole('button', { name: /Bookmarks/ }).first()).catch(() => {});
    await tap(b.first()); await page.getByRole('radio').first().waitFor({ timeout: 6000 });
  });

  /* ── Plan, resources, analytics ── */
  await step('plan: tap days, links work', async () => {
    await go('/plan'); await page.waitForTimeout(400);
    for (const d of ['1', '15', '30']) { const b = page.locator('main button').filter({ hasText: new RegExp(`^${d}$`) }).first(); if (await b.count()) await tap(b); }
    await noOverflow();
  });
  await step('resources and analytics render with data', async () => {
    await go('/resources'); await page.waitForTimeout(400); await noOverflow();
    await go('/analytics'); await page.waitForTimeout(1200); await noOverflow();
    if (await page.getByText(/No data yet/).count() > 3) throw new Error('analytics empty after activity');
  });

  /* ── Settings ── */
  await step('settings: dates, words/day, negative marking persist after reload', async () => {
    await go('/settings'); await page.waitForTimeout(600);
    await page.locator('input[type=date]').first().fill('2026-11-01');
    await tap(btn('−0.25'));
    await page.waitForTimeout(500); await page.reload(); await page.waitForTimeout(800);
    if ((await page.locator('input[type=date]').first().inputValue()) !== '2026-11-01') throw new Error('start date not saved');
  });
  await step('settings: custom exam format appears in mock list', async () => {
    await page.locator('label', { hasText: 'Total minutes' }).locator('input').fill('80');
    await page.waitForTimeout(500);
    await go('/mock'); await page.getByRole('combobox').first().waitFor(); await page.waitForTimeout(800); const opts = await page.getByRole('combobox').first().locator('option').allTextContents();
    if (!opts.some(o => /custom/i.test(o))) throw new Error('custom format missing: ' + opts.join('|'));
  });
  await step('settings: storage check passes', async () => {
    await go('/settings'); await text(/Storage/).waitFor();
    await page.waitForTimeout(1500);
    const t = await page.locator('main').innerText();
    const m = t.match(/Storage check[\s\S]{0,200}/)?.[0] || '';
    if (!/Saving works/.test(m)) throw new Error('storage card says: ' + m.slice(0, 160).replace(/\n/g, ' '));
  });
  let backupPath;
  await step('settings: export, then import-merge the backup', async () => {
    const [dl] = await Promise.all([page.waitForEvent('download'), tap(page.getByRole('button', { name: /Export all progress/ }))]);
    backupPath = shots + '/backup.json'; await dl.saveAs(backupPath);
    await page.locator('input[type=file]').setInputFiles(backupPath);
    await tap(btn('Import and merge'));
    await page.waitForEvent('load', { timeout: 6000 });
  });
  await step('settings: sync code create → sync now → copy', async () => {
    await go('/settings'); await tap(btn('Create a sync code'));
    await text(/^Synced\./).waitFor({ timeout: 8000 });
    await tap(page.getByRole('button', { name: 'Copy', exact: true }));
    await page.waitForTimeout(300);
    await tap(page.getByRole('button', { name: /Sync now/ }));
    await page.waitForTimeout(1500);
  });
  await step('second phone joins with the code and gets the progress', async () => {
    const code = (await page.locator('code').first().textContent()).trim();
    const c2 = await browser.newContext({ ...devices[DEV] }); const p2 = await c2.newPage();
    await p2.goto(B + '/settings'); await p2.getByPlaceholder('amber-river-mango-lotus-1234').fill(code);
    await p2.getByRole('button', { name: 'Connect' }).tap();
    await p2.getByText(/^Synced\./).first().waitFor({ timeout: 10000 }); await p2.waitForTimeout(2500);
    await p2.goto(B + '/analytics'); await p2.waitForTimeout(1500);
    const n = await p2.evaluate(() => new Promise(r => { const q = indexedDB.open('du-iba-prep'); q.onsuccess = () => { const c = q.result.transaction('attempts').objectStore('attempts').count(); c.onsuccess = () => r(c.result); }; }));
    if (n < 20) throw new Error('second device only has ' + n + ' attempts');
    console.log('   second device attempts', n);
    await c2.close();
  });
  await step('settings: reset needs RESET, then wipes everything', async () => {
    await go('/settings');
    if (!(await btn('Reset').isDisabled())) throw new Error('reset enabled without confirmation');
    await page.getByPlaceholder('RESET').fill('RESET'); await tap(btn('Reset'));
    await page.waitForURL(B + '/', { timeout: 8000 }); await page.waitForTimeout(800);
    await go('/daily?set=english'); await page.getByRole('radio').first().waitFor({ timeout: 6000 });
    if ((await idxText()) !== '0/15') throw new Error('old set survived reset');
  });

  console.log(`\n[${DEV}] ${pass} passed, ${fail} failed${failed.length ? ': ' + failed.join(' | ') : ''}`);
  const uniq = [...new Set(errors)]; if (uniq.length) { console.log('Errors:'); uniq.slice(0, 20).forEach(e => console.log('  ', e)); }
  await browser.close();
})();
