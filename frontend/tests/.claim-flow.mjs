import { chromium } from 'playwright';

const out = process.argv[2];
const B = 'http://localhost:3200';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
const dialog = () => p.locator('[role="dialog"]');
const lines = async (re) => (await p.locator('body').innerText()).split('\n').filter((l) => re.test(l)).slice(0, 3);

// 1. Filtres sur l'accueil
await p.goto(`${B}/dashboard`); await p.waitForTimeout(800);
await p.locator('section[aria-label="Filtres"] select').nth(2).selectOption({ label: 'Ganhi' }); await p.waitForURL(/zone=/); await p.waitForTimeout(800);
await p.screenshot({ path: `${out}/home-filter.png` });
console.log('accueil filtré :', await lines(/Tableau de bord ·|Bonjour/));

// 2. Agent : code pour Jean Akplogan (sans compte)
await p.goto(`${B}/dashboard/vendors`); await p.waitForTimeout(600);
await p.getByRole('row', { name: /Jean Akplogan/ }).getByRole('link', { name: 'Ouvrir' }).click(); await p.waitForTimeout(800);
await p.getByRole('button', { name: 'Envoyer un code de rattachement' }).click(); await p.waitForTimeout(500);
const code = (await dialog().locator('.font-mono').innerText()).trim();
await p.screenshot({ path: `${out}/claim-code.png` });
console.log('code généré :', code);

// 3. Le vendeur saisit le code
await p.goto(`${B}/account/claim`); await p.waitForTimeout(600);
await p.getByLabel('Code à 6 chiffres').fill(code);
await p.getByRole('button', { name: 'Relier ma fiche' }).click(); await p.waitForTimeout(1000);
await p.screenshot({ path: `${out}/claim-after.png` });
console.log('après code :', await lines(/fait|Code|code/));

// 4. Admin : accepter la demande de Gérard
await p.goto(`${B}/dashboard/claims`); await p.waitForTimeout(800);
await p.screenshot({ path: `${out}/claims-admin.png`, fullPage: true });
await p.getByRole('row', { name: /Gérard/ }).getByRole('button', { name: 'Accepter' }).click(); await p.waitForTimeout(800);
await p.goto(`${B}/dashboard/vendors`); await p.waitForTimeout(600);
console.log('Gérard :', (await p.getByRole('row', { name: /Gérard/ }).innerText()).replace(/\s+/g, ' '));
console.log('Jean :', (await p.getByRole('row', { name: /Jean Akplogan/ }).innerText()).replace(/\s+/g, ' '));
await b.close();
