import { describe, expect, it } from 'vitest';
import { OPS } from 'pdfjs-dist';
import { extraireDocument, ErreurExtraction, parcourirOperateurs } from '../../src/checker/extract';
import { A4, cmEnPt, pagesDe, ptEnCm } from '../../src/checker/measure';
import type { BlocTexte, ModeleDocument } from '../../src/checker/types';
import { chargerFixture, DECOUPAGES, FIXTURES_TEXTE, type FixtureTexte } from '../helpers/fixtures';

function blocsDesParties(document: ModeleDocument, nom: FixtureTexte): BlocTexte[] {
  const { partie1, partie2 } = DECOUPAGES[nom];
  return [...pagesDe(partie1), ...pagesDe(partie2)].flatMap((n) => document.pages[n - 1]?.blocs ?? []);
}

/** Valeur la plus fréquente, pondérée par le nombre de caractères. */
function majoritaire(blocs: readonly BlocTexte[], cle: (bloc: BlocTexte) => string): string | undefined {
  const comptes = new Map<string, number>();
  for (const bloc of blocs) comptes.set(cle(bloc), (comptes.get(cle(bloc)) ?? 0) + bloc.texte.length);
  return [...comptes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

function premierePageContenant(document: ModeleDocument, texte: string): number | undefined {
  return document.pages.find((page) => page.blocs.some((bloc) => bloc.texte.includes(texte)))?.numero;
}

/**
 * Marges gauche et droite minimales des parties, en cm, hors pied de page
 * (même méthode que outils/mesurer_pdf.py).
 */
function marges(document: ModeleDocument, nom: FixtureTexte): { gauche: number; droite: number } {
  const { partie1, partie2 } = DECOUPAGES[nom];
  let gauche = Infinity;
  let droite = Infinity;
  for (const numero of [...pagesDe(partie1), ...pagesDe(partie2)]) {
    const page = document.pages[numero - 1];
    if (!page) continue;
    for (const bloc of page.blocs) {
      if (bloc.y + bloc.hauteur >= page.hauteur - cmEnPt(2)) continue;
      gauche = Math.min(gauche, bloc.x);
      droite = Math.min(droite, page.largeur - (bloc.x + bloc.largeur));
    }
  }
  return { gauche: ptEnCm(gauche), droite: ptEnCm(droite) };
}

describe('extraireDocument sur les fixtures LibreOffice', () => {
  it.each([
    ['01_conforme', 11],
    ['02_partie1_3pages', 12],
    ['03_calibri', 11],
    ['04_marges_2cm', 11],
    ['05_scanne', 11],
  ] as const)('%s : %i pages au format A4', async (nom, nombrePages) => {
    const document = await chargerFixture(nom);
    expect(document.pages).toHaveLength(nombrePages);
    for (const page of document.pages) {
      expect(page.largeur).toBeCloseTo(nom === '05_scanne' ? 595.68 : A4.largeur, 0);
      expect(page.hauteur).toBeCloseTo(nom === '05_scanne' ? 841.92 : A4.hauteur, 0);
      expect(page.rotation).toBe(0);
    }
  });

  it.each(FIXTURES_TEXTE)('%s : les titres des parties tombent sur les pages du découpage', async (nom) => {
    const document = await chargerFixture(nom);
    const decoupage = DECOUPAGES[nom];
    expect(document.contientTexte).toBe(true);
    expect(premierePageContenant(document, 'Première partie')).toBe(decoupage.partie1.debut);
    expect(premierePageContenant(document, 'Seconde partie')).toBe(decoupage.partie2.debut);
    expect(premierePageContenant(document, 'Annexe 1')).toBe(decoupage.annexes?.debut);
  });

  it.each([
    ['01_conforme', 'LiberationSans'],
    ['02_partie1_3pages', 'LiberationSans'],
    ['03_calibri', 'Carlito-Regular'],
    ['04_marges_2cm', 'LiberationSans'],
  ] as const)('%s : police majoritaire %s (nom PostScript sans préfixe de sous-ensemble)', async (nom, police) => {
    const blocs = blocsDesParties(await chargerFixture(nom), nom);
    expect(majoritaire(blocs, (bloc) => bloc.police)).toBe(police);
    expect(blocs.every((bloc) => /^[A-Z]{6}\+/.test(bloc.policeBrute))).toBe(true);
    expect(blocs.some((bloc) => /^[A-Z]{6}\+/.test(bloc.police))).toBe(false);
  });

  it.each(FIXTURES_TEXTE)('%s : texte en 11 pt et en noir', async (nom) => {
    const blocs = blocsDesParties(await chargerFixture(nom), nom);
    expect(Number(majoritaire(blocs, (bloc) => bloc.taille.toFixed(1)))).toBe(11);
    expect(blocs.every((bloc) => bloc.couleur === '#000000')).toBe(true);
  });

  it.each([
    ['01_conforme', 2.5, 2.48],
    ['04_marges_2cm', 2.0, 1.97],
  ] as const)('%s : marges gauche %f cm et droite %f cm (mesures de référence)', async (nom, gauche, droite) => {
    const mesure = marges(await chargerFixture(nom), nom);
    expect(Math.abs(mesure.gauche - gauche)).toBeLessThanOrEqual(0.05);
    expect(Math.abs(mesure.droite - droite)).toBeLessThanOrEqual(0.05);
  });

  it('05_scanne : aucune couche texte, une image pleine page sur chaque page', async () => {
    const document = await chargerFixture('05_scanne');
    expect(document.contientTexte).toBe(false);
    for (const page of document.pages) {
      expect(page.blocs).toHaveLength(0);
      expect(page.images).toHaveLength(1);
      const [image] = page.images;
      expect(image?.largeur).toBeCloseTo(page.largeur, 0);
      expect(image?.hauteur).toBeCloseTo(page.hauteur, 0);
    }
  });

  it('refuse un fichier qui n’est pas un PDF', async () => {
    const promesse = extraireDocument(new TextEncoder().encode('ceci n’est pas un PDF'));
    await expect(promesse).rejects.toBeInstanceOf(ErreurExtraction);
    await expect(promesse).rejects.toMatchObject({ raison: 'pdf-invalide' });
  });
});

describe('parcourirOperateurs', () => {
  const vue = [1, 0, 0, -1, 0, 800] as [number, number, number, number, number, number];
  const glyphes = (texte: string) => [Array.from(texte).map((unicode) => ({ unicode }))];

  it('suit la couleur de remplissage à travers save et restore', () => {
    const { sequences } = parcourirOperateurs(
      [OPS.showText, OPS.save, OPS.setFillRGBColor, OPS.showText, OPS.restore, OPS.showText],
      [glyphes('noir'), null, ['#C00000'], glyphes('rouge'), null, glyphes('noir')],
      vue,
    );
    expect(sequences).toEqual([
      { texte: 'noir', couleur: '#000000' },
      { texte: 'rouge', couleur: '#c00000' },
      { texte: 'noir', couleur: '#000000' },
    ]);
  });

  it('calcule la boîte d’une image à partir de la matrice courante', () => {
    const { images } = parcourirOperateurs(
      [OPS.save, OPS.transform, OPS.paintImageXObject, OPS.restore],
      [null, [200, 0, 0, 100, 50, 600], ['img', 10, 10], null],
      vue,
    );
    expect(images).toEqual([{ x: 50, y: 100, largeur: 200, hauteur: 100 }]);
  });
});
