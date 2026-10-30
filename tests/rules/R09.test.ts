import { describe, expect, it } from 'vitest';
import { verifierR09 } from '../../src/checker/rules/R09-en-tete-pied';
import { DECOUPAGE_SYNTHETIQUE, documentStandard } from '../helpers/document-synthetique';
import { chargerFixture, DECOUPAGES, FIXTURES_TEXTE } from '../helpers/fixtures';
import { attendreTextesEtSourcesS1S2 } from '../helpers/sources';

describe('R09 : en-tête et pied de page à 1,25 cm du bord', () => {
  it.each(FIXTURES_TEXTE)('%s : conforme (pied de page à 1,25 cm)', async (nom) => {
    const resultats = verifierR09(await chargerFixture(nom), DECOUPAGES[nom]);
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
    expect(resultats[0]?.detail).toMatch(/1,2[56] cm du bord bas/);
    attendreTextesEtSourcesS1S2(resultats);
  });

  it('pied de page à 1 cm sur les pages 4 et 5 : erreur', () => {
    const resultats = verifierR09(documentStandard({ 4: { piedCm: 1 }, 5: { piedCm: 1 } }), DECOUPAGE_SYNTHETIQUE);
    expect(resultats[0]).toMatchObject({ gravite: 'erreur', pages: [4, 5] });
    expect(resultats[0]?.detail).toBe(
      'Texte à 1 cm du bord bas (pages 4 et 5). La distance minimale est de 1,25 cm.',
    );
    attendreTextesEtSourcesS1S2(resultats);
  });

  it.each([
    [1.18, 'conforme'],
    [1.1, 'erreur'],
  ] as const)('texte à %f cm du bord haut : %s', (hautCm, gravite) => {
    const resultats = verifierR09(documentStandard({ 2: { hautCm } }), DECOUPAGE_SYNTHETIQUE);
    expect(resultats.map((r) => r.gravite)).toEqual([gravite]);
  });
});
