import { chromium } from 'playwright';
const out = process.argv[2];
const b = await chromium.launch();
for (const [w, h] of [[1280, 800], [390, 700]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto('http://localhost:3200/dashboard/geography'); await p.waitForTimeout(800);
  await p.getByRole('button', { name: '+ Nouveau quartier' }).click(); await p.waitForTimeout(400);
  await p.locator('[role="dialog"] select').first().focus();
  await p.screenshot({ path: `${out}/sheet-${w}.png` });
  await p.close();
}
await b.close();
