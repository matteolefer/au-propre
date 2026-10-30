import { describe, expect, it } from 'vitest';
import { verifierR12 } from '../../src/checker/rules/R12-pagination';
import { DECOUPAGE_SYNTHETIQUE, documentStandard } from '../helpers/document-synthetique';
import { chargerFixture, DECOUPAGES, FIXTURES_TEXTE } from '../helpers/fixtures';
import { attendreTextesEtSources } from '../helpers/sources';

describe('R12 : pagination', () => {
  it.each(FIXTURES_TEXTE)('%s : conforme, numéro sur chaque page des parties', async (nom) => {
    const document = await chargerFixture(nom);
    const resultats = verifierR12(document, DECOUPAGES[nom]);
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
    const total = nom.startsWith('02_') ? 9 : 8;
    expect(resultats[0]?.detail).toContain(`${total} des ${total} pages`);
    attendreTextesEtSources(resultats, ['S8']);
  });

  it('aucun numéro : avertissement', () => {
    const resultats = verifierR12(documentStandard({}, { pied: null }), DECOUPAGE_SYNTHETIQUE);
    expect(resultats.map((r) => r.gravite)).toEqual(['avertissement']);
    attendreTextesEtSources(resultats, ['S8']);
  });

  it('un pied de page sans numéro : avertissement', () => {
    const resultats = verifierR12(documentStandard({}, { pied: 'Dossier RAEP' }), DECOUPAGE_SYNTHETIQUE);
    expect(resultats.map((r) => r.gravite)).toEqual(['avertissement']);
  });

  it.each(['Page 3', '- 3 -', '3/11', '3 sur 11'])('« %s » est reconnu comme numéro', (pied) => {
    const resultats = verifierR12(documentStandard({}, { pied }), DECOUPAGE_SYNTHETIQUE);
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
  });
});
