/**
 * Miniature de l'exemple de rapport (accueil) : la page 2 de la fixture
 * 04_marges_2cm_word, dessinée par le vrai pipeline du vérificateur (Worker,
 * pdf.js, OffscreenCanvas), puis enregistrée dans public/exemple/page-2.png.
 * Construit et sert le site sur un port libre, avec le Chromium de Playwright.
 *
 *     node outils/miniature-exemple.mjs
 */
import { chromium } from '@playwright/test';
import { execSync, spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const racine = fileURLToPath(new URL('..', import.meta.url));
const PORT = 4331;
const PAGE = 2;

execSync('npx astro build', { cwd: racine, stdio: 'ignore' });
const serveur = spawn('npx', ['astro', 'preview', '--port', String(PORT), '--ignore-lock'], { cwd: racine, stdio: 'ignore' });
try {
  const navigateur = await chromium.launch();
  const page = await navigateur.newPage();
  for (let essai = 0; essai < 40; essai++) {
    try {
      await page.goto(`http://localhost:${PORT}/verifier/`);
      break;
    } catch {
      await new Promise((attente) => setTimeout(attente, 250));
    }
  }
  await page.waitForFunction(() => !document.querySelector('#champ-concours')?.hasAttribute('disabled'));
  await page.locator('#champ-concours').selectOption('capes-interne');
  await page.locator('#champ-discipline').selectOption('histoire-geographie');
  await page.getByTestId('champ-fichier').setInputFiles(`${racine}tests/fixtures/04_marges_2cm_word.pdf`);
  await page.getByRole('button', { name: 'Lire mon dossier' }).click();
  await page.getByRole('heading', { name: 'Vérifiez le découpage' }).waitFor({ timeout: 30_000 });
  // L'aperçu de chaque page porte son numéro : « Page 2 ».
  const image = page.locator('.v-miniature', { hasText: `Page ${PAGE}` }).first().locator('img');
  const octets = await image.evaluate(async (img) => {
    const reponse = await fetch(img.src);
    return [...new Uint8Array(await reponse.arrayBuffer())];
  });
  mkdirSync(`${racine}public/exemple`, { recursive: true });
  writeFileSync(`${racine}public/exemple/page-${PAGE}.png`, Uint8Array.from(octets));
  console.log(`public/exemple/page-${PAGE}.png (${octets.length} octets)`);
  await navigateur.close();
} finally {
  serveur.kill();
}
