/**
 * Pages de contenu et référencement (SPEC §9) : titres, descriptions, adresses
 * canoniques, balises de partage, typographie, 404, sitemap, robots.txt.
 */
import { expect, test } from '@playwright/test';
import { inscriptionActive, PAGES_DU_SITE, SITE } from '../../src/content/site.ts';
import { erreursTypographiques } from '../helpers/typographie.ts';
import { allerAuRapport, attendreSansDefilementHorizontal, cheminFixture } from './outils.ts';

const PAGES = Object.values(PAGES_DU_SITE);
const INDEPENDANCE = 'Outil indépendant, non affilié au ministère de l’Éducation nationale.';

for (const infos of PAGES) {
  test(`${infos.chemin} : titre, description, adresse canonique, partage, typographie`, async ({ page }) => {
    await page.goto(infos.chemin);
    const titre = await page.title();
    expect(titre).toBe(infos.chemin === '/' ? infos.titre : `${infos.titre} – ${SITE.nom}`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', infos.description);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE.url}${infos.chemin}`);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `${SITE.url}${infos.chemin}`);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', titre);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', `${SITE.url}/og-image.png`);
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', 'Au propre — Vérifiez votre dossier RAEP avant le dépôt');
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/site.webmanifest');
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#FBFAF7');
    await expect(page.locator('link[rel="icon"][href="/favicon.ico"]')).toHaveAttribute('sizes', '48x48');
    // Logo horizontal clair, au moins 120 px de large (IDENTITE.md).
    const logo = page.getByRole('banner').getByRole('link', { name: 'Au propre' }).locator('img');
    await expect(logo).toHaveAttribute('src', '/brand/logo-clair.svg');
    expect((await logo.boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(120);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('contentinfo').getByText(INDEPENDANCE)).toBeVisible();
    await attendreSansDefilementHorizontal(page);
    expect(erreursTypographiques(await page.locator('body').innerText())).toEqual([]);
  });
}

test('les titres de page sont tous différents', async ({ page }) => {
  const titres = new Set<string>();
  for (const infos of PAGES) {
    await page.goto(infos.chemin);
    titres.add(await page.title());
  }
  expect(titres.size).toBe(PAGES.length);
});

test('accueil : le bouton « Vérifier mon dossier » mène au vérificateur', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vérifiez votre dossier\u00A0RAEP avant de le\u00A0déposer');
  await page.getByRole('main').getByRole('link', { name: 'Vérifier mon dossier' }).first().click();
  await expect(page).toHaveURL(/\/verifier\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vérifier mon dossier RAEP');
});

test('navigation : page courante signalée, pied de page complet', async ({ page }) => {
  await page.goto('/regles/');
  const navigation = page.getByRole('navigation', { name: 'Navigation principale' });
  await expect(navigation.getByRole('link', { name: 'Les règles' })).toHaveAttribute('aria-current', 'page');
  const pied = page.getByRole('contentinfo');
  for (const nom of ['Les règles officielles du RAEP', 'Confidentialité', 'Mentions légales']) {
    await expect(pied.getByRole('link', { name: nom })).toBeVisible();
  }
});

test('lien d’évitement : premier élément atteint au clavier, il mène au contenu', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Parcours clavier testé sur ordinateur');
  await page.goto('/regles/');
  await page.keyboard.press('Tab');
  const evitement = page.getByRole('link', { name: 'Aller au contenu' });
  await expect(evitement).toBeFocused();
  await expect(evitement).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#contenu$/);
});

test('règles : chaque règle a son ancre, ses sources, et l’accueil y renvoie', async ({ page }) => {
  await page.goto('/regles/');
  for (let i = 1; i <= 19; i++) {
    const regle = page.locator(`#R${String(i).padStart(2, '0')}`);
    await expect(regle).toBeVisible();
    await expect(regle.locator('a.p-source').first()).toHaveAttribute('href', /^https:\/\//);
  }
  await expect(page.locator('#R04')).toContainText('Pour le CPE, le jury ne prend pas en considération les annexes');
});

test('page inexistante : 404 soignée, non indexée', async ({ page }) => {
  const reponse = await page.goto('/page-inexistante/');
  expect(reponse?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cette page n’existe pas');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  for (const nom of ['Vérifier mon dossier', 'Lire les règles officielles', 'Revenir à l’accueil']) {
    await expect(page.getByRole('main').getByRole('link', { name: nom })).toBeVisible();
  }
  await expect(page.getByRole('contentinfo').getByText(INDEPENDANCE)).toBeVisible();
});

test('sitemap.xml et robots.txt', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  const adresses = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(adresses).toEqual(PAGES.map((infos) => `${SITE.url}${infos.chemin}`));
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain(`Sitemap: ${SITE.url}/sitemap.xml`);
});

