/**
 * Captures des écrans client (bloc 1) aux 5 largeurs obligatoires, dans tests/visual/__captures__/.
 * Horloge fixée à 12h (heure de Porto-Novo) pour des résultats stables.
 * Vérifie aussi l'absence de défilement horizontal.
 */
import { expect, test } from '@playwright/test';
import { IDS, prepare } from '../helpers';

const WIDTHS = [360, 390, 768, 1024, 1440];

const SCREENS: { name: string; path: string; logged?: boolean }[] = [
  { name: '01-home', path: '/' },
  { name: '02-pos', path: '/p/chez-maman-ganhi' },
  { name: '22-dish', path: '/p/chez-maman-ganhi/dish/riz-sauce-arachide-poisson' },
  { name: '11-map', path: '/map' },
  { name: '12-login', path: '/login' },
  { name: '13-account', path: '/account', logged: true },
  { name: '14-claim', path: '/account/claim', logged: true },
  { name: '14-favorites', path: '/favorites', logged: true },
  { name: 'search', path: '/search?q=riz' },
];

for (const screen of SCREENS) {
  for (const width of WIDTHS) {
    test(`${screen.name} @${width}`, async ({ page, context, baseURL }) => {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
      await prepare(context, baseURL!, screen.logged ? IDS.client : null);
      await page.goto(screen.path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(600);
      // Le suivi « t'a-t-il répondu ? » peut s'ouvrir pour la cliente connectée : on le ferme pour la capture.
      await page.keyboard.press('Escape');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, 'pas de défilement horizontal').toBeLessThanOrEqual(0);
      await page.screenshot({ path: `tests/visual/__captures__/${screen.name}-${width}.png`, fullPage: false });
    });
  }
}
