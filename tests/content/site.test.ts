import { describe, expect, it } from 'vitest';
import { A_COMPLETER, champsACompleter, inscriptionActive, PAGES_DU_SITE, SITE, titreDOnglet, urlAbsolue } from '../../src/content/site';
import { erreursTypographiques } from '../helpers/typographie';

describe('identité du site (src/content/site.ts)', () => {
  it('nom et sous-titre définitifs', () => {
    expect(SITE.nom).toBe('Au propre');
    expect(SITE.sousTitre).toBe('Vérifiez votre dossier RAEP avant le dépôt');
  });

  it('liste les champs encore « à compléter », bloquants pour la mise en ligne', () => {
    const attendus = Object.entries({
      domaine: SITE.domaineDefinitif ? SITE.url : A_COMPLETER,
      'éditeur (nom)': SITE.editeur.nom,
      'éditeur (statut)': SITE.editeur.statut,
      contact: SITE.contact,
      'directeur de la publication': SITE.directeurPublication,
    })
      .filter(([, valeur]) => valeur === A_COMPLETER)
      .map(([nom]) => nom);
    expect(champsACompleter()).toEqual(attendus);
  });

  it('le domaine reste à compléter tant que l’adresse est provisoire', () => {
    expect(SITE.domaineDefinitif).toBe(false);
    expect(champsACompleter()).toContain('domaine');
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
