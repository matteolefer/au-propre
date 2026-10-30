import { describe, expect, it } from 'vitest';
import { verifierR02 } from '../../src/checker/rules/R02-partie1-pages';
import { documentSynthetique } from '../helpers/document-synthetique';
import { chargerFixture, DECOUPAGES, FIXTURES_TEXTE } from '../helpers/fixtures';
import { attendreTextesEtSourcesS1S2 } from '../helpers/sources';

describe('R02 : partie 1, 2 pages maximum', () => {
  it('02_partie1_3pages : erreur sur les pages 2 à 4', async () => {
    const resultats = verifierR02(await chargerFixture('02_partie1_3pages'), DECOUPAGES['02_partie1_3pages']);
    expect(resultats).toHaveLength(1);
    expect(resultats[0]).toMatchObject({ id: 'R02', gravite: 'erreur', pages: [2, 3, 4] });
    expect(resultats[0]?.detail).toContain('3\u00A0pages (pages 2 à 4)');
    attendreTextesEtSourcesS1S2(resultats);
  });

  it.each(FIXTURES_TEXTE.filter((nom) => !nom.startsWith('02_')))('%s : conforme', async (nom) => {
    const resultats = verifierR02(await chargerFixture(nom), DECOUPAGES[nom]);
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
    attendreTextesEtSourcesS1S2(resultats);
  });

  it('signale une page vide qui fait dépasser la limite', () => {
    const decoupage = { couverture: null, partie1: { debut: 1, fin: 3 }, partie2: { debut: 4, fin: 9 }, annexes: null };
    const [resultat] = verifierR02(documentSynthetique(9, { vides: [3] }), decoupage);
    expect(resultat?.gravite).toBe('erreur');
    expect(resultat?.detail).toContain('La page\u00A03 est vide');
  });
});
