import { chromium } from 'playwright';
const out = process.argv[2];
const mq = 'file:///C:/laragon/www/okare/OKARE_dossier_dev/design/maquette/';
const pairs = [
  ['zones', 'DBZones.html', '/dashboard/zones'],
  ['fiche', 'DBFiche.html', '/dashboard/points/__POS__'],
  ['users', 'DBUsers.html', '/dashboard/users'],
  ['roles', 'DBRoles.html', '/dashboard/roles'],
  ['vendors', 'DBVendeurs.html', '/dashboard/vendors'],
  ['settings', 'DBParametres.html', '/dashboard/settings'],
  ['geo', 'DBZones.html', '/dashboard/geography'],
];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p.goto('http://localhost:3200/dashboard/points'); await p.waitForTimeout(800);
const href = await p.locator('a[href^="/dashboard/points/"]:not([href$="new"])').first().getAttribute('href');
for (const [k, f, u] of pairs) {
  await p.goto(mq + f); await p.waitForTimeout(600);
  await p.screenshot({ path: `${out}/${k}-mq.png`, fullPage: true });
  await p.goto('http://localhost:3200' + u.replace('/dashboard/points/__POS__', href)); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${out}/${k}-app.png`, fullPage: true });
}
console.log(href);
await b.close();
