/**
 * Pages de contenu et référencement (SPEC §9) : titres, descriptions, adresses
 * canoniques, balises de partage, typographie, 404, sitemap, robots.txt.
 */
import { expect, test } from '@playwright/test';
import { estIndexee, inscriptionActive, PAGES_DU_SITE, SITE, statistiquesActives, texteRobots } from '../../src/content/site.ts';
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
    if (estIndexee(infos)) {
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE.url}${infos.chemin}`);
      await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    } else {
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    }
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
    await expect(page.locator('h1')).toHaveCount(1);
    // Aucun champ « à compléter » ne reste sur le site mis en ligne.
    await expect(page.locator('.p-a-completer')).toHaveCount(0);
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
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vérifiez votre dossier\u00A0RAEP en une\u00A0minute');
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
  expect(adresses).toEqual(PAGES.filter(estIndexee).map((infos) => `${SITE.url}${infos.chemin}`));
  expect(sitemap).not.toContain(PAGES_DU_SITE.mentionsLegales.chemin);
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toBe(texteRobots());
  // Les mentions légales ne sont pas bloquées : un robot doit pouvoir y lire le noindex.
  expect(robots).not.toContain('Disallow');
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

test('mentions légales : éditeur anonyme (LCEN), contact, hébergeur sourcé, indépendance', async ({ page }) => {
  await page.goto('/mentions-legales/');
  const principal = page.getByRole('main');
  await expect(principal).toContainText('Particulier, à titre non professionnel');
  await expect(principal).toContainText('L’éditeur garde l’anonymat');
  await expect(principal.getByRole('link', { name: /article 1-1, II de la loi n° 2004-575/ })).toHaveAttribute(
    'href',
    SITE.editeur.anonymat.url,
  );
  await expect(principal).not.toContainText('Directeur de la publication');
  await expect(principal.getByRole('link', { name: 'contact@au-propre.fr' })).toHaveAttribute('href', 'mailto:contact@au-propre.fr');
  await expect(principal).toContainText('Cloudflare, Inc.');
  await expect(principal).toContainText('101 Townsend St., San Francisco, CA 94107, États-Unis');
  await expect(principal).toContainText('+1 (650) 319-8930');
  await expect(principal.getByRole('link', { name: /politique de confidentialité de Cloudflare/ })).toHaveAttribute(
    'href',
    SITE.hebergeur.source.url,
  );
  await expect(principal).toContainText(INDEPENDANCE.replace('Outil indépendant', 'Au propre est un outil indépendant'));
});

test('confidentialité : statistiques hors du vérificateur, e-mails de contact, inscription', async ({ page }) => {
  await page.goto('/confidentialite/');
  // La section des statistiques n'apparaît que si la balise est réellement ajoutée aux pages.
  const jamais = page.locator('#jamais').locator('..');
  if (statistiquesActives()) {
    const statistiques = page.locator('#statistiques').locator('..');
    await expect(statistiques).toContainText('La page du vérificateur n’en charge aucune.');
    await expect(statistiques).toContainText('ni cookie ni stockage dans votre navigateur');
    await expect(statistiques.getByRole('link', { name: 'présentation de Web Analytics' })).toHaveAttribute(
      'href',
      SITE.statistiques.sourceUrl,
    );
    await expect(jamais).not.toContainText('mesure d’audience');
  } else {
    await expect(page.locator('#statistiques')).toHaveCount(0);
    await expect(jamais).toContainText('aucun outil de mesure d’audience');
  }
  const contact = page.locator('#contact').locator('..');
  await expect(contact).toContainText('Le temps de vous répondre, puis 12\u00A0mois au plus après le dernier échange.');
  for (const nom of ['Cloudflare', 'Google', 'Brevo']) await expect(contact.getByRole('link', { name: nom })).toBeVisible();

  if (!inscriptionActive()) return;
  const inscription = page.locator('#inscription').locator('..');
  await expect(inscription).toContainText('Vous rappeler la date limite de dépôt avant la clôture.');
  await expect(inscription).toContainText('Si vous l’avez choisi, vous envoyer les nouveautés d’Au propre');
  await expect(inscription).toContainText('Votre consentement, que vous pouvez retirer à tout moment.');
  await expect(inscription).toContainText('Jusqu’à votre désinscription, et au plus 3\u00A0ans après votre dernier contact actif');
  await expect(inscription).toContainText('En un clic, par le lien présent dans chaque e-mail.');
  await expect(inscription.getByRole('link', { name: SITE.inscription.conservationSource.libelle })).toHaveAttribute(
    'href',
    SITE.inscription.conservationSource.url,
  );
  // Plus de promesse d'un seul e-mail suivi de la suppression de l'adresse.
  await expect(page.getByRole('main')).not.toContainText(/annonce|puis suppression|un seul e-mail/);
});

test('adresses e-mail protégées de l’obfuscation de Cloudflare dans le HTML livré', async ({ request }) => {
  for (const infos of [PAGES_DU_SITE.mentionsLegales, PAGES_DU_SITE.confidentialite]) {
    const html = await (await request.get(infos.chemin)).text();
    const protegees = html.match(/<!--email_off--><a href="mailto:contact@au-propre\.fr">contact@au-propre\.fr<\/a><!--\/email_off-->/g);
    expect(protegees?.length, infos.chemin).toBe(html.match(/contact@au-propre\.fr<\/a>/g)?.length);
  }
});

/** Juste avant et juste à l'heure de l'envoi du rappel (SESSION.rappel : 1er décembre 2026, 18 h à Paris). */
const AVANT_ENVOI = new Date('2026-12-01T16:59:00Z');
const ENVOI = new Date('2026-12-01T17:00:00Z');

test('encart d’inscription : absent sans adresse de formulaire, sinon lien direct sans paramètre', async ({ page }) => {
  await page.clock.setFixedTime(AVANT_ENVOI);
  await allerAuRapport(page, { fichier: cheminFixture('01_conforme_word.pdf') });
  const titre = page.getByRole('heading', { name: 'Recevez un rappel avant la clôture' });
  if (!inscriptionActive()) {
    await expect(titre).toHaveCount(0);
    await page.goto('/confidentialite/');
    await expect(page.locator('#inscription')).toHaveCount(0);
    return;
  }
  await expect(titre).toBeVisible();
  const lien = page.getByRole('link', { name: /M’inscrire au rappel/ });
  await expect(lien).toHaveAttribute('href', SITE.inscription.formulaireUrl);
  await expect(lien).toHaveAttribute('target', '_blank');
  await expect(lien).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(page.getByText('Votre e-mail n’est jamais lié à votre dossier.')).toBeVisible();
  await expect(page.locator('.v-inscription')).toContainText('Le dépôt dans Cyclades ferme le jeudi 3\u00A0décembre 2026 à 23\u00A0h\u00A059.');
  // Juste après le rapport : la checklist le précède, rien d'affiché ne le suit.
  const suivants = await page.locator('.v-inscription ~ *').evaluateAll((elements) =>
    elements.filter((element) => getComputedStyle(element).display !== 'none').length,
  );
  expect(suivants).toBe(0);
  await expect(page.locator('.v-checklist + .v-inscription, .v-checklist ~ .v-inscription')).toHaveCount(1);
});

test('encart d’inscription après l’envoi du rappel : seulement les nouveautés, bouton « M’inscrire »', async ({ page }) => {
  test.skip(!inscriptionActive(), 'Adresse du formulaire non renseignée');
  await page.clock.setFixedTime(ENVOI);
  await allerAuRapport(page, { fichier: cheminFixture('01_conforme_word.pdf') });
  const encart = page.locator('.v-inscription');
  await expect(encart.getByRole('heading', { name: 'Recevez les nouveautés d’Au propre' })).toBeVisible();
  await expect(encart).toContainText('Dont un guide pour préparer l’oral, envoyé en janvier.');
  await expect(encart).not.toContainText(/rappel|clôture/);
  const lien = encart.getByRole('link', { name: 'M’inscrire (nouvel onglet)', exact: true });
  await expect(lien).toHaveAttribute('href', SITE.inscription.formulaireUrl);
  await expect(lien).toHaveAttribute('rel', 'noopener noreferrer');
});

test('page des règles : version compacte de l’encart, même lien sans référent', async ({ page }) => {
  await page.clock.setFixedTime(AVANT_ENVOI);
  await page.goto('/regles/');
  const encart = page.getByRole('complementary', { name: 'Inscription par e-mail' });
  if (!inscriptionActive()) {
    await expect(encart).toHaveCount(0);
    return;
  }
  await expect(encart).toBeVisible();
  await expect(encart.getByText('Recevez un rappel avant la clôture')).toBeVisible();
  await expect(encart.getByText('Le dépôt dans Cyclades ferme le jeudi 3\u00A0décembre 2026 à 23\u00A0h\u00A059.')).toBeVisible();
  await expect(encart.getByText(/dont un guide pour préparer l’oral, envoyé en janvier\./)).toBeVisible();
  await expect(encart.getByText('Recevez les nouveautés d’Au propre')).toBeHidden();
  const lien = encart.getByRole('link', { name: /M’inscrire au rappel/ });
  await expect(lien).toHaveAttribute('href', SITE.inscription.formulaireUrl);
  await expect(lien).toHaveAttribute('target', '_blank');
  await expect(lien).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(encart.getByRole('link', { name: 'Politique de confidentialité' })).toHaveAttribute('href', '/confidentialite/#inscription');
});

test('page des règles après l’envoi du rappel : le script ne montre plus que les nouveautés', async ({ page }) => {
  test.skip(!inscriptionActive(), 'Adresse du formulaire non renseignée');
  // La page est construite avant l'envoi : c'est le script qui change la variante, sans nouveau déploiement.
  await page.clock.setFixedTime(ENVOI);
  await page.goto('/regles/');
  const encart = page.getByRole('complementary', { name: 'Inscription par e-mail' });
  const nouveautes = encart.locator('[data-variante="nouveautes"]');
  await expect(nouveautes).toBeVisible();
  await expect(nouveautes).toContainText('Recevez les nouveautés d’Au propre');
  await expect(nouveautes).toContainText('Dont un guide pour préparer l’oral, envoyé en janvier.');
  await expect(nouveautes).not.toContainText(/rappel|clôture/);
  await expect(encart.locator('[data-variante="rappel"]')).toBeHidden();
  const visibles = encart.getByRole('link', { name: /^M’inscrire/ });
  await expect(visibles).toHaveCount(1);
  await expect(visibles).toHaveAccessibleName('M’inscrire (nouvel onglet)');
  await expect(visibles).toHaveAttribute('href', SITE.inscription.formulaireUrl);
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
