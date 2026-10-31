/**
 * Échelle du site, étendue de l'accueil aux autres pages : 5 tailles de texte
 * par écran, titres de page et de section aux tailles de l'échelle, colonne
 * de 680 px, 112 px entre les sections (96 sur mobile), lignes de moins de
 * 80 caractères (CLAUDE.md).
 */
import { expect, test, type Page } from '@playwright/test';
import { allerAuRapport, cheminFixture, lireJusquAuDecoupage, ouvrirVerificateur, remplirParametres } from './outils.ts';

/** Tailles de texte visibles à l'écran (pleine page). */
async function taillesDeTexte(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const vues = new Set<string>();
    for (const element of document.querySelectorAll('body *')) {
      const aDuTexte = [...element.childNodes].some((noeud) => noeud.nodeType === Node.TEXT_NODE && noeud.textContent?.trim());
      if (!aDuTexte || element.closest('.v-visuellement-cache, .evitement')) continue;
      const boite = element.getBoundingClientRect();
      if (boite.width === 0 || boite.height === 0) continue;
      vues.add(getComputedStyle(element).fontSize);
    }
    return [...vues];
  });
}

/** La ligne affichée la plus longue, en caractères, parmi les paragraphes, listes et cellules du contenu. */
async function ligneLaPlusLongue(page: Page): Promise<string> {
  return page.evaluate(() => {
    let plusLongue = '';
    // Éléments de texte seulement : un conteneur mettrait côte à côte un libellé et sa valeur.
    for (const element of document.querySelectorAll('main p, main dd, main td, main label, main li:not(:has(p, dl, h3, div))')) {
      const lignes = new Map<number, string>();
      const parcours = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      for (let noeud = parcours.nextNode() as Text | null; noeud; noeud = parcours.nextNode() as Text | null) {
        for (let i = 0; i < noeud.length; i++) {
          const plage = document.createRange();
          plage.setStart(noeud, i);
          plage.setEnd(noeud, i + 1);
          const boite = plage.getBoundingClientRect();
          if (boite.height === 0) continue;
          const y = Math.round(boite.top);
          lignes.set(y, (lignes.get(y) ?? '') + noeud.data[i]);
        }
      }
      for (const ligne of lignes.values()) {
        const texte = ligne.replace(/\s+/g, ' ').trim();
        if (texte.length > plusLongue.length) plusLongue = texte;
      }
    }
    return plusLongue;
  });
}

async function verifierEchelle(page: Page, isMobile: boolean, colonne: string): Promise<void> {
  const tailles = await taillesDeTexte(page);
  expect(tailles.length, tailles.join(', ')).toBeLessThanOrEqual(5);
  const permises = isMobile ? ['14px', '16px', '20px', '24px', '36px'] : ['14px', '16px', '20px', '32px', '56px'];
  for (const taille of tailles) expect(permises, `taille hors échelle : ${taille}`).toContain(taille);
  await expect(page.locator('h1')).toHaveCSS('font-size', isMobile ? '36px' : '56px');

  const ligne = await ligneLaPlusLongue(page);
  expect(ligne.length, ligne).toBeLessThan(80);

  if (!isMobile) {
    const largeur = (await page.locator(colonne).boundingBox())?.width ?? 0;
    expect(largeur).toBe(680);
  }
}

for (const chemin of ['/regles/', '/confidentialite/', '/mentions-legales/']) {
  test(`${chemin} : échelle de l'accueil, colonne de 680 px, 112 px entre les sections`, async ({ page, isMobile }) => {
    await page.goto(chemin);
    await verifierEchelle(page, isMobile, '.p-page');
    await expect(page.locator('.p-section > h2').first()).toHaveCSS('font-size', isMobile ? '24px' : '32px');
    const ecarts = await page.locator('.p-section').evaluateAll((sections) =>
      sections.slice(1).map((section, i) => section.getBoundingClientRect().top - (sections[i]?.getBoundingClientRect().bottom ?? 0)),
    );
    expect(ecarts.length).toBeGreaterThan(0);
    for (const ecart of ecarts) expect(Math.round(ecart)).toBe(isMobile ? 96 : 112);
  });
}

test('404 : échelle de l’accueil', async ({ page, isMobile }) => {
  await page.goto('/nexiste-pas/');
  await verifierEchelle(page, isMobile, '.p-page');
});

test('vérificateur : échelle de l’accueil à chaque étape, rapport dans la colonne de 680 px', async ({ page, isMobile }) => {
  await ouvrirVerificateur(page);
  await verifierEchelle(page, isMobile, '.v-page');
  await expect(page.locator('.v-etape__titre')).toHaveCSS('font-size', isMobile ? '24px' : '32px');

  await remplirParametres(page, { fichier: cheminFixture('04_marges_2cm_word.pdf') });
  await lireJusquAuDecoupage(page);
  await verifierEchelle(page, isMobile, '.v-page');

  await allerAuRapport(page, { fichier: cheminFixture('04_marges_2cm_word.pdf') });
  await verifierEchelle(page, isMobile, '.v-page');
  if (!isMobile) {
    // Le rapport tient dans la colonne : la miniature de R08 et les détails restent lisibles.
    expect((await page.locator('.v-controles').first().boundingBox())?.width ?? 0).toBeLessThanOrEqual(680);
    await expect(page.locator('[data-regle="R08"] .v-apercu-page__cadre')).toHaveCSS('width', '200px');
  }
});

test('accueil : lignes de moins de 80 caractères', async ({ page }) => {
  await page.goto('/');
  const ligne = await ligneLaPlusLongue(page);
  expect(ligne.length, ligne).toBeLessThan(80);
});
