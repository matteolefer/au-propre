import { describe, expect, it } from 'vitest';
import { verifierR04 } from '../../src/checker/rules/R04-annexes-pages';
import type { Decoupage } from '../../src/checker/types';
import { documentSynthetique } from '../helpers/document-synthetique';
import { chargerFixture, FIXTURES_TEXTE, DECOUPAGES } from '../helpers/fixtures';
import { attendreTextesEtSourcesS1S2 } from '../helpers/sources';

function decoupageAvecAnnexes(nombrePages: number | null): Decoupage {
  return {
    couverture: { debut: 1, fin: 1 },
    partie1: { debut: 2, fin: 3 },
    partie2: { debut: 4, fin: 9 },
    annexes: nombrePages === null ? null : { debut: 10, fin: 9 + nombrePages },
  };
}

describe('R04 : annexes, 10 pages maximum', () => {
  it.each(FIXTURES_TEXTE)('%s : conforme', async (nom) => {
    const resultats = verifierR04(await chargerFixture(nom), DECOUPAGES[nom]);
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
    attendreTextesEtSourcesS1S2(resultats);
  });

  it('10 pages : conforme (limite incluse)', () => {
    const resultats = verifierR04(documentSynthetique(19), decoupageAvecAnnexes(10));
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
  });

  it('11 pages : erreur', () => {
    const resultats = verifierR04(documentSynthetique(20), decoupageAvecAnnexes(11));
    expect(resultats).toHaveLength(1);
    expect(resultats[0]).toMatchObject({ gravite: 'erreur' });
    expect(resultats[0]?.pages).toHaveLength(11);
    expect(resultats[0]?.detail).toContain('11\u00A0pages (pages 10 à 20)');
    attendreTextesEtSourcesS1S2(resultats);
  });

  it('sans annexes : conforme, car elles sont facultatives', () => {
    const resultats = verifierR04(documentSynthetique(9), decoupageAvecAnnexes(null));
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
    attendreTextesEtSourcesS1S2(resultats);
  });
});
