import { describe, expect, it } from 'vitest';
import { estTitre, normaliser, rechercher, texteDePage } from '../../src/checker/recherche';
import { pageDeLignes } from '../helpers/document-synthetique';

const PHRASE_PLEINE = 'Cette ligne de texte courant occupe toute la largeur de la page, comme une ligne justifiée, puis la phrase continue';

describe('normaliser', () => {
  it('retire accents et majuscules, unifie apostrophes, tirets et espaces', () => {
    expect(normaliser('Table des  Matières')).toBe('table des matieres');
    expect(normaliser('Rapport d’inspection')).toBe("rapport d'inspection");
    expect(normaliser('visite–conseil')).toBe('visite-conseil');
  });
});

describe('texteDePage et rechercher', () => {
  it('retrouve une expression coupée en fin de ligne', () => {
    const page = texteDePage(pageDeLignes(3, [`${PHRASE_PLEINE} lors de la visite-`, 'conseil de mars.'], null));
    const [occurrence] = rechercher(page, /visites?\s?-?\s?conseils?/);
    expect(occurrence?.ligne).toBe(0);
  });

  it('situe chaque occurrence dans sa ligne', () => {
    const page = texteDePage(pageDeLignes(3, ['Introduction', 'Le sommaire du manuel.'], null));
    expect(rechercher(page, /sommaire/)).toEqual([{ trouve: 'sommaire', ligne: 1, positionDansLigne: 3 }]);
  });
});

describe('estTitre', () => {
  it('ligne courte en début de paragraphe, sans point final', () => {
    const { lignes } = texteDePage(
      pageDeLignes(3, ['Rapport d’inspection du 12 mars 2025', PHRASE_PLEINE, 'fin du paragraphe.', 'Une phrase courte.'], null),
    );
    expect(lignes.map((_, i) => estTitre(lignes, i))).toEqual([true, false, false, false]);
  });
});
