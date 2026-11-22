/**
 * Mesure des performances en mode production (spec 0ter.1, 0ter.10) : LCP, JavaScript transféré et navigation.
 * Réseau simulé (CDP) : « 4G » = 150 ms de latence, 1,6 Mb/s ; « 3G » = 300 ms, 0,7 Mb/s ; processeur ralenti ×4.
 * Prérequis : `npm run build:prod` puis `npm run start:prod` (port 3200). Lancer : `node tests/perf/measure.mjs`.
 * Sortie : tableau Markdown à recopier dans PERF.md.
 */
import { chromium } from '@playwright/test';

const BASE = process.env.BASE ?? 'http://localhost:3200';
const NOON = `${new Date(Date.now() + 3_600_000).toISOString().slice(0, 10)}T12:00:00+01:00`;
const IDS = { client: '0193a200-0000-7000-8000-000000000014', vendor: '0193a200-0000-7000-8000-00000000000a', admin: '0193a200-0000-7000-8000-000000000001' };
const POS = '0193a400-0000-7000-8000-000000000001';
const PAGES = [
  ['/', null], ['/p/chez-maman-ganhi', null], ['/p/chez-maman-ganhi/dish/riz-sauce-arachide-poisson', null], ['/map', null],
  ['/search?q=riz', null], ['/login', null], ['/favorites', IDS.client], ['/account', IDS.client],
  ['/seller', IDS.vendor], ['/seller/points', IDS.vendor], [`/seller/points/${POS}/menu`, IDS.vendor], [`/seller/points/${POS}/hours`, IDS.vendor],
  ['/dashboard', IDS.admin], ['/dashboard/points', IDS.admin],
];
const NETWORKS = { '4G': { latency: 150, down: 1.6e6 / 8, up: 750e3 / 8 }, '3G': { latency: 300, down: 700e3 / 8, up: 700e3 / 8 } };

async function measure(browser, path, session, net) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const cookies = [{ name: 'okare_mock_now', value: encodeURIComponent(NOON), url: BASE }];
  if (session) cookies.push({ name: 'okare_session', value: session, url: BASE });
  await context.addCookies(cookies);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: net.latency, downloadThroughput: net.down, uploadThroughput: net.up });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  let js = 0;
  cdp.on('Network.loadingFinished', (e) => { if (jsIds.has(e.requestId)) js += e.encodedDataLength; });
  const jsIds = new Set();
  cdp.on('Network.responseReceived', (e) => { if (e.type === 'Script') jsIds.add(e.requestId); });
  await page.addInitScript(() => {
    window.__lcp = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
  });
  await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 120_000 });
  await page.waitForTimeout(500);
  const lcp = await page.evaluate(() => window.__lcp);
  await context.close();
  return { lcp: Math.round(lcp), js: Math.round(js / 1024) };
}

/** Navigation entre pages (lien interne, application déjà chargée) : temps jusqu'à l'affichage du nouveau titre. */
async function navigation(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addCookies([{ name: 'okare_mock_now', value: encodeURIComponent(NOON), url: BASE }, { name: 'okare_session', value: IDS.vendor, url: BASE }]);
  const page = await context.newPage();
  await page.goto(`${BASE}/seller`, { waitUntil: 'networkidle' });
  const out = [];
  for (const [label, href] of [['Accueil → Mes points de vente', '/seller/points'], ['Mes points → Gestion', `/seller/points/${POS}`], ['Gestion → Menu', `/seller/points/${POS}/menu`]]) {
    const t0 = Date.now();
    await page.locator(`a[href="${href}"]:visible`).first().click();
    await page.waitForURL(`**${href}`);
    await page.waitForLoadState('networkidle');
    out.push([label, Date.now() - t0]);
  }
  await context.close();
  return out;
}

const browser = await chromium.launch();
console.log('| Page | JS transféré (Ko) | LCP 4G (ms) | LCP 3G (ms) |\n|---|---|---|---|');
for (const [path, session] of PAGES) {
  const a = await measure(browser, path, session, NETWORKS['4G']);
  const b = await measure(browser, path, session, NETWORKS['3G']);
  console.log(`| ${path.replace(POS, '[id]')} | ${a.js} | ${a.lcp} | ${b.lcp} |`);
}
console.log('\n| Navigation (desktop, sans ralentissement) | ms |\n|---|---|');
for (const [label, ms] of await navigation(browser)) console.log(`| ${label} | ${ms} |`);
await browser.close();
