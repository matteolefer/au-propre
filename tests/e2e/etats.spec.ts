/** États particuliers : scan, fichier invalide ou trop lourd, mauvais format, annulation. */
import { expect, test } from '@playwright/test';
import { closeSync, openSync, ftruncateSync } from 'node:fs';
import { cheminFixture, ouvrirVerificateur, remplirParametres } from './outils.ts';

const MO = 1024 * 1024;

/** Crée un fichier creux de la taille voulue, sans écrire ses octets sur le disque. */
function fichierDeTaille(chemin: string, octets: number): string {
  const descripteur = openSync(chemin, 'w');
  ftruncateSync(descripteur, octets);
  closeSync(descripteur);
  return chemin;
}

test('PDF scanné : analyse impossible, expliquée, sans découpage', async ({ page }) => {
  await ouvrirVerificateur(page);
  await remplirParametres(page, { fichier: cheminFixture('05_scanne.pdf') });
  await page.getByRole('button', { name: 'Lire mon dossier' }).click();
  const titre = page.getByRole('heading', { name: 'Analyse impossible : le PDF ne contient aucun texte' });
  await expect(titre).toBeVisible({ timeout: 30_000 });
  await expect(titre).toBeFocused();
  await expect(page.getByText(/Aucune des 11 pages ne contient de texte sélectionnable/)).toBeVisible();
  await expect(page.getByText('Comment corriger')).toBeVisible();
  await expect(page.locator('#champ-partie1')).toHaveCount(0);

  await page.getByRole('button', { name: 'Choisir un autre fichier' }).click();
  await expect(page.getByRole('heading', { name: 'Votre dossier' })).toBeVisible();
  // Le concours et la discipline sont conservés.
  await expect(page.locator('#champ-discipline')).toHaveValue('histoire-geographie');
});

test('fichier qui n’est pas un vrai PDF : message de lecture impossible', async ({ page }) => {
  await ouvrirVerificateur(page);
  await remplirParametres(page, {
    fichier: cheminFixture('01_conforme_word.pdf'),
  });
  await page.getByTestId('champ-fichier').setInputFiles({
    name: 'dossier.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('Ceci n’est pas un PDF.'),
  });
  await page.getByRole('button', { name: 'Lire mon dossier' }).click();
  const alerte = page.getByRole('alert');
  await expect(alerte).toContainText('Le fichier n’a pas pu être lu comme un PDF', { timeout: 30_000 });
  await expect(alerte).toContainText('Comment corriger');
  await expect(page.locator('#champ-concours')).toHaveValue('capes-interne');
});

test('PDF protégé par un mot de passe : message, façon de l’enlever, choix conservés', async ({ page }) => {
  await ouvrirVerificateur(page);
  await remplirParametres(page, { fichier: cheminFixture('06_protege.pdf') });
  await page.getByRole('button', { name: 'Lire mon dossier' }).click();
  const alerte = page.getByRole('alert');
  await expect(alerte).toContainText('Le PDF est protégé par un mot de passe', { timeout: 30_000 });
  await expect(alerte).toContainText('Ce PDF demande un mot de passe à l’ouverture\u00A0: l’outil ne peut pas le lire.');
  await expect(alerte).toContainText('Chiffrer le document avec un mot de passe');
  await expect(alerte).toContainText('Déposez aussi cette version dans Cyclades, pour que le jury puisse l’ouvrir.');
  await expect(page.locator('#champ-concours')).toHaveValue('capes-interne');
  await expect(page.locator('#champ-discipline')).toHaveValue('histoire-geographie');
});

test('document Word : refusé avant toute lecture, avec la façon de l’exporter', async ({ page }) => {
  await ouvrirVerificateur(page);
  await page.getByTestId('champ-fichier').setInputFiles(cheminFixture('01_conforme.docx'));
  const alerte = page.getByRole('alert');
  await expect(alerte).toContainText('Ce fichier n’est pas encore un PDF');
  await expect(alerte).toContainText('Fichier > Exporter au format PDF');
  await expect(page.locator('.v-depot')).toContainText('Choisir un fichier PDF');
});

test('fichier de plus de 50 Mo : refusé avant lecture, limite présentée comme celle de l’outil', async ({ page }, infos) => {
  await ouvrirVerificateur(page);
  const chemin = fichierDeTaille(infos.outputPath('lourd.pdf'), 51 * MO);
  await page.getByTestId('champ-fichier').setInputFiles(chemin);
  const alerte = page.getByRole('alert');
  await expect(alerte).toContainText('Le fichier est trop lourd pour l’outil');
  await expect(alerte).toContainText('51 Mo');
  await expect(alerte).toContainText('pas une règle officielle');
});

test('fichier de plus de 10 Mo : information sur le poids, sans refus', async ({ page }, infos) => {
  await ouvrirVerificateur(page);
  const chemin = fichierDeTaille(infos.outputPath('assez-lourd.pdf'), 11 * MO);
  await page.getByTestId('champ-fichier').setInputFiles(chemin);
  await expect(page.getByText(/Votre fichier est lourd\. Aucune limite officielle n’est publiée pour le RAEP/)).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('annuler la lecture revient au formulaire, fichier conservé', async ({ page }) => {
  // Le script du Worker arrive en retard : la lecture reste en cours.
  await page.route('**/extract.worker-*.js', async (route) => {
    await new Promise((resoudre) => setTimeout(resoudre, 5_000));
    await route.continue().catch(() => undefined);
  });
  await ouvrirVerificateur(page);
  await remplirParametres(page, { fichier: cheminFixture('01_conforme_word.pdf') });
  await page.getByRole('button', { name: 'Lire mon dossier' }).click();
  await expect(page.getByRole('heading', { name: 'Lecture du dossier' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Ouverture du fichier…');

  await page.getByRole('button', { name: 'Annuler' }).click();
  await expect(page.getByRole('heading', { name: 'Votre dossier' })).toBeFocused();
  await expect(page.locator('.v-depot')).toContainText('01_conforme_word.pdf');
  await expect(page.getByRole('alert')).toHaveCount(0);
});
