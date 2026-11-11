/**
 * Le site en ligne tient ce que disent la politique de confidentialité et les
 * mentions légales : aucun cookie, vraie page 404, redirections vers
 * https://au-propre.fr, en-têtes de sécurité, aucun script injecté par
 * Cloudflare, et un PDF analysé dans le navigateur sans rien envoyer.
 * Ces tests ne supposent aucun réglage de la zone Cloudflare : ils vérifient
 * que l'obfuscation des e-mails, le robots.txt géré ou l'absence de
 * redirection vers https ne modifient pas le site.
 *
 *     npm run test:prod
 */
import { expect, test, type APIRequestContext, type APIResponse, type Request } from '@playwright/test';
import { estIndexee, PAGES_DU_SITE, SITE, statistiquesActives, texteRobots } from '../../src/content/site.ts';
import { allerAuRapport, cheminFixture, controlesDuRapport, releverViolations } from '../e2e/outils.ts';

const PAGES = Object.values(PAGES_DU_SITE);
const CHEMINS = [...PAGES.map((page) => page.chemin), '/page-inexistante/'];
const HOTE = new URL(SITE.url).host;

/**
 * En-tête Accept d'un navigateur. Cloudflare ne modifie le HTML (balise de
 * statistiques ajoutée, adresses e-mail masquées) que pour une requête qui
 * accepte du HTML : sans lui, les tests ne verraient pas ce que voit un visiteur.
 */
