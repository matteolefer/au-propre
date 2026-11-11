import { describe, expect, it } from 'vitest';
import {
  champsACompleter,
  estIndexee,
  inscriptionActive,
  PAGES_DU_SITE,
  SITE,
  statistiquesActives,
  texteRobots,
  titreDOnglet,
  urlAbsolue,
} from '../../src/content/site';
import { erreursTypographiques } from '../helpers/typographie';

describe('identité du site (src/content/site.ts)', () => {
  it('nom et sous-titre définitifs', () => {
    expect(SITE.nom).toBe('Au propre');
    expect(SITE.sousTitre).toBe('Vérifiez votre dossier RAEP avant le dépôt');
  });

  it('aucun champ « à compléter » : le site peut être mis en ligne', () => {
    expect(champsACompleter()).toEqual([]);
  });

  it('domaine définitif, sans www ni barre finale', () => {
    expect(SITE.url).toBe('https://au-propre.fr');
    expect(SITE.domaineDefinitif).toBe(true);
  });

  it('éditeur anonyme : aucun nom de personne, fondement légal cité (LCEN, art. 1-1, II)', () => {
    expect(SITE.editeur).toEqual({
      statut: 'Particulier, à titre non professionnel',
      anonymat: {
        libelle: 'article 1-1, II de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique (LCEN)',
        url: 'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000801164',
      },
    });
    expect(SITE).not.toHaveProperty('directeurPublication');
    expect(SITE.contact).toBe('contact@au-propre.fr');
  });

  it('hébergeur repris de la politique de confidentialité de Cloudflare, source citée', () => {
    expect(SITE.hebergeur).toMatchObject({
      nom: 'Cloudflare, Inc.',
      adresse: '101 Townsend St., San Francisco, CA 94107, États-Unis',
      telephone: '+1 (650) 319-8930',
    });
    expect(SITE.hebergeur.source.url).toBe('https://www.cloudflare.com/policies/privacy/');
  });

  it('mentions légales en noindex ; les autres pages publiques sont indexées', () => {
    const nonIndexees = Object.values(PAGES_DU_SITE)
      .filter((page) => !estIndexee(page))
      .map((page) => page.chemin);
    expect(nonIndexees).toEqual(['/mentions-legales/']);
  });

  it('statistiques actives seulement avec un jeton de balise valide', () => {
    expect(statistiquesActives('')).toBe(false);
    expect(statistiquesActives('pas-un-jeton')).toBe(false);
    expect(statistiquesActives('0123456789abcdef0123456789abcdef')).toBe(true);
    expect(SITE.statistiques.script).toBe('https://static.cloudflareinsights.com/beacon.min.js');
  });

  it('logo horizontal clair (IDENTITE.md), au moins 120 px de large à 36 px de haut', () => {
    expect(SITE.logo?.chemin).toBe('/brand/logo-clair.svg');
    const { largeur = 0, hauteur = 1 } = SITE.logo ?? {};
    expect((largeur / hauteur) * 36).toBeGreaterThanOrEqual(120);
  });

  it('inscription active seulement avec une adresse https', () => {
    expect(inscriptionActive('')).toBe(false);
    expect(inscriptionActive('http://exemple.fr/formulaire')).toBe(false);
    expect(inscriptionActive('https://exemple.fr/formulaire')).toBe(true);
  });

  it('conservation des adresses d’inscription sourcée par la CNIL', () => {
    expect(SITE.inscription.conservationSource.url).toMatch(/^https:\/\/www\.cnil\.fr\/.+gestion-activites-commerciales\.pdf$/);
  });

  it('robots.txt : tout le site, et le plan du site sur le domaine définitif', () => {
    expect(texteRobots()).toBe('User-agent: *\nAllow: /\n\nSitemap: https://au-propre.fr/sitemap.xml\n');
  });

  it('adresses absolues et titres d’onglet', () => {
    expect(urlAbsolue('/regles/')).toBe(`${SITE.url}/regles/`);
    expect(urlAbsolue('/')).toBe(`${SITE.url}/`);
    expect(titreDOnglet('Confidentialité')).toBe('Confidentialité – Au propre');
    expect(titreDOnglet(PAGES_DU_SITE.accueil.titre)).toBe('Au propre – Vérifiez votre dossier RAEP avant le dépôt');
  });

  it.each(Object.entries(PAGES_DU_SITE))('%s : titre et description courts, en français correct', (_cle, page) => {
    expect(page.chemin).toMatch(/^\/([a-z-]+\/)?$/);
    expect(titreDOnglet(page.titre).length).toBeLessThanOrEqual(65);
    expect(page.description.length).toBeGreaterThanOrEqual(50);
    expect(page.description.length).toBeLessThanOrEqual(160);
    expect(erreursTypographiques(`${page.titre} ${page.description}`)).toEqual([]);
  });

  it('aucun mot qui laisserait croire à un site du ministère dans le nom', () => {
    expect(SITE.nom).not.toMatch(/officiel|gouv|ministère/i);
  });
});
