import { defineConfig, devices } from '@playwright/test';
import { SITE } from './src/content/site.ts';

/**
 * Vérifications sur le site en ligne (https://au-propre.fr), après chaque
 * déploiement : `npm run test:prod`, en local ou dans la CI (job « production »).
 * Aucun serveur local : les tests interrogent le vrai domaine, derrière Cloudflare.
 * Mêmes réglages que playwright.config.ts (Playwright 1.52, PW_DISABLE_TS_ESM).
 */
export default defineConfig({
  testDir: 'tests/production',
  testMatch: '*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  // Une reprise : le réseau entre la machine de test et Cloudflare peut flancher.
  retries: 1,
  reporter: [['list']],
  timeout: 60_000,
  use: {
    baseURL: SITE.url,
    locale: 'fr-FR',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
});