test('favicons, manifeste, image de partage et logo servis', async ({ request }) => {
  for (const fichier of [
    '/favicon.ico',
    '/favicon.svg',
    '/apple-touch-icon.png',
    '/site.webmanifest',
    '/og-image.png',
    '/brand/logo-clair.svg',
  ]) {
    expect((await request.get(fichier)).status(), fichier).toBe(200);
  }
});

test('mentions légales : hébergeur, indépendance, champs à compléter signalés', async ({ page }) => {
  await page.goto('/mentions-legales/');
  await expect(page.getByRole('main')).toContainText('Cloudflare, Inc.');
  await expect(page.getByRole('main')).toContainText('101 Townsend St., San Francisco');
  await expect(page.getByRole('main')).toContainText(INDEPENDANCE.replace('Outil indépendant', 'Au propre est un outil indépendant'));
});

test('encart d’inscription : absent sans adresse de formulaire, sinon lien direct sans paramètre', async ({ page }) => {
  await allerAuRapport(page, { fichier: cheminFixture('01_conforme_word.pdf') });
  const titre = page.getByRole('heading', { name: 'Être prévenu quand la relecture critique sera disponible' });
  if (!inscriptionActive()) {
    await expect(titre).toHaveCount(0);
    await page.goto('/confidentialite/');
    await expect(page.locator('#inscription')).toHaveCount(0);
    return;
  }
  await expect(titre).toBeVisible();
  const lien = page.getByRole('link', { name: /M’inscrire par e-mail/ });
  await expect(lien).toHaveAttribute('href', SITE.inscription.formulaireUrl);
  await expect(lien).toHaveAttribute('target', '_blank');
  await expect(lien).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(page.getByText('Votre e-mail n’est jamais lié à votre dossier.')).toBeVisible();
});

test('bouton principal : variante de survol et anneau de focus visible', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Survol et clavier testés sur ordinateur');
  await page.goto('/');
  const bouton = page.getByRole('main').getByRole('link', { name: 'Vérifier mon dossier' }).first();
  const fond = () => bouton.evaluate((element) => getComputedStyle(element).backgroundColor);
  // Bleu encre #1E4A9A, puis #183B7B au survol (transition désactivée pour la mesure).
  await bouton.evaluate((element) => (element.style.transition = 'none'));
  expect(await fond()).toBe('rgb(30, 74, 154)');
  await bouton.hover();
  expect(await fond()).toBe('rgb(24, 59, 123)');
  await page.mouse.move(0, 0);
  await bouton.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(bouton).toBeFocused();
  await expect(bouton).toHaveCSS('box-shadow', /rgb\(30, 74, 154\)/);
});

test.describe('ordinateur en mode sombre : le site reste en thème clair (V1)', () => {
  test.use({ colorScheme: 'dark' });

  for (const infos of [...PAGES, { chemin: '/page-inexistante/' }]) {
    test(`${infos.chemin} : fond clair, logo clair, contrôles natifs clairs`, async ({ page }) => {
      await page.goto(infos.chemin);
      await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(251, 250, 247)');
      await expect(page.locator('html')).toHaveCSS('color-scheme', /^(light only|only light)$/);
      await expect(page.getByRole('banner').locator('img')).toHaveAttribute('src', '/brand/logo-clair.svg');
    });
  }

  test('rapport : fond papier et cartes blanches', async ({ page }) => {
    await allerAuRapport(page, { fichier: cheminFixture('01_conforme_word.pdf') });
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(251, 250, 247)');
    await expect(page.locator('.v-controles').first()).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  });
});
