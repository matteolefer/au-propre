/**
 * Parcours complet sur les fixtures : paramètres, découpage proposé, rapport.
 * Les attendus sont ceux du README des fixtures (tests/helpers/attendus.ts),
 * plus R19 : les fixtures ne sont pas nommées NOM_Prénom.pdf.
 */
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { ATTENDUS, DECOUPAGES, plusFortesGravites, type FixtureTexte } from '../helpers/attendus.ts';
import {
  allerAuRapport,
  attendreSansDefilementHorizontal,
  cheminFixture,
  confirmerDecoupage,
  controlesDuRapport,
  lireJusquAuDecoupage,
  ouvrirVerificateur,
  remplirParametres,
} from './outils.ts';

for (const nom of Object.keys(ATTENDUS) as FixtureTexte[]) {
  test(`${nom} : découpage proposé puis rapport attendu`, async ({ page }) => {
    await ouvrirVerificateur(page);
    await remplirParametres(page, { fichier: cheminFixture(`${nom}.pdf`) });

    const debut = Date.now();
    await lireJusquAuDecoupage(page);
    test.info().annotations.push({ type: 'durée de lecture', description: `${Date.now() - debut} ms` });

    // Le découpage proposé est celui du README, trouvé d'après les titres.
    const decoupage = DECOUPAGES[nom];
    await expect(page.locator('#champ-partie1')).toHaveValue(String(decoupage.partie1.debut));
    await expect(page.locator('#champ-partie2')).toHaveValue(String(decoupage.partie2.debut));
    await expect(page.locator('#champ-annexes')).toHaveValue(String(decoupage.annexes?.debut ?? ''));
    await expect(page.getByText('Trouvée d’après le titre')).toHaveCount(3);
    // Un aperçu par page, dessiné dans le Worker.
    const pages = decoupage.annexes?.fin ?? decoupage.partie2.fin;
    await expect(page.locator('.v-miniature img')).toHaveCount(pages);
    // Aucun rapport avant la confirmation.
    await expect(page.getByRole('heading', { name: 'Rapport de vérification' })).toHaveCount(0);

    await confirmerDecoupage(page);
    const controles = await controlesDuRapport(page);
    expect(plusFortesGravites(controles)).toEqual({ ...ATTENDUS[nom], R19: 'avertissement' });

    // Le résumé compte les contrôles de chaque groupe.
    const nombre = (gravite: string) => controles.filter((c) => c.gravite === gravite).length;
    const resume = page.locator('.v-resume');
    await expect(resume.locator('.v-compteur--erreur .v-compteur__nombre')).toHaveText(String(nombre('erreur')));
    await expect(resume.locator('.v-compteur--avertissement .v-compteur__nombre')).toHaveText(String(nombre('avertissement')));
    await expect(resume.locator('.v-compteur--conforme .v-compteur__nombre')).toHaveText(String(nombre('conforme')));
  });
}

