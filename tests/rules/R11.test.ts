import { describe, expect, it } from 'vitest';
import { A4, TOLERANCE_PT } from '../../src/checker/measure';
import { verifierR11 } from '../../src/checker/rules/R11-format-a4';
import type { Decoupage } from '../../src/checker/types';
import { documentSynthetique } from '../helpers/document-synthetique';
import { chargerFixture, FIXTURES_TEXTE, DECOUPAGES } from '../helpers/fixtures';
import { attendreTextesEtSourcesS1S2 } from '../helpers/sources';

const LETTER = [612, 792] as const;

const DECOUPAGE: Decoupage = {
  couverture: { debut: 1, fin: 1 },
  partie1: { debut: 2, fin: 3 },
  partie2: { debut: 4, fin: 9 },
  annexes: { debut: 10, fin: 11 },
};

describe('R11 : format A4', () => {
  it.each(FIXTURES_TEXTE)('%s : conforme', async (nom) => {
    const document = await chargerFixture(nom);
    const resultats = verifierR11(document, DECOUPAGES[nom]);
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
    expect(resultats[0]?.detail).toContain(`${document.pages.length}\u00A0pages`);
    attendreTextesEtSourcesS1S2(resultats);
  });

  it('page Letter en partie 2 : erreur, avec la taille mesurée', () => {
    const resultats = verifierR11(documentSynthetique(11, { formats: { 5: LETTER } }), DECOUPAGE);
    expect(resultats).toHaveLength(1);
    expect(resultats[0]).toMatchObject({ gravite: 'erreur', pages: [5] });
    expect(resultats[0]?.detail).toContain('page\u00A05\u00A0: 21,59 × 27,94\u00A0cm');
    attendreTextesEtSourcesS1S2(resultats);
  });

  it('page Letter en annexe : avertissement seulement', () => {
    const resultats = verifierR11(documentSynthetique(11, { formats: { 11: LETTER } }), DECOUPAGE);
    expect(resultats.map((r) => [r.gravite, r.pages])).toEqual([['avertissement', [11]]]);
    attendreTextesEtSourcesS1S2(resultats);
  });

  it('erreur et avertissement ensemble, pages de même format regroupées', () => {
    const resultats = verifierR11(
      documentSynthetique(11, { formats: { 2: LETTER, 3: LETTER, 1: LETTER } }),
      DECOUPAGE,
    );
    expect(resultats.map((r) => [r.gravite, r.pages])).toEqual([
      ['erreur', [2, 3]],
      ['avertissement', [1]],
    ]);
    expect(resultats[0]?.detail).toContain('pages 2 et 3\u00A0: 21,59 × 27,94\u00A0cm');
  });

  it('A4 paysage : conforme', () => {
    const resultats = verifierR11(documentSynthetique(11, { formats: { 4: [A4.hauteur, A4.largeur] } }), DECOUPAGE);
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
  });

  it('tolérance de 2 pt : 1,9 pt d’écart conforme, 2,1 pt erreur', () => {
    const presque = verifierR11(
      documentSynthetique(11, { formats: { 4: [A4.largeur + TOLERANCE_PT - 0.1, A4.hauteur] } }),
      DECOUPAGE,
    );
    const hors = verifierR11(
      documentSynthetique(11, { formats: { 4: [A4.largeur + TOLERANCE_PT + 0.1, A4.hauteur] } }),
      DECOUPAGE,
    );
    expect(presque.map((r) => r.gravite)).toEqual(['conforme']);
    expect(hors.map((r) => r.gravite)).toEqual(['erreur']);
  });
});
