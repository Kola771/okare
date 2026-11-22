import { chromium } from 'playwright';
const out = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
const sheet = () => p.locator('[role="dialog"]');
await p.goto('http://localhost:3200/dashboard/geography'); await p.waitForTimeout(800);
// Pays
await p.getByRole('button', { name: '+ Ajouter un pays' }).click();
await sheet().getByLabel('Code (2 lettres)').fill('TG');
await sheet().getByLabel('Nom').fill('Togo');
await sheet().getByRole('button', { name: 'Ajouter' }).click(); await p.waitForTimeout(1200);
// Ville : on choisit le pays dans la fenêtre
await p.getByRole('button', { name: '+ Ajouter une ville' }).click();
await sheet().getByLabel('Pays').selectOption({ label: 'Togo' });
await sheet().getByLabel('Nom').fill('Lomé');
await p.screenshot({ path: `${out}/flow-city.png` });
await sheet().getByRole('button', { name: 'Ajouter' }).click(); await p.waitForTimeout(1200);
// Zone : pays puis ville
await p.goto('http://localhost:3200/dashboard/zones'); await p.waitForTimeout(800);
await p.getByRole('button', { name: '+ Nouvelle zone' }).click();
await sheet().getByLabel('Pays').selectOption({ label: 'Togo' });
const cities = await sheet().getByLabel('Ville').locator('option').allTextContents();
await sheet().getByLabel('Nom de la zone').fill('Bè');
await p.screenshot({ path: `${out}/flow-zone.png` });
await sheet().getByRole('button', { name: 'Créer la zone' }).click(); await p.waitForTimeout(1200);
// Quartier : pays, ville, zone
await p.goto('http://localhost:3200/dashboard/geography'); await p.waitForTimeout(800);
await p.getByRole('button', { name: '+ Nouveau quartier' }).click();
await sheet().getByLabel('Pays').selectOption({ label: 'Togo' });
const zones = await sheet().getByLabel('Zone').locator('option').allTextContents();
await sheet().getByLabel('Nom').fill('Bè-Kpota');
await p.screenshot({ path: `${out}/flow-nb.png` });
await sheet().getByRole('button', { name: 'Enregistrer' }).click(); await p.waitForTimeout(1200);
await p.getByRole('button', { name: /Togo/ }).click(); await p.waitForTimeout(400);
const txt = await p.locator('main').innerText();
console.log('villes du Togo dans la fenêtre zone :', cities);
console.log('zones de Lomé dans la fenêtre quartier :', zones);
console.log('Bè-Kpota affiché :', txt.includes('Bè-Kpota'), '| Lomé affichée :', txt.includes('Lomé'));
await b.close();
