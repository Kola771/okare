import { chromium } from '@playwright/test';
const [,, path, session] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 360, height: 800 } });
await p.addInitScript((s) => { localStorage.setItem('okare.mock.delay', '0'); localStorage.setItem('okare.session', s); }, session);
await p.goto('http://localhost:3200' + path, { waitUntil: 'networkidle' });
await p.waitForTimeout(500);
console.log(await p.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1)
  .slice(0, 6).map((e) => `${e.tagName}.${String(e.className).slice(0, 80)} r=${Math.round(e.getBoundingClientRect().right)} | ${(e.textContent || '').slice(0, 40)}`).join('\n')));
await b.close();
