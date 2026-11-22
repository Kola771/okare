import { defineConfig } from '@playwright/test';

/**
 * Tests sur le build de production (spec 0ter.1 : on mesure en production, pas en dev).
 * Lancer d'abord `npm run build:prod`, puis `npm run test:visual` / `npm run test:e2e`.
 * Captures (0bis.6) : chaque écran à 360, 390, 768, 1024 et 1440 px.
 */
const PORT = Number(process.env.PORT ?? 3200);

export default defineConfig({
  testDir: './tests',
  outputDir: './tests/.results',
  fullyParallel: false,
  workers: 2,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}`, locale: 'fr-FR', timezoneId: 'Africa/Porto-Novo' },
  webServer: {
    command: `npx cross-env NEXT_DIST_DIR=${process.env.NEXT_DIST_DIR ?? ".next-prod"} MOCK_DELAY_MS=0 next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
