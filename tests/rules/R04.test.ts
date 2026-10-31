import { describe, expect, it } from 'vitest';
import { CONCOURS_CPE } from '../../src/checker/rules/nombre-pages';
import { verifierR04 } from '../../src/checker/rules/R04-annexes-pages';
import type { Decoupage } from '../../src/checker/types';
import { documentSynthetique } from '../helpers/document-synthetique';
import { chargerFixture, FIXTURES_TEXTE, DECOUPAGES } from '../helpers/fixtures';
import { attendreTextesEtSources, attendreTextesEtSourcesS1S2 } from '../helpers/sources';

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

  describe('CPE interne : limite fixée par le rapport du jury 2026 (S11)', () => {
    const cpe = { concours: CONCOURS_CPE, discipline: null, nomFichier: null };

    it('11 pages : erreur, avec la conséquence fixée par le jury', () => {
      const resultats = verifierR04(documentSynthetique(20), decoupageAvecAnnexes(11), cpe);
      expect(resultats.map((r) => r.gravite)).toEqual(['erreur']);
      expect(resultats[0]?.detail).toContain('Pour le CPE, le jury ne prend pas en considération les annexes au-delà de 10\u00A0pages.');
      attendreTextesEtSources(resultats, ['S11']);
    });

    it('10 pages : conforme, sans mention', () => {
      const resultats = verifierR04(documentSynthetique(19), decoupageAvecAnnexes(10), cpe);
      expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
      expect(resultats[0]?.detail).not.toContain('CPE');
      attendreTextesEtSources(resultats, ['S11']);
    });

    it('sans annexes : conforme, source S11', () => {
      attendreTextesEtSources(verifierR04(documentSynthetique(9), decoupageAvecAnnexes(null), cpe), ['S11']);
    });

    it('autre concours : erreur sans la mention du CPE, sources S1 et S2', () => {
      const resultats = verifierR04(documentSynthetique(20), decoupageAvecAnnexes(11), { ...cpe, concours: 'capes-interne' });
      expect(resultats[0]?.gravite).toBe('erreur');
      expect(resultats[0]?.detail).not.toContain('CPE');
      attendreTextesEtSourcesS1S2(resultats);
    });
  });
});
