import { describe, expect, it } from 'vitest';
import { construireDecoupage, proposerDecoupage, sectionDeLaPage } from '../../src/checker/split';
import type { ModeleDocument, PageModele } from '../../src/checker/types';
import { aDroite, documentSynthetique, pageCouverture, pageDeLignes, pageStandard } from '../helpers/document-synthetique';
import { chargerFixture, DECOUPAGES, FIXTURES_TEXTE } from '../helpers/fixtures';

const PHRASE = 'Texte d’un paragraphe du dossier, écrit pour les tests, assez long pour occuper toute la ligne.';

/** Page dont la première ligne est un titre, suivie d'un paragraphe. */
function pageTitree(numero: number, titre: string): PageModele {
  return pageDeLignes(numero, [titre, PHRASE, PHRASE, 'Fin du paragraphe.']);
}

function dossier(pages: readonly PageModele[]): ModeleDocument {
  return { pages: pages.map((page, i) => ({ ...page, numero: i + 1 })), contientTexte: true };
}

/** Dossier de 11 pages avec les titres donnés en tête des pages 2, 4 et 10. */
function dossierTitre(titres: { partie1?: string; partie2?: string; annexes?: string }): ModeleDocument {
  return dossier(
    Array.from({ length: 11 }, (_, i) => {
      const numero = i + 1;
      if (numero === 1) return pageCouverture();
      const titre = numero === 2 ? titres.partie1 : numero === 4 ? titres.partie2 : numero === 10 ? titres.annexes : undefined;
      return titre ? pageTitree(numero, titre) : pageStandard(numero);
    }),
  );
}

describe('proposerDecoupage', () => {
  it.each(FIXTURES_TEXTE)('%s : retrouve le découpage du README d’après les titres', async (nom) => {
    const document = await chargerFixture(nom);
    const proposition = proposerDecoupage(document);
    expect(proposition.origines).toEqual({ partie1: 'detecte', partie2: 'detecte', annexes: 'detecte' });
    const resultat = construireDecoupage(proposition.debuts, document.pages.length);
    expect(resultat).toEqual({ ok: true, decoupage: DECOUPAGES[nom] });
  });

  it.each([
    ['PREMIÈRE PARTIE', 'DEUXIÈME PARTIE', 'ANNEXES'],
    ['1re partie : mon parcours', '2e partie : une réalisation', 'Annexe n° 1 - grille'],
    ['I. Première partie', 'II. Seconde partie', 'Annexe A : fiche'],
    ['Partie 1 – Parcours', 'Partie 2 – Analyse', 'Annexe 1'],
  ])('reconnaît « %s », « %s », « %s »', (partie1, partie2, annexes) => {
    const proposition = proposerDecoupage(dossierTitre({ partie1, partie2, annexes }));
    expect(proposition.debuts).toEqual({ partie1: 2, partie2: 4, annexes: 10 });
    expect(proposition.origines).toEqual({ partie1: 'detecte', partie2: 'detecte', annexes: 'detecte' });
  });

  it('ignore « première partie » cité au début d’une phrase sans ponctuation', () => {
    const document = dossierTitre({ partie2: 'Seconde partie', annexes: 'Annexes' });
    const pages = document.pages.map((page) =>
      page.numero === 3 ? pageDeLignes(3, ['Première partie de ma carrière en collège, puis en lycée professionnel', PHRASE]) : page,
    );
    const proposition = proposerDecoupage({ ...document, pages });
    expect(proposition.origines.partie1).toBe('suppose');
    expect(proposition.debuts.partie1).toBe(2);
  });

  it('ignore une annexe citée au milieu de la partie 2 ou listée en bas de page', () => {
    const document = dossierTitre({ partie1: 'Première partie', partie2: 'Seconde partie', annexes: 'Annexe 1 : fiche' });
    const pages = document.pages.map((page) =>
      page.numero === 6
        ? pageDeLignes(6, [PHRASE, PHRASE, 'Fin.', 'Annexe 3 montre la progression des élèves.', PHRASE, 'Fin.', 'Annexe 1 : fiche d’activité'])
        : page,
    );
    expect(proposerDecoupage({ ...document, pages }).debuts.annexes).toBe(10);
  });

  it('ignore les entrées d’un sommaire en page 2', () => {
    const sommaire = pageDeLignes(2, [
      'Sommaire',
      'Première partie ........ 3',
      [{ texte: 'Seconde partie' }, aDroite('5')],
      'Annexes ........ 11',
    ]);
    const pages = [
      pageCouverture(),
      sommaire,
      pageTitree(3, 'Première partie'),
      pageStandard(4),
      pageTitree(5, 'Seconde partie'),
      ...Array.from({ length: 5 }, (_, i) => pageStandard(6 + i)),
      pageTitree(11, 'Annexes'),
    ];
    expect(proposerDecoupage(dossier(pages)).debuts).toEqual({ partie1: 3, partie2: 5, annexes: 11 });
  });

  it('sans aucun titre : structure courante, marquée « supposée »', () => {
    const proposition = proposerDecoupage(documentSynthetique(12));
    expect(proposition.debuts).toEqual({ partie1: 2, partie2: 4, annexes: 10 });
    expect(proposition.origines).toEqual({ partie1: 'suppose', partie2: 'suppose', annexes: 'suppose' });
  });

  it('sans titre et sans place pour des annexes : pas d’annexes', () => {
    expect(proposerDecoupage(documentSynthetique(9)).debuts).toEqual({ partie1: 2, partie2: 4, annexes: null });
  });

  it('annexes scannées (sans texte) : supposées après 6 pages de partie 2', () => {
    const document = dossierTitre({ partie1: 'Première partie', partie2: 'Seconde partie' });
    const proposition = proposerDecoupage(document);
    expect(proposition.debuts).toEqual({ partie1: 2, partie2: 4, annexes: 10 });
    expect(proposition.origines.annexes).toBe('suppose');
  });

  it('document d’une page : propositions bornées à la page 1', () => {
    expect(proposerDecoupage(documentSynthetique(1)).debuts).toEqual({ partie1: 1, partie2: 1, annexes: null });
  });
});

