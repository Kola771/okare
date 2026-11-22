// usage: node shot.mjs <path> <width> <session-id|-> <out.png> [localStorageKey=value ...]
import { chromium } from '@playwright/test';
const [,, path, width, session, out, ...kv] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: Number(width), height: Number(width) < 768 ? 844 : 900 } });
await p.addInitScript(([s, kv]) => {
  localStorage.setItem('okare.mock.delay', '0');
  if (s !== '-') localStorage.setItem('okare.session', s);
  for (const e of kv) { const i = e.indexOf('='); localStorage.setItem(e.slice(0, i), e.slice(i + 1)); }
}, [session, kv]);
p.on('pageerror', (e) => console.log('pageerror', e.message.slice(0, 300)));
p.on('console', (m) => { if (m.type() === 'error') console.log('console', m.text().slice(0, 300)); });
await p.goto('http://localhost:3200' + path, { waitUntil: 'networkidle', timeout: 90000 });
await p.waitForTimeout(800);
await p.keyboard.press('Escape');
await p.screenshot({ path: out, fullPage: process.env.FULL === '1' });
await b.close();
