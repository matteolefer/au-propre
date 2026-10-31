/**
 * Accueil refondu : contraintes mesurées sur la page livrée (bureau et mobile).
 * Hero centré, aperçu du rapport, une seule source, 5 tailles de texte par écran,
 * texte de 640 à 720 px, 96 à 128 px entre les sections, fond blanc.
 */
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
});

test('au plus 5 tailles de texte à l’écran', async ({ page }) => {
  const tailles = await page.evaluate(() => {
    const vues = new Set<string>();
    for (const element of document.querySelectorAll('body *')) {
      const aDuTexte = [...element.childNodes].some((noeud) => noeud.nodeType === Node.TEXT_NODE && noeud.textContent?.trim());
      if (!aDuTexte || element.closest('.v-visuellement-cache, .evitement')) continue;
      const boite = element.getBoundingClientRect();
      if (boite.width === 0 || boite.height === 0) continue;
      // Ce que le panneau coupe n'est pas visible.
      const panneau = element.closest('.accueil-panneau');
      if (panneau && boite.top >= panneau.getBoundingClientRect().bottom) continue;
      vues.add(getComputedStyle(element).fontSize);
    }
    return [...vues];
  });
  expect(tailles.length, tailles.join(', ')).toBeLessThanOrEqual(5);
});

test('titre de 6 à 9 mots, 64 px au plus ; accroche de 2 lignes au plus sur ordinateur', async ({ page, isMobile }) => {
  const titre = page.locator('h1');
  const mots = (await titre.innerText()).trim().split(/\s+/).length;
  expect(mots).toBeGreaterThanOrEqual(6);
  expect(mots).toBeLessThanOrEqual(9);
  expect(parseFloat(await titre.evaluate((e) => getComputedStyle(e).fontSize))).toBeLessThanOrEqual(64);
  const accroche = page.locator('.accueil-hero__accroche');
  const { hauteur, interligne, largeur } = await accroche.evaluate((e) => ({
    hauteur: e.getBoundingClientRect().height,
    interligne: parseFloat(getComputedStyle(e).lineHeight),
    largeur: e.getBoundingClientRect().width,
  }));
  // 60 caractères de large environ ; sur mobile, l'écran est plus étroit que 60 caractères.
  expect(largeur).toBeLessThanOrEqual(600);
  if (!isMobile) expect(Math.round(hauteur / interligne)).toBeLessThanOrEqual(2);
});

test('sous le bouton : la date limite et la gratuité', async ({ page }) => {
  const bouton = page.locator('.accueil-hero__action').getByRole('link', { name: 'Vérifier mon dossier' });
  await expect(bouton).toHaveAttribute('href', '/verifier/');
  const infos = page.locator('.accueil-hero__infos');
  await expect(infos).toContainText('Date limite : jeudi 3 décembre 2026 à 23 h 59');
  await expect(infos).toContainText('Gratuit, sans compte. Votre fichier reste sur votre ordinateur.');
});

test('aperçu du rapport : vrais composants, trois groupes, données d’exemple annoncées', async ({ page }) => {
  const apercu = page.locator('.apercu');
  await expect(apercu.locator('.v-compteur')).toHaveCount(3);
  await expect(apercu.locator('.v-groupe')).toHaveCount(3);
  await expect(apercu.locator('[data-regle="R08"]')).toContainText('Les marges gauche ou droite sont inférieures à 2,5\u00A0cm');
  await expect(apercu).toContainText('Exemple de rapport sur un dossier fictif.');
});

test('aperçu : une feuille sur un panneau bleu pâle, la miniature et sa zone surlignée visibles en entier', async ({ page }) => {
  await expect(page.locator('.accueil-panneau')).toHaveCSS('background-color', 'rgb(242, 245, 251)');
  // Trait de marge bleu encre et coin corné (découpe de la feuille).
  const trait = await page.locator('.apercu__feuille').evaluate((feuille) => getComputedStyle(feuille, '::before').backgroundColor);
  expect(trait).toBe('rgb(30, 74, 154)');
  await expect(page.locator('.apercu__feuille')).toHaveCSS('clip-path', /polygon/);
  const miniature = page.locator('.apercu [data-regle="R08"] .v-apercu-page');
  await expect(miniature.locator('img')).toHaveAttribute('src', '/exemple/page-2.png');
  await expect(miniature.locator('.v-zone')).toHaveCount(2);
  await expect(miniature.locator('.v-zone').first()).toHaveCSS('background-color', 'rgb(255, 241, 168)');
  const basMiniature = (await miniature.boundingBox())?.y ?? 0;
  const hauteurMiniature = (await miniature.boundingBox())?.height ?? 0;
  const panneau = await page.locator('.accueil-panneau').boundingBox();
  expect(basMiniature + hauteurMiniature).toBeLessThanOrEqual((panneau?.y ?? 0) + (panneau?.height ?? 0));
});

test('titres h1 et h2 en Source Serif 4, texte courant dans la police du site', async ({ page }) => {
  for (const selecteur of ['h1', 'h2:not(.v-visuellement-cache)']) {
    await expect(page.locator(selecteur).first()).toHaveCSS('font-family', /^"Source Serif 4"/);
    await expect(page.locator(selecteur).first()).toHaveCSS('font-weight', '600');
  }
  await expect(page.locator('.accueil-hero__accroche')).not.toHaveCSS('font-family', /Source Serif/);
  await expect(page.locator('body')).toHaveCSS('color', 'rgb(55, 53, 47)');
});

test('un seul chiffre sourcé, et aucune autre source hors de l’aperçu', async ({ page }) => {
  const liens = await page.locator('a[href^="http"]').evaluateAll((liens) =>
    liens.filter((lien) => !lien.closest('.apercu')).map((lien) => lien.textContent?.trim()),
  );
  expect(liens).toEqual(['Rapport de jury CPE interne 2026']);
  await expect(page.locator('.accueil-chiffre__texte')).toHaveText(
    'En 2026, 8 % des dossiers RAEP du CPE interne ont été écartés pour leur forme.',
  );
});

test('mise en page : fond papier, logo de 36 à 40 px, texte de 640 à 720 px, 96 à 128 px entre les sections', async ({ page, isMobile }) => {
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(251, 250, 247)');
  const logo = (await page.getByRole('banner').locator('img').boundingBox())?.height ?? 0;
  expect(logo).toBeGreaterThanOrEqual(36);
  expect(logo).toBeLessThanOrEqual(40);
  const ecarts = await page.locator('.accueil-section').evaluateAll((sections) =>
    sections.slice(1).map((section, i) => section.getBoundingClientRect().top - (sections[i]?.getBoundingClientRect().bottom ?? 0)),
  );
  for (const ecart of ecarts) {
    expect(ecart).toBeGreaterThanOrEqual(96);
    expect(ecart).toBeLessThanOrEqual(128);
  }
  if (!isMobile) {
    const largeur = (await page.locator('.accueil-colonne').first().boundingBox())?.width ?? 0;
    expect(largeur).toBeGreaterThanOrEqual(640);
    expect(largeur).toBeLessThanOrEqual(720);
  }
});
