import { describe, expect, it } from 'vitest';
import { listePages } from '../../src/content/rules.fr';
import { majoritaire, mediane, regrouperEnLignes } from '../../src/checker/texte';
import type { BlocTexte, PageModele } from '../../src/checker/types';

function bloc(texte: string, x: number, y: number, taille = 11, police = 'ArialMT'): BlocTexte {
  return { texte, police, policeBrute: police, taille, couleur: '#000000', x, y, largeur: texte.length * 5, hauteur: taille * 1.117 };
}

function page(blocs: BlocTexte[]): PageModele {
  return { numero: 2, largeur: 595.28, hauteur: 841.89, rotation: 0, blocs, liens: [], images: [] };
}

describe('regrouperEnLignes', () => {
  it('regroupe les blocs d’une même ligne et trie les lignes de haut en bas', () => {
    const lignes = regrouperEnLignes(
      page([bloc('suite', 200, 100), bloc('Seconde ligne', 71, 112.65), bloc('Première', 71, 100)]),
    );
    expect(lignes.map((l) => l.texte)).toEqual(['Première suite', 'Seconde ligne']);
    expect(lignes[0]?.xDebut).toBe(71);
    expect(lignes[0]?.taille).toBe(11);
  });

  it('garde un exposant sur sa ligne et retient la taille du bloc principal', () => {
    const [ligne, ...reste] = regrouperEnLignes(page([bloc('Le 1', 71, 100), bloc('er', 86, 98, 7), bloc('trimestre de l’année', 96, 100)]));
    expect(reste).toHaveLength(0);
    expect(ligne?.texte).toBe('Le 1 er trimestre de l’année');
    expect(ligne?.taille).toBe(11);
  });

  it('ignore les blocs vides', () => {
    expect(regrouperEnLignes(page([bloc('   ', 71, 100)]))).toEqual([]);
  });
});

describe('majoritaire et mediane', () => {
  it('pondère par le nombre de caractères visibles', () => {
    const blocs = [bloc('Titre', 71, 100, 14), bloc('Un long paragraphe de texte courant', 71, 120)];
    expect(majoritaire(blocs, (b) => b.taille)).toBe(11);
  });

  it('médiane d’une liste paire, impaire ou vide', () => {
    expect(mediane([3, 1, 2])).toBe(2);
    expect(mediane([4, 1, 2, 3])).toBe(2.5);
    expect(mediane([])).toBeUndefined();
  });
});

describe('listePages', () => {
  it.each([
    [[3], 'page 3'],
    [[2, 3], 'pages 2 et 3'],
    [[2, 3, 4, 5, 6, 7, 8, 9], 'pages 2 à 9'],
    [[2, 3, 4, 7], 'pages 2 à 4 et 7'],
    [[9, 3, 5, 3], 'pages 3, 5 et 9'],
  ])('%j → %s', (pages, texte) => {
    expect(listePages(pages)).toBe(texte);
  });
});
