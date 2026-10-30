import { describe, expect, it } from 'vitest';
import { estEnCouleur, verifierR13 } from '../../src/checker/rules/R13-couleur';
import { DECOUPAGE_SYNTHETIQUE, documentStandard } from '../helpers/document-synthetique';
import { chargerFixture, DECOUPAGES, FIXTURES_TEXTE } from '../helpers/fixtures';
import { attendreTextesEtSources } from '../helpers/sources';

describe('R13 : texte en noir', () => {
  it.each(FIXTURES_TEXTE)('%s : conforme', async (nom) => {
    const resultats = verifierR13(await chargerFixture(nom), DECOUPAGES[nom]);
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
    attendreTextesEtSources(resultats, ['S7']);
  });

  it('texte rouge en page 5 : avertissement avec la couleur et la page', () => {
    const resultats = verifierR13(documentStandard({ 5: { couleur: '#c00000' } }), DECOUPAGE_SYNTHETIQUE);
    expect(resultats[0]).toMatchObject({ gravite: 'avertissement', pages: [5] });
    expect(resultats[0]?.detail).toBe('Couleur #C00000 (page 5).');
    attendreTextesEtSources(resultats, ['S7']);
  });

  it('texte gris : conforme, le gris n’est pas une couleur', () => {
    const resultats = verifierR13(documentStandard({ 5: { couleur: '#808080' } }), DECOUPAGE_SYNTHETIQUE);
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
  });

  it('couleur jamais déterminée : info, vérification impossible', () => {
    const resultats = verifierR13(documentStandard({}, { couleur: null }), DECOUPAGE_SYNTHETIQUE);
    expect(resultats.map((r) => r.gravite)).toEqual(['info']);
  });

  it.each([
    ['#000000', false],
    ['#808080', false],
    ['#595959', false],
    ['#1f3864', true],
    ['#0563c1', true],
    ['#c00000', true],
  ] as const)('estEnCouleur(%s) = %s', (hex, attendu) => {
    expect(estEnCouleur(hex)).toBe(attendu);
  });
});