test('chaque contrôle signalé dit ce qui a été mesuré, comment corriger, et cite sa source en lien', async ({ page }) => {
  await allerAuRapport(page, { fichier: cheminFixture('02_partie1_3pages.pdf') });
  const r02 = page.locator('.v-controle[data-regle="R02"]');
  await expect(r02.getByText('Ce qui a été mesuré')).toBeVisible();
  await expect(r02.getByText('La partie 1 occupe 3 pages (pages 2 à 4)', { exact: false })).toBeVisible();
  await expect(r02.getByText('Pages concernées')).toBeVisible();
  await expect(r02.getByText('Comment corriger')).toBeVisible();
  const source = r02.getByRole('link', { name: /Conseils pour l’épreuve de RAEP/ });
  await expect(source).toHaveAttribute('href', /^https:\/\/www\.devenirenseignant\.gouv\.fr\//);
  await expect(source).toHaveAttribute('target', '_blank');
  // La checklist manuelle et son point sur les annexes en image.
  await expect(page.getByRole('heading', { name: 'À vérifier vous-même' })).toBeVisible();
  await expect(page.getByRole('checkbox')).toHaveCount(10);
  await expect(page.getByText(/l’outil ne lit pas le texte des images/)).toBeVisible();
  await page.getByRole('checkbox').first().check();
  await expect(page.getByText('1 point coché sur 10')).toBeVisible();
});

test('glisser-déposer un PDF dans la zone de dépôt', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Pas de glisser-déposer sur écran tactile');
  await ouvrirVerificateur(page);
  const octets = readFileSync(cheminFixture('01_conforme_word.pdf')).toString('base64');
  const transfert = await page.evaluateHandle((base64) => {
    const binaire = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const donnees = new DataTransfer();
    donnees.items.add(new File([binaire], 'DUPONT_Marie.pdf', { type: 'application/pdf' }));
    return donnees;
  }, octets);
  const zone = page.locator('.v-depot');
  await zone.dispatchEvent('dragenter', { dataTransfer: transfert });
  await expect(zone).toHaveClass(/v-depot--survol/);
  await zone.dispatchEvent('dragover', { dataTransfer: transfert });
  await zone.dispatchEvent('drop', { dataTransfer: transfert });
  await expect(zone.getByText('DUPONT_Marie.pdf')).toBeVisible();

  await page.locator('#champ-concours').selectOption('capes-interne');
  await page.locator('#champ-discipline').selectOption('lettres-modernes');
  await lireJusquAuDecoupage(page);
  await confirmerDecoupage(page);
  // Nom conforme : R19 passe, et le rapport ne signale rien d'autre sur l'export Word conforme.
  expect(plusFortesGravites(await controlesDuRapport(page))).toEqual({});
});

test('corriger le découpage change le rapport, et le modifier efface le rapport', async ({ page }) => {
  await ouvrirVerificateur(page);
  await remplirParametres(page, { fichier: cheminFixture('01_conforme_word.pdf') });
  await lireJusquAuDecoupage(page);

  // Partie 2 à partir de la page 5 : la partie 1 occupe 3 pages.
  await page.locator('#champ-partie2').selectOption('5');
  await expect(page.getByText('Partie 1 : pages 2 à 4 (3 pages)').first()).toBeVisible();
  await confirmerDecoupage(page);
  expect(plusFortesGravites(await controlesDuRapport(page))).toMatchObject({ R02: 'erreur' });

  await page.getByRole('button', { name: 'Modifier le découpage' }).click();
  await expect(page.getByRole('heading', { name: 'Vérifiez le découpage' })).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Rapport de vérification' })).toHaveCount(0);
  await expect(page.locator('#champ-partie2')).toHaveValue('5');
});

test('un découpage invalide bloque la vérification', async ({ page }) => {
  await ouvrirVerificateur(page);
  await remplirParametres(page, { fichier: cheminFixture('01_conforme_word.pdf') });
  await lireJusquAuDecoupage(page);

  await page.locator('#champ-partie2').selectOption('2');
  await expect(page.getByText('La partie 2 doit commencer après la partie 1.')).toBeVisible();
  await expect(page.locator('#champ-partie2')).toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('button', { name: 'Confirmer le découpage et vérifier' }).click();
  await expect(page.locator('#champ-partie2')).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Rapport de vérification' })).toHaveCount(0);
});

test('paramètres manquants : chaque champ le dit, le focus va sur le premier', async ({ page }) => {
  await ouvrirVerificateur(page);
  await page.getByRole('button', { name: 'Lire mon dossier' }).click();
  await expect(page.getByText('Choisissez votre concours.')).toBeVisible();
  await expect(page.getByText('Choisissez le PDF de votre dossier.')).toBeVisible();
  await expect(page.locator('#champ-concours')).toBeFocused();
  // La discipline n'est demandée qu'une fois le concours choisi.
  await expect(page.getByText('Choisissez votre discipline.')).toHaveCount(0);
  await page.locator('#champ-concours').selectOption('caplp-interne');
  await expect(page.getByText('Choisissez votre concours.')).toHaveCount(0);
  await page.getByRole('button', { name: 'Lire mon dossier' }).click();
  await expect(page.getByText('Choisissez votre discipline.')).toBeVisible();
  await expect(page.locator('#champ-discipline')).toBeFocused();
});

