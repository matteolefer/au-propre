/**
 * Le PDF ne quitte jamais l'ordinateur (CLAUDE.md, règle 4 ; SPEC §8) :
 * pendant tout le parcours, la page ne fait que des requêtes GET sans corps
 * vers le site lui-même, pour charger ses propres fichiers.
 */
import { expect, test, type Request } from '@playwright/test';
import { SITE, statistiquesActives } from '../../src/content/site.ts';
import {
  cheminFixture,
  confirmerDecoupage,
  lireJusquAuDecoupage,
  ouvrirVerificateur,
  remplirParametres,
} from './outils.ts';

test('aucune requête réseau ne transporte le PDF', async ({ page, baseURL }) => {
  const origine = new URL(baseURL ?? 'http://localhost:4329').origin;
  const requetes: Request[] = [];
  const refusees: string[] = [];
  const websockets: string[] = [];

  page.on('request', (requete) => requetes.push(requete));
  page.on('websocket', (socket) => websockets.push(socket.url()));
  // Toute requête autre que GET est bloquée et fait échouer le test.
  await page.route('**/*', async (route) => {
    const requete = route.request();
    if (requete.method() !== 'GET') {
      refusees.push(`${requete.method()} ${requete.url()}`);
      await route.abort();
      return;
    }
    await route.continue();
  });

  await ouvrirVerificateur(page);
  const avantLeFichier = requetes.length;
  await remplirParametres(page, { fichier: cheminFixture('01_conforme_word.pdf') });
  await lireJusquAuDecoupage(page);
  await confirmerDecoupage(page);
  await page.getByRole('checkbox').first().check();

  expect(refusees).toEqual([]);
  expect(websockets).toEqual([]);
  // Pas de statistiques sur le vérificateur : aucun script venu d'un autre site.
  await expect(page.locator('script[src^="http"]')).toHaveCount(0);
  for (const requete of requetes) {
    const url = new URL(requete.url());
    // Les aperçus des pages sont des adresses locales (blob:), créées dans le navigateur.
    if (url.protocol === 'blob:' || url.protocol === 'data:') continue;
    expect(url.origin, requete.url()).toBe(origine);
    expect(requete.method(), requete.url()).toBe('GET');
    expect(requete.postDataBuffer(), requete.url()).toBeNull();
  }
  // Après le choix du fichier, seuls les scripts du site (le Worker) sont chargés.
  const apres = requetes.slice(avantLeFichier).filter((r) => !/^(blob|data):/.test(r.url()));
  for (const requete of apres) expect(requete.url(), requete.url()).toMatch(/\/_astro\/.+\.js$/);
});

test('pages de contenu : seule requête vers un autre site, la balise de statistiques (ni police externe, ni autre script)', async ({
  page,
  baseURL,
}) => {
  const origine = new URL(baseURL ?? 'http://localhost:4329').origin;
  const requetes: Request[] = [];
  page.on('request', (requete) => requetes.push(requete));
  // La balise de Cloudflare est servie vide : le test ne dépend pas du réseau et n'envoie rien.
  await page.route(SITE.statistiques.script, (route) => route.fulfill({ contentType: 'text/javascript', body: '' }));
  for (const chemin of ['/', '/regles/', '/confidentialite/', '/mentions-legales/', '/page-inexistante/']) {
    await page.goto(chemin);
    await page.waitForLoadState('networkidle');
    const balise = page.locator(`script[src="${SITE.statistiques.script}"]`);
    if (statistiquesActives()) {
      await expect(balise, chemin).toHaveAttribute('data-cf-beacon', JSON.stringify({ token: SITE.statistiques.jeton }));
    } else {
      await expect(balise, chemin).toHaveCount(0);
    }
  }
  for (const requete of requetes) {
    if (/^(blob|data):/.test(requete.url())) continue;
    expect(requete.method(), requete.url()).toBe('GET');
    if (requete.url() === SITE.statistiques.script) continue;
    expect(new URL(requete.url()).origin, requete.url()).toBe(origine);
  }
  // Le seul script des pages de contenu est la balise de statistiques.
  const scripts = requetes.filter((r) => r.resourceType() === 'script').map((r) => r.url());
  expect(new Set(scripts)).toEqual(new Set(statistiquesActives() ? [SITE.statistiques.script] : []));
});
