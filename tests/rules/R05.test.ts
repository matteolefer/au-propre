import { describe, expect, it } from 'vitest';
import { verifierR05 } from '../../src/checker/rules/R05-police-arial';
import { DECOUPAGE_SYNTHETIQUE, documentStandard, pageStandard } from '../helpers/document-synthetique';
import { chargerFixture, DECOUPAGES, fixtureDisponible } from '../helpers/fixtures';
import { attendreTextesEtSourcesS1S2 } from '../helpers/sources';

describe('R05 : police Arial', () => {
  it.each(['01_conforme', '02_partie1_3pages', '04_marges_2cm'] as const)(
    '%s (LibreOffice) : avertissement, Arial remplacée par Liberation Sans',
    async (nom) => {
      const resultats = verifierR05(await chargerFixture(nom), DECOUPAGES[nom]);
      expect(resultats).toHaveLength(1);
      expect(resultats[0]).toMatchObject({ gravite: 'avertissement', titre: 'Votre traitement de texte a remplacé Arial par Liberation Sans' });
      attendreTextesEtSourcesS1S2(resultats);
    },
  );

  it('01_conforme_word : conforme, en Arial', async () => {
    const resultats = verifierR05(await chargerFixture('01_conforme_word'), DECOUPAGES['01_conforme_word']);
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
    expect(resultats[0]?.detail).toContain('Arial');
    attendreTextesEtSourcesS1S2(resultats);
  });

  it.each([
    ['03_calibri', 'Carlito'],
    ['03_calibri_word', 'Calibri'],
  ] as const)('%s : erreur, police %s', async (nom, police) => {
    const resultats = verifierR05(await chargerFixture(nom), DECOUPAGES[nom]);
    expect(resultats).toHaveLength(1);
    expect(resultats[0]).toMatchObject({ gravite: 'erreur', pages: [2, 3, 4, 5, 6, 7, 8, 9] });
    expect(resultats[0]?.detail).toContain(`en ${police} (pages 2 à 9)`);
    attendreTextesEtSourcesS1S2(resultats);
  });

  it.skipIf(!fixtureDisponible('04_marges_2cm_word'))('04_marges_2cm_word : conforme', async () => {
    const resultats = verifierR05(await chargerFixture('04_marges_2cm_word'), DECOUPAGES['04_marges_2cm_word']);
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
  });

  it('Arial en italique et en gras : conforme', () => {
    const document = documentStandard({ 3: { police: 'Arial-ItalicMT' }, 4: { police: 'Arial-BoldItalicMT' } });
    expect(verifierR05(document, DECOUPAGE_SYNTHETIQUE).map((r) => r.gravite)).toEqual(['conforme']);
  });

  it('une autre police minoritaire : avertissement avec la police et la page', () => {
    const resultats = verifierR05(documentStandard({ 5: { police: 'Calibri' } }), DECOUPAGE_SYNTHETIQUE);
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme', 'avertissement']);
    expect(resultats[1]).toMatchObject({ titre: 'D’autres polices qu’Arial sont utilisées', pages: [5] });
    expect(resultats[1]?.detail).toBe('Calibri (page 5).');
    attendreTextesEtSourcesS1S2(resultats);
  });

  it('une police de puces (Symbol) est ignorée', () => {
    const document = documentStandard();
    const page = pageStandard(4);
    page.blocs.push({ ...page.blocs[0]!, texte: 'abc', police: 'Symbol', policeBrute: 'Symbol' });
    document.pages[3] = page;
    expect(verifierR05(document, DECOUPAGE_SYNTHETIQUE).map((r) => r.gravite)).toEqual(['conforme']);
  });

  it.each([
    ['Arial-Black', 'erreur'],
    ['ArialNarrow', 'erreur'],
    ['TimesNewRomanPSMT', 'erreur'],
    ['Arimo', 'avertissement'],
    ['g_d0_f1', 'avertissement'],
  ] as const)('police majoritaire %s : %s', (police, gravite) => {
    const resultats = verifierR05(documentStandard({}, { police }), DECOUPAGE_SYNTHETIQUE);
    expect(resultats.map((r) => r.gravite)).toEqual([gravite]);
    attendreTextesEtSourcesS1S2(resultats);
  });
});
