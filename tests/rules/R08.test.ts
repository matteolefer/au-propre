import { describe, expect, it } from 'vitest';
import { verifierR08 } from '../../src/checker/rules/R08-marges-laterales';
import { DECOUPAGE_SYNTHETIQUE, documentStandard } from '../helpers/document-synthetique';
import { chargerFixture, DECOUPAGES, FIXTURES_TEXTE } from '../helpers/fixtures';
import { attendreTextesEtSourcesS1S2 } from '../helpers/sources';

describe('R08 : marges gauche et droite de 2,5 cm', () => {
  it('04_marges_2cm : erreur sur les pages 2 à 9, avec les marges mesurées', async () => {
    const resultats = verifierR08(await chargerFixture('04_marges_2cm'), DECOUPAGES['04_marges_2cm']);
    expect(resultats).toHaveLength(1);
    expect(resultats[0]).toMatchObject({ gravite: 'erreur', pages: [2, 3, 4, 5, 6, 7, 8, 9] });
    expect(resultats[0]?.detail).toBe(
      'Marge gauche de 2 cm (pages 2 à 9) ; marge droite de 1,97 cm (pages 2 à 9). Le minimum est de 2,5 cm.',
    );
    attendreTextesEtSourcesS1S2(resultats);
  });

  it.each(FIXTURES_TEXTE.filter((nom) => !nom.startsWith('04_')))('%s : conforme', async (nom) => {
    const resultats = verifierR08(await chargerFixture(nom), DECOUPAGES[nom]);
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
    attendreTextesEtSourcesS1S2(resultats);
  });

  it('marge de 2,43 cm (2,5 cm moins la tolérance de 2 pt) : conforme', () => {
    const resultats = verifierR08(documentStandard({ 3: { margeGaucheCm: 2.43 } }), DECOUPAGE_SYNTHETIQUE);
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
  });

  it('marge gauche de 2,4 cm en page 3, droite de 2,2 cm en page 7 : erreur', () => {
    const resultats = verifierR08(
      documentStandard({ 3: { margeGaucheCm: 2.4 }, 7: { margeDroiteCm: 2.2 } }),
      DECOUPAGE_SYNTHETIQUE,
    );
    expect(resultats[0]).toMatchObject({ gravite: 'erreur', pages: [3, 7] });
    expect(resultats[0]?.detail).toContain('Marge gauche de 2,4 cm (page 3)');
    expect(resultats[0]?.detail).toContain('marge droite de 2,2 cm (page 7)');
  });

  it('les annexes ne sont pas mesurées', () => {
    const resultats = verifierR08(documentStandard({ 10: { margeGaucheCm: 1 } }), DECOUPAGE_SYNTHETIQUE);
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
  });
});
