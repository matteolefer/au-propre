import { describe, expect, it } from 'vitest';
import { verifierR00 } from '../../src/checker/rules/R00-pdf-lisible';
import { chargerFixture, FIXTURES_TEXTE } from '../helpers/fixtures';

describe('R00 : PDF lisible', () => {
  it('05_scanne : bloquant, avec explication et correction', async () => {
    const resultat = verifierR00(await chargerFixture('05_scanne'));
    expect(resultat.gravite).toBe('bloquant');
    expect(resultat.detail).toContain('11\u00A0pages');
    expect(resultat.detail).toContain('11 sur 11 ne contiennent qu’une image');
    expect(resultat.correction).not.toBe('');
    // R00 n'est pas une règle officielle : aucune source n'est citée.
    expect(resultat.sources).toEqual([]);
  });

  it.each(FIXTURES_TEXTE)('%s : conforme', async (nom) => {
    const resultat = verifierR00(await chargerFixture(nom));
    expect(resultat.gravite).toBe('conforme');
    expect(resultat.titre).not.toBe('');
  });
});
