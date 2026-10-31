import { defineConfig, devices } from '@playwright/test';

/**
 * Tests de bout en bout sur le site réellement livré (build statique servi
 * par astro preview), Worker compris.
 *
 * Playwright est épinglé en 1.52 : c'est la dernière version dont les
 * navigateurs fonctionnent sous macOS 12. Son chargeur TypeScript se bloque
 * sous Node 24 : le script npm le désactive (PW_DISABLE_TS_ESM=1) et Node lit
 * lui-même les fichiers .ts, d'où les extensions .ts dans les imports des tests.
 */
// Port propre aux tests : `npm run dev` occupe 4321 (port par défaut d'Astro), et
// Playwright réutiliserait ce serveur de développement, barre d'outils d'Astro comprise.
const PORT = 4329;

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: 0,
  reporter: [['list']],
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'fr-FR',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // Pas de WebKit : sous macOS 12, Playwright 1.52 n'a qu'un ancien WebKit
    // qui refuse son protocole (« Unknown setting »). Safari se teste à la main
    // en attendant une machine plus récente.
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    // --ignore-lock : quand Astro détecte un agent (assistant de code), il lance
    // sinon le serveur en arrière-plan et rend la main, ce que Playwright prend
    // pour un échec. Cette option le garde au premier plan.
    command: `npx astro build && npx astro preview --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}/verifier/`,
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
});
