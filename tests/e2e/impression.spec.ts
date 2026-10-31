/** Feuille de style d'impression : seul le rapport s'imprime, sources comprises. */
import { expect, test } from '@playwright/test';
import { allerAuRapport, cheminFixture } from './outils.ts';

test('à l’impression, le rapport est seul, avec l’adresse des sources', async ({ page }) => {
  await allerAuRapport(page, { fichier: cheminFixture('02_partie1_3pages.pdf') });
  const sourcesCitees = page.getByRole('heading', { name: 'Sources citées' });
  // À l'écran, les adresses restent dans les liens.
  await expect(sourcesCitees).toBeHidden();

  await page.emulateMedia({ media: 'print' });
  await expect(page.getByRole('heading', { name: 'Rapport de vérification' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Imprimer le rapport' })).toBeHidden();
  await expect(page.locator('.v-etapes')).toBeHidden();
  await expect(page.getByText('Outil indépendant, non affilié au ministère de l’Éducation nationale.')).toBeVisible();
  await expect(sourcesCitees).toBeVisible();
  await expect(page.locator('.v-sources-citees')).toContainText(
    'https://www.devenirenseignant.gouv.fr/conseils-pour-l-epreuve-de-reconnaissance-des-acquis-de-l-experience-professionnelle-raep-de-1124',
  );
  await expect(page.getByRole('heading', { name: 'À vérifier vous-même' })).toBeVisible();
});
