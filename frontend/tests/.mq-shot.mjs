import { chromium } from 'playwright';
const [, , file, out, w = '1280'] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: Number(w), height: 900 } });
await p.goto(`file:///C:/laragon/www/okare/OKARE_dossier_dev/design/maquette/${file}`); await p.waitForTimeout(700);
await p.screenshot({ path: out, fullPage: true });
await b.close();
