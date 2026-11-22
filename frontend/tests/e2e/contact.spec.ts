/**
 * Parcours « trouver et contacter » (section 24) : un visiteur ouvre un plat, touche « Commander ce plat »,
 * crée son compte dans la feuille d'inscription, puis WhatsApp s'ouvre avec le message qui cite le plat.
 * `window.open` est remplacé pour lire l'URL sans quitter OKARE.
 */
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { IDS, prepare } from '../helpers';

/** Cookies de session et d'horloge + remplacement de `window.open` pour lire l'URL WhatsApp sans quitter OKARE. */
async function setup(page: Page, context: BrowserContext, baseURL: string, session?: string) {
  await prepare(context, baseURL, session ?? null);
  await page.addInitScript(() => {
    (window as unknown as { __opened: string[] }).__opened = [];
    window.open = ((url: string) => {
      (window as unknown as { __opened: string[] }).__opened.push(url);
      return null;
    }) as typeof window.open;
  });
}

/** Jour de fermeture du point (ex. le dimanche) : l'appli demande « Écrire quand même ? » — on confirme. */
async function confirmIfClosed(page: Page) {
  const anyway = page.getByRole('button', { name: 'Écrire quand même' });
  if (await anyway.waitFor({ state: 'visible', timeout: 5_000 }).then(() => true, () => false)) await anyway.click();
}

const opened = (page: Page) => page.evaluate(() => (window as unknown as { __opened: string[] }).__opened.map(decodeURIComponent));

test('visiteur → plat → inscription → WhatsApp pré-rempli', async ({ page, context, baseURL }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page, context, baseURL!);
  await page.goto('/p/chez-maman-ganhi/dish/riz-sauce-arachide-poisson');
  await page.getByRole('button', { name: /Commander ce plat · 900/ }).click();

  const sheet = page.getByRole('dialog');
  await expect(sheet.getByText('Une dernière étape avant de commander')).toBeVisible();
  await sheet.getByLabel('Numéro de téléphone').fill('01 66 55 44 33');
  await sheet.getByLabel('Mot de passe', { exact: true }).fill('court');
  await sheet.getByRole('button', { name: 'Créer mon compte et commander' }).click();
  await expect(sheet.getByText(/Il manque : 8 caractères au moins, une majuscule/)).toBeVisible();

  await sheet.getByLabel('Mot de passe', { exact: true }).fill('Mafoufou@26');
  await sheet.getByRole('button', { name: 'Créer mon compte et commander' }).click();
  await confirmIfClosed(page);
  await expect.poll(async () => (await opened(page)).length).toBe(1);
  const [url] = await opened(page);
  expect(url).toContain('https://wa.me/2290197000001?text=');
  expect(url).toContain('Je suis intéressé(e) par « Riz sauce arachide + poisson » (900');
});

test('bouton du point de vente : message sans plat', async ({ page, context, baseURL }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await setup(page, context, baseURL!, IDS.client2);
  await page.goto('/p/chez-maman-ganhi');
  await expect(page.getByRole('link', { name: 'Mon compte' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('complementary').getByRole('button', { name: 'Écrire au vendeur' }).click();
  await confirmIfClosed(page);
  await expect.poll(async () => (await opened(page)).length).toBe(1);
  const [url] = await opened(page);
  expect(url).toContain('je vous ai trouvé sur OKARE. Qu');
  expect(url).not.toContain('intéressé');
});

test('page du plat : jamais d’adresse ni de carte', async ({ page, context, baseURL }) => {
  await setup(page, context, baseURL!);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/p/chez-maman-ganhi/dish/riz-sauce-arachide-poisson');
  await expect(page.getByText('Derrière la BOA')).toHaveCount(0);
  await expect(page.locator('.leaflet-container')).toHaveCount(0);
});