test('marges de 2 cm : le contrôle R08 montre la page 2 avec la zone en faute surlignée', async ({ page }) => {
  await allerAuRapport(page, { fichier: cheminFixture('04_marges_2cm_word.pdf') });
  const apercu = page.locator('[data-regle="R08"] .v-apercu-page');
  await expect(apercu.locator('img')).toHaveAttribute('src', /^blob:/);
  await expect(apercu.locator('img')).toHaveAttribute('alt', 'Aperçu de la page 2');
  await expect(apercu.locator('.v-zone')).toHaveCount(2);
  await expect(apercu).toContainText('Page 2\u00A0: zone en faute surlignée.');
});

test('CPE interne : pas de discipline à choisir', async ({ page }) => {
  await ouvrirVerificateur(page);
  await page.locator('#champ-concours').selectOption('cpe-interne');
  await expect(page.locator('#champ-discipline')).toHaveCount(0);
  await page.getByTestId('champ-fichier').setInputFiles(cheminFixture('01_conforme_word.pdf'));
  await lireJusquAuDecoupage(page);
  await confirmerDecoupage(page);
  await expect(page.locator('.v-meta')).toContainText('CPE interne');
  // La checklist n'a pas de point sur la discipline.
  await expect(page.getByRole('checkbox')).toHaveCount(9);
  // La présentation cite les sources propres au concours de CPE.
  await expect(page.locator('[data-regle="R05"]')).toContainText('Rapport de jury CPE interne 2026');
});

test('parcours au clavier : fichier, lecture, confirmation, focus sur chaque étape', async ({ page, isMobile, browserName }) => {
  test.skip(isMobile, 'Parcours clavier testé sur ordinateur');
  await ouvrirVerificateur(page);
  await page.locator('#champ-concours').selectOption('capes-interne');
  await page.locator('#champ-discipline').selectOption('mathematiques');

  // Le champ fichier est atteint par Tab depuis la discipline (après les liens
  // vers les sources, que WebKit saute par défaut), et s'ouvre au clavier.
  await page.locator('#champ-discipline').focus();
  const champFichier = page.getByTestId('champ-fichier');
  for (let i = 0; i < 4 && !(await champFichier.evaluate((e) => e === document.activeElement)); i++) {
    await page.keyboard.press('Tab');
  }
  await expect(champFichier).toBeFocused();
  // Le focus du champ caché se voit sur la zone de dépôt.
  if (browserName !== 'webkit') {
    await expect(page.locator('.v-depot')).not.toHaveCSS('box-shadow', 'none');
  }
  const [selecteur] = await Promise.all([page.waitForEvent('filechooser'), page.keyboard.press('Space')]);
  await selecteur.setFiles(cheminFixture('01_conforme_word.pdf'));
  await expect(page.locator('.v-depot').getByText('01_conforme_word.pdf')).toBeVisible();

  await page.getByRole('button', { name: 'Lire mon dossier' }).focus();
  await page.keyboard.press('Enter');
  const titreDecoupage = page.getByRole('heading', { name: 'Vérifiez le découpage' });
  await expect(titreDecoupage).toBeFocused({ timeout: 30_000 });

  await page.getByRole('button', { name: 'Confirmer le découpage et vérifier' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Rapport de vérification' })).toBeFocused();
});

test('mobile : aucun défilement horizontal, du formulaire au rapport', async ({ page }) => {
  await ouvrirVerificateur(page);
  await attendreSansDefilementHorizontal(page);
  await remplirParametres(page, { fichier: cheminFixture('02_partie1_3pages.pdf') });
  await attendreSansDefilementHorizontal(page);
  await lireJusquAuDecoupage(page);
  await attendreSansDefilementHorizontal(page);
  await confirmerDecoupage(page);
  await attendreSansDefilementHorizontal(page);
});
