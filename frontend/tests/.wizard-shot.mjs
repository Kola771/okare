import { chromium } from 'playwright';
const out = process.argv[2];
const b = await chromium.launch();
for (const w of [1280, 390]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto('http://localhost:3200/seller/points/new'); await p.waitForTimeout(900);
  await p.getByLabel('Nom affiché du point de vente').fill('Chez Tantie Ablavi');
  await p.getByLabel('Nom du responsable').fill('Ablavi');
  await p.getByLabel('Téléphone du responsable').fill('0197112233');
  await p.getByLabel('WhatsApp des commandes').fill('0197112233');
  await p.screenshot({ path: `${out}/wiz1-${w}.png` });
  await p.getByRole('button', { name: /Continuer/ }).first().click(); await p.waitForTimeout(900);
  await p.screenshot({ path: `${out}/wiz2-${w}.png`, fullPage: true });
  await p.getByRole('button', { name: /Continuer/ }).first().click(); await p.waitForTimeout(800);
  await p.screenshot({ path: `${out}/wiz3-${w}.png`, fullPage: true });
  await p.getByRole('button', { name: /Continuer/ }).first().click(); await p.waitForTimeout(800);
  await p.screenshot({ path: `${out}/wiz4-${w}.png`, fullPage: true });
  await p.close();
}
await b.close();
