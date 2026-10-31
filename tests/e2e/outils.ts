/** Outils communs aux tests de bout en bout du vérificateur. */
import { expect, type Page } from '@playwright/test';
import path from 'node:path';
import type { Gravite } from '../../src/checker/types.ts';

export const DOSSIER_FIXTURES = path.resolve('tests/fixtures');

export function cheminFixture(nom: string): string {
  return path.join(DOSSIER_FIXTURES, nom);
}

/** Ouvre le vérificateur et attend l'hydratation de l'îlot : les champs sont alors actifs. */
export async function ouvrirVerificateur(page: Page): Promise<void> {
  await page.goto('/verifier/');
  await expect(page.locator('#champ-concours')).toBeEnabled();
}

interface Choix {
  concours?: string;
  discipline?: string | null;
  fichier: string;
}

/** Étape 1 : concours, discipline (CAPES histoire-géographie par défaut), fichier. */
export async function remplirParametres(page: Page, choix: Choix): Promise<void> {
  await page.locator('#champ-concours').selectOption(choix.concours ?? 'capes-interne');
  const discipline = choix.discipline === undefined ? 'histoire-geographie' : choix.discipline;
  if (discipline !== null) await page.locator('#champ-discipline').selectOption(discipline);
  await page.getByTestId('champ-fichier').setInputFiles(choix.fichier);
}

export async function lireJusquAuDecoupage(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Lire mon dossier' }).click();
  await expect(page.getByRole('heading', { name: 'Vérifiez le découpage' })).toBeVisible({ timeout: 30_000 });
}

export async function confirmerDecoupage(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Confirmer le découpage et vérifier' }).click();
  await expect(page.getByRole('heading', { name: 'Rapport de vérification' })).toBeVisible();
}

/** Parcours complet jusqu'au rapport. */
export async function allerAuRapport(page: Page, choix: Choix): Promise<void> {
  await ouvrirVerificateur(page);
  await remplirParametres(page, choix);
  await lireJusquAuDecoupage(page);
  await confirmerDecoupage(page);
}

/** Règles affichées dans le rapport, avec la gravité de chaque contrôle. */
export async function controlesDuRapport(page: Page): Promise<{ id: string; gravite: Gravite }[]> {
  return page.locator('.v-controle').evaluateAll((elements) =>
    elements.map((element) => {
      const gravite = ['erreur', 'avertissement', 'conforme', 'info', 'bloquant'].find((g) =>
        element.classList.contains(`v-controle--${g}`),
      );
      return { id: element.getAttribute('data-regle') ?? '', gravite: (gravite ?? 'info') as Gravite };
    }),
  );
}

/** Pas de défilement horizontal : rien ne dépasse de la largeur de l'écran. */
export async function attendreSansDefilementHorizontal(page: Page): Promise<void> {
  const debordement = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(debordement).toBeLessThanOrEqual(0);
}
