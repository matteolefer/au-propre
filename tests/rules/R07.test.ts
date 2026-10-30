import { describe, expect, it } from 'vitest';
import { verifierR07 } from '../../src/checker/rules/R07-interligne';
import { DECOUPAGE_SYNTHETIQUE, documentStandard, documentSynthetique } from '../helpers/document-synthetique';
import { chargerFixture, DECOUPAGES, FIXTURES_TEXTE } from '../helpers/fixtures';
import { attendreTextesEtSourcesS1S2 } from '../helpers/sources';

describe('R07 : interligne simple', () => {
  it.each(FIXTURES_TEXTE)('%s : conforme', async (nom) => {
    const resultats = verifierR07(await chargerFixture(nom), DECOUPAGES[nom]);
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
    attendreTextesEtSourcesS1S2(resultats);
  });

  it.each([
    ['01_conforme', '1,09'],
    ['01_conforme_word', '1,16'],
    ['03_calibri_word', '1,22'],
  ] as const)('%s : rapport mesuré %s (mesures de référence)', async (nom, rapport) => {
    const [resultat] = verifierR07(await chargerFixture(nom), DECOUPAGES[nom]);
    expect(resultat?.detail).toContain(`vaut ${rapport} fois`);
  });

  it.each([
    [1.15, 'conforme'],
    [1.35, 'conforme'],
    [1.4, 'avertissement'],
    [1.5, 'avertissement'],
  ] as const)('interligne de %f fois la taille : %s', (interligne, gravite) => {
    const resultats = verifierR07(documentStandard({}, { interligne }), DECOUPAGE_SYNTHETIQUE);
    expect(resultats.map((r) => r.gravite)).toEqual([gravite]);
    attendreTextesEtSourcesS1S2(resultats);
  });

  it('trop peu de lignes : info, mesure impossible', () => {
    const resultats = verifierR07(documentSynthetique(11), DECOUPAGE_SYNTHETIQUE);
    expect(resultats.map((r) => r.gravite)).toEqual(['info']);
    expect(resultats[0]?.titre).toBe('Interligne non mesurable');
  });
});