describe('construireDecoupage', () => {
  it('couverture avant la partie 1, annexes jusqu’à la fin', () => {
    expect(construireDecoupage({ partie1: 2, partie2: 4, annexes: 10 }, 12)).toEqual({
      ok: true,
      decoupage: {
        couverture: { debut: 1, fin: 1 },
        partie1: { debut: 2, fin: 3 },
        partie2: { debut: 4, fin: 9 },
        annexes: { debut: 10, fin: 12 },
      },
    });
  });

  it('sans couverture ni annexes', () => {
    expect(construireDecoupage({ partie1: 1, partie2: 3, annexes: null }, 8)).toEqual({
      ok: true,
      decoupage: { couverture: null, partie1: { debut: 1, fin: 2 }, partie2: { debut: 3, fin: 8 }, annexes: null },
    });
  });

  it('refuse une partie 2 qui ne suit pas la partie 1', () => {
    expect(construireDecoupage({ partie1: 4, partie2: 4, annexes: null }, 10)).toEqual({
      ok: false,
      erreurs: [{ champ: 'partie2', code: 'partie2-avant-partie1' }],
    });
  });

  it('refuse des annexes qui ne suivent pas la partie 2', () => {
    expect(construireDecoupage({ partie1: 2, partie2: 4, annexes: 3 }, 10)).toEqual({
      ok: false,
      erreurs: [{ champ: 'annexes', code: 'annexes-avant-partie2' }],
    });
  });

  it('refuse une page hors du document', () => {
    expect(construireDecoupage({ partie1: 0, partie2: 12, annexes: 13 }, 11)).toEqual({
      ok: false,
      erreurs: [
        { champ: 'partie1', code: 'hors-document' },
        { champ: 'partie2', code: 'hors-document' },
        { champ: 'annexes', code: 'hors-document' },
      ],
    });
  });
});

describe('sectionDeLaPage', () => {
  it('range chaque page dans sa section', () => {
    const decoupage = DECOUPAGES['01_conforme'];
    expect([1, 2, 3, 4, 9, 10, 11].map((n) => sectionDeLaPage(n, decoupage))).toEqual([
      'couverture',
      'partie1',
      'partie1',
      'partie2',
      'partie2',
      'annexes',
      'annexes',
    ]);
  });
});
