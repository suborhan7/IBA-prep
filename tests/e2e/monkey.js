// Phone "monkey" walkthrough: on every page, tap visible controls like a curious student,
// and flag taps that change nothing, page errors, stuck loading and sideways overflow.
const { chromium, devices } = require('playwright');
const B = 'http://localhost:3100';
const DEV = process.argv[2] || 'Pixel 7';
const ROUTES = (process.argv[3] || '/,/plan,/daily,/daily?set=english,/daily?set=quant,/english,/vocab,/quant,/speed,/analytical,/analytical?tab=puzzles,/mock,/mistakes,/tutor,/resources,/analytics,/settings').split(',');
const STEPS = Number(process.argv[4] || 40);
const SKIP = /^(Reset|Import and replace|Import and merge|Stop syncing|Export all progress|Remove custom format|IBA Prep)$/i;
let seed = 7; const rnd = (n) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices[DEV] });
  const page = await ctx.newPage();
  const issues = [];
  page.on('pageerror', e => issues.push(`PAGEERROR ${page.url()} ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource.*(404|503)/.test(m.text())) issues.push(`CONSOLE ${page.url()} ${m.text().slice(0, 200)}`); });
  page.on('dialog', d => d.accept());
  const snap = () => page.evaluate(() => { const m = document.querySelector('main') || document.body; return m.innerText + '|' + [...m.querySelectorAll('input,textarea,select')].map(i => i.value).join(',') + '|' + document.querySelectorAll('[aria-checked=true],[aria-pressed=true],.border-accent').length + location.href; });
  let taps = 0, noEffect = {};
  for (const r of ROUTES) {
    await page.goto(B + r);
    await page.waitForTimeout(900);
    for (let s = 0; s < STEPS; s++) {
      if (!page.url().startsWith(B)) { await page.goto(B + r); await page.waitForTimeout(700); }
      // fill empty inputs a student might type into
      for (const inp of await page.locator('main input[type=text]:visible, main input:not([type]):visible, main textarea:visible').all()) {
        if (!(await inp.inputValue().catch(() => 'x')) && rnd(3) === 0) await inp.fill(['12', 'lucrative', 'how do I do percentages?', '0.5'][rnd(4)]).catch(() => {});
      }
      const cands = await page.locator('main button:visible:enabled, main a[href^="/"]:visible, main [role=radio]:visible').all();
      if (!cands.length) break;
      const el = cands[rnd(cands.length)];
      const label = ((await el.innerText().catch(() => '')) || (await el.getAttribute('aria-label').catch(() => '')) || '').trim().replace(/\s+/g, ' ').slice(0, 40);
      if (SKIP.test(label)) continue;
      const active = await el.evaluate(e => e.getAttribute('aria-pressed') === 'true' || /bg-accent-soft|bg-surface font-medium|bg-accent text-accent-ink|border-accent bg-accent/.test(e.className || '')).catch(() => false);
      const before = await snap().catch(() => '');
      const t0 = Date.now();
      try { await el.tap({ timeout: 2500 }); } catch { continue; }
      taps++;
      await page.waitForTimeout(450);
      const after = await snap().catch(() => 'nav');
      if (before === after && label && !active) {
        await page.waitForTimeout(1200);
        if ((await snap().catch(() => 'nav')) === before) { const k = `${new URL(page.url()).pathname} "${label}"`; noEffect[k] = (noEffect[k] || 0) + 1; }
      }
      // stuck loading?
      const loading = await page.getByText(/Choosing questions|Loading/).count();
      if (loading) { await page.waitForTimeout(4000); if (await page.getByText(/Choosing questions|Loading/).count()) issues.push(`STUCK-LOADING ${page.url()} after "${label}"`); }
      const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (ov > 4) issues.push(`OVERFLOW ${ov}px ${page.url()} after "${label}"`);
    }
  }
  console.log(`[${DEV}] taps: ${taps}`);
  console.log('Taps with no visible effect:'); for (const [k, v] of Object.entries(noEffect)) console.log('  ', v, k);
  console.log('Issues:'); [...new Set(issues)].forEach(i => console.log('  ', i));
  await browser.close();
})();
