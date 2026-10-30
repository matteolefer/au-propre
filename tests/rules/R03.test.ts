import { describe, expect, it } from 'vitest';
import { verifierR03 } from '../../src/checker/rules/R03-partie2-pages';
import type { Decoupage } from '../../src/checker/types';
import { documentSynthetique } from '../helpers/document-synthetique';
import { chargerFixture, FIXTURES_TEXTE, DECOUPAGES } from '../helpers/fixtures';
import { attendreTextesEtSourcesS1S2 } from '../helpers/sources';

function decoupageAvecPartie2(nombrePages: number): Decoupage {
  return {
    couverture: { debut: 1, fin: 1 },
    partie1: { debut: 2, fin: 3 },
    partie2: { debut: 4, fin: 3 + nombrePages },
    annexes: null,
  };
}

describe('R03 : partie 2, 6 pages maximum', () => {
  it.each(FIXTURES_TEXTE)('%s : conforme', async (nom) => {
    const resultats = verifierR03(await chargerFixture(nom), DECOUPAGES[nom]);
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
    attendreTextesEtSourcesS1S2(resultats);
  });

  it('6 pages : conforme (limite incluse)', () => {
    const resultats = verifierR03(documentSynthetique(9), decoupageAvecPartie2(6));
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
  });

  it('7 pages : erreur, avec les pages concernées', () => {
    const resultats = verifierR03(documentSynthetique(10), decoupageAvecPartie2(7));
    expect(resultats).toHaveLength(1);
    expect(resultats[0]).toMatchObject({ gravite: 'erreur', pages: [4, 5, 6, 7, 8, 9, 10] });
    expect(resultats[0]?.detail).toContain('7\u00A0pages (pages 4 à 10)');
    attendreTextesEtSourcesS1S2(resultats);
  });
});