const NAVIGATEUR = { Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' };

/** Page telle qu'un navigateur la reçoit, statut compris (404). */
function pageHtml(request: APIRequestContext, chemin: string): Promise<APIResponse> {
  return request.get(chemin, { failOnStatusCode: false, headers: NAVIGATEUR });
}

/** Réponse telle que Cloudflare l'envoie à un navigateur, sans suivre les redirections. */
function brute(request: APIRequestContext, adresse: string): Promise<APIResponse> {
  return request.get(adresse, { maxRedirects: 0, failOnStatusCode: false, headers: NAVIGATEUR });
}

function cookiesPoses(reponse: APIResponse): string[] {
  return reponse
    .headersArray()
    .filter((entete) => entete.name.toLowerCase() === 'set-cookie')
    .map((entete) => entete.value);
}

/** Fichiers du site référencés par une page HTML ou une feuille de style. */
function fichiersReferences(texte: string): string[] {
  // Les scripts de l'îlot du vérificateur sont dans les attributs component-url et renderer-url.
  const attributs = [...texte.matchAll(/(?:src|href|component-url|renderer-url)="(\/[^"#?]*)"/g)].map((m) => m[1] ?? '');
  const urlCss = [...texte.matchAll(/url\((\/[^)#?]+)\)/g)].map((m) => m[1] ?? '');
  return [...attributs, ...urlCss].filter((chemin) => chemin.length > 1);
}

test('aucun Set-Cookie : pages, 404, fichiers, sitemap, redirections', async ({ request }) => {
  const adresses = new Set<string>([
    ...CHEMINS,
    '/sitemap.xml',
    '/robots.txt',
    '/site.webmanifest',
    '/regles',
    `http://${HOTE}/`,
    `https://www.${HOTE}/`,
    `http://www.${HOTE}/regles/`,
  ]);
  for (const chemin of CHEMINS) {
    const html = await (await pageHtml(request, chemin)).text();
    for (const fichier of fichiersReferences(html)) adresses.add(fichier);
  }
  for (const feuille of [...adresses].filter((adresse) => adresse.endsWith('.css'))) {
    for (const fichier of fichiersReferences(await (await request.get(feuille)).text())) adresses.add(fichier);
  }
  expect([...adresses].some((adresse) => adresse.endsWith('.js'))).toBe(true);
  expect([...adresses].some((adresse) => adresse.endsWith('.woff2'))).toBe(true);
  for (const adresse of adresses) {
    const reponse = await brute(request, adresse);
    expect(reponse.status(), adresse).toBeLessThan(500);
    expect(cookiesPoses(reponse), adresse).toEqual([]);
  }
});

test('aucun cookie dans le navigateur, même après un parcours complet', async ({ page, context }) => {
  await releverViolations(page);
  for (const chemin of CHEMINS) await page.goto(chemin);
  await allerAuRapport(page, { fichier: cheminFixture('01_conforme_word.pdf') });
  expect(await context.cookies()).toEqual([]);
});

test('page inexistante : vraie réponse 404, page du site, non indexée', async ({ request }) => {
  const reponse = await pageHtml(request, '/page-inexistante/');
  expect(reponse.status()).toBe(404);
  expect(reponse.headers()['content-type']).toContain('text/html');
  const html = await reponse.text();
  expect(html).toContain('Cette page n’existe pas');
  expect(html).toMatch(/<meta name="robots" content="noindex">/);
  // Le fichier des en-têtes est lu par Cloudflare, pas servi.
  expect((await brute(request, '/_headers')).status()).toBe(404);
});

test('redirections : barre finale, https, www vers le domaine', async ({ request }) => {
  const sansBarre = await brute(request, '/regles');
  expect([301, 307, 308]).toContain(sansBarre.status());
  expect(new URL(sansBarre.headers()['location'] ?? '', SITE.url).href).toBe(`${SITE.url}/regles/`);

  // Vers https, sans réglage de la zone : règle de redirection (docs/LANCEMENT.md).
  const httpRacine = await brute(request, `http://${HOTE}/`);
  expect([301, 308]).toContain(httpRacine.status());
  expect(httpRacine.headers()['location']).toBe(`${SITE.url}/`);
  const http = await brute(request, `http://${HOTE}/regles/?a=1`);
  expect([301, 308]).toContain(http.status());
  expect(http.headers()['location']).toBe(`${SITE.url}/regles/?a=1`);

  const www = await brute(request, `https://www.${HOTE}/regles/?a=1`);
  expect(www.status()).toBe(301);
  expect(www.headers()['location']).toBe(`${SITE.url}/regles/?a=1`);

  const depuisHttpWww = await request.get(`http://www.${HOTE}/regles/`, { headers: NAVIGATEUR });
  expect(depuisHttpWww.status()).toBe(200);
  expect(depuisHttpWww.url()).toBe(`${SITE.url}/regles/`);
});

test('sitemap.xml et robots.txt sur le domaine définitif', async ({ request }) => {
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.headers()['content-type']).toContain('xml');
  const adresses = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(adresses).toEqual(PAGES.filter(estIndexee).map((page) => `${SITE.url}${page.chemin}`));

  const robots = await request.get('/robots.txt');
  expect(robots.headers()['content-type']).toContain('text/plain');
  // Identique à celui du site : le robots.txt géré de Cloudflare n'y ajoute rien.
  expect(await robots.text()).toBe(texteRobots());
});

test('en-têtes de sécurité sur chaque page, cache long sur les fichiers du build', async ({ request }) => {
  for (const chemin of CHEMINS) {
    const entetes = (await pageHtml(request, chemin)).headers();
    expect(entetes['strict-transport-security'], chemin).toContain('max-age=31536000');
    expect(entetes['x-content-type-options'], chemin).toBe('nosniff');
    expect(entetes['referrer-policy'], chemin).toBe('strict-origin-when-cross-origin');
    expect(entetes['content-security-policy'], chemin).toContain("frame-ancestors 'none'");
    expect(entetes['permissions-policy'], chemin).toContain('camera=()');
    expect(entetes['cross-origin-opener-policy'], chemin).toBe('same-origin');
  }
  const html = await (await pageHtml(request, PAGES_DU_SITE.verifier.chemin)).text();
  const script = fichiersReferences(html).find((fichier) => /^\/_astro\/.+\.js$/.test(fichier));
  expect(script).toBeDefined();
  expect((await request.get(script ?? '')).headers()['cache-control']).toContain('immutable');
});

test('HTML tel que livré : aucune injection de Cloudflare, statistiques hors du vérificateur, adresses du domaine', async ({
  request,
}) => {
  for (const chemin of CHEMINS) {
    const html = await (await pageHtml(request, chemin)).text();
    expect(html, chemin).not.toContain('/cdn-cgi/');
    expect(html, chemin).toContain('<meta http-equiv="content-security-policy"');
    // Exactement la balise du site : aucune ajoutée par la configuration automatique de Cloudflare
    // (beacon.min.js/v…). L'adresse figure aussi dans la politique de sécurité : seules les balises comptent.
    const balises = [...html.matchAll(/<script\b[^>]*\bsrc=["']?(https:\/\/static\.cloudflareinsights\.com\/[^"'\s>]*)/g)].map((m) => m[1]);
    const attendues = statistiquesActives() && chemin !== PAGES_DU_SITE.verifier.chemin ? [SITE.statistiques.script] : [];
    expect(balises, chemin).toEqual(attendues);
    expect(html, chemin).toContain(`content="${SITE.url}/og-image.png"`);
  }
  for (const page of PAGES.filter(estIndexee)) {
    const html = await (await pageHtml(request, page.chemin)).text();
    expect(html, page.chemin).toContain(`<link rel="canonical" href="${SITE.url}${page.chemin}">`);
  }
});

test('adresse de contact en clair, sans obfuscation de Cloudflare ni script email-decode', async ({ page, request }) => {
  const scripts: string[] = [];
  page.on('request', (requete) => {
    if (requete.resourceType() === 'script') scripts.push(requete.url());
  });
  await releverViolations(page);
  for (const infos of [PAGES_DU_SITE.mentionsLegales, PAGES_DU_SITE.confidentialite]) {
    const html = await (await pageHtml(request, infos.chemin)).text();
    // Les commentaires <!--email_off--> sont contrôlés au build ; Cloudflare peut les retirer.
    expect(html, infos.chemin).toContain(`<a href="mailto:${SITE.contact}">${SITE.contact}</a>`);
    expect(html, infos.chemin).not.toMatch(/email-decode|email-protection|__cf_email__|\[email&#160;protected\]|\[email protected\]/);

    await page.goto(infos.chemin);
    const liens = page.getByRole('main').getByRole('link', { name: SITE.contact, exact: true });
    await expect(liens.first()).toBeVisible();
    for (const lien of await liens.all()) await expect(lien).toHaveAttribute('href', `mailto:${SITE.contact}`);
  }
  expect(scripts.filter((adresse) => adresse.includes('email-decode'))).toEqual([]);
});

test('aucune violation de la politique de sécurité sur les pages en ligne', async ({ page }) => {
  const violations = await releverViolations(page);
  for (const chemin of CHEMINS) {
    await page.goto(chemin);
    await page.waitForLoadState('networkidle');
    expect(await violations(), chemin).toEqual([]);
  }
});

test('la vraie balise de statistiques respecte la politique de sécurité, sans cookie', async ({ page, context }) => {
  test.skip(!statistiquesActives(), 'Jeton de la balise de statistiques pas encore renseigné');
  // Une seule visite comptée par passage : l'accueil, avec le vrai script de Cloudflare.
  const violations = await releverViolations(page, { baliseReelle: true });
  const script = page.waitForResponse(SITE.statistiques.script);
  await page.goto('/');
  expect((await script).status()).toBe(200);
  await page.waitForLoadState('networkidle');
  expect(await violations()).toEqual([]);
  expect(await context.cookies()).toEqual([]);
});

test('analyse en ligne : le PDF est lu dans le navigateur et rien n’est envoyé', async ({ page, baseURL }) => {
  const origine = new URL(baseURL ?? SITE.url).origin;
  const requetes: Request[] = [];
  page.on('request', (requete) => requetes.push(requete));
  const violations = await releverViolations(page);

  await allerAuRapport(page, { fichier: cheminFixture('01_conforme_word.pdf') });
  expect((await controlesDuRapport(page)).filter((controle) => controle.gravite === 'erreur')).toEqual([]);

  await allerAuRapport(page, { fichier: cheminFixture('04_marges_2cm_word.pdf') });
  expect(await controlesDuRapport(page)).toContainEqual({ id: 'R08', gravite: 'erreur' });
  const apercu = page.locator('[data-regle="R08"] .v-apercu-page');
  await expect(apercu.locator('img')).toHaveAttribute('src', /^blob:/);
  await expect(apercu.locator('.v-zone')).toHaveCount(2);

  for (const requete of requetes) {
    if (/^(blob|data):/.test(requete.url())) continue;
    expect(new URL(requete.url()).origin, requete.url()).toBe(origine);
    expect(requete.method(), requete.url()).toBe('GET');
    expect(requete.postDataBuffer(), requete.url()).toBeNull();
  }
  expect(await violations()).toEqual([]);
});

test('impression du rapport : le rapport seul, avec l’adresse des sources', async ({ page }) => {
  await allerAuRapport(page, { fichier: cheminFixture('02_partie1_3pages.pdf') });
  await page.emulateMedia({ media: 'print' });
  await expect(page.getByRole('heading', { name: 'Rapport de vérification' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Imprimer le rapport' })).toBeHidden();
  await expect(page.locator('.v-etapes')).toBeHidden();
  await expect(page.getByText('Outil indépendant, non affilié au ministère de l’Éducation nationale.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sources citées' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'À vérifier vous-même' })).toBeVisible();
});
