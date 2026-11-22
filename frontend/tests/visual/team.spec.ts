/**
 * Captures des écrans vendeur (bloc 2) et dashboard (bloc 3) aux 5 largeurs, avec contrôle du défilement horizontal.
 * Sortie : tests/visual/__captures__/{seller|dashboard}-*.png
 */
import { expect, test } from '@playwright/test';
import { prepare } from '../helpers';

const WIDTHS = [360, 390, 768, 1024, 1440];
const VENDOR = '0193a200-0000-7000-8000-00000000000a';
const SUPER = '0193a200-0000-7000-8000-000000000001';
const POS = '0193a400-0000-7000-8000-000000000001';

const SCREENS: { name: string; path: string; as: string }[] = [
  { name: 'seller-15-home', path: '/seller', as: VENDOR },
  { name: 'seller-15b-points', path: '/seller/points', as: VENDOR },
  { name: 'seller-15c-manage', path: `/seller/points/${POS}`, as: VENDOR },
  { name: 'seller-info', path: `/seller/points/${POS}/info`, as: VENDOR },
  { name: 'seller-7-menu', path: `/seller/points/${POS}/menu`, as: VENDOR },
  { name: 'seller-8-dish', path: `/seller/points/${POS}/menu/new`, as: VENDOR },
  { name: 'seller-19-hours', path: `/seller/points/${POS}/hours`, as: VENDOR },
  { name: 'seller-18-qr', path: `/seller/points/${POS}/qr`, as: VENDOR },
  { name: 'seller-4-stats', path: `/seller/points/${POS}/stats`, as: VENDOR },
  { name: 'seller-reviews', path: `/seller/points/${POS}/reviews`, as: VENDOR },
  { name: 'seller-17-new', path: '/seller/points/new', as: VENDOR },
  { name: 'seller-16-profile', path: '/seller/profile', as: VENDOR },
  { name: 'dashboard-db1', path: '/dashboard', as: SUPER },
  { name: 'dashboard-db2', path: '/dashboard/points', as: SUPER },
  { name: 'dashboard-db3', path: `/dashboard/points/${POS}`, as: SUPER },
  { name: 'dashboard-db5', path: '/dashboard/zones', as: SUPER },
  { name: 'dashboard-geography', path: '/dashboard/geography', as: SUPER },
  { name: 'dashboard-db6', path: '/dashboard/users', as: SUPER },
  { name: 'dashboard-db7', path: '/dashboard/roles', as: SUPER },
  { name: 'dashboard-claims', path: '/dashboard/claims', as: SUPER },
  { name: 'dashboard-db8', path: '/dashboard/vendors', as: SUPER },
  { name: 'dashboard-db9', path: '/dashboard/reports', as: SUPER },
  { name: 'dashboard-db12', path: '/dashboard/settings', as: SUPER },
];

for (const s of SCREENS) {
  for (const width of WIDTHS) {
    test(`${s.name} @${width}`, async ({ page, context, baseURL }) => {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
      await prepare(context, baseURL!, s.as);
      await page.goto(s.path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, 'pas de défilement horizontal').toBeLessThanOrEqual(0);
      await page.screenshot({ path: `tests/visual/__captures__/${s.name}-${width}.png` });
    });
  }
}
