import { describe, expect, it } from 'vitest';
import { verifierR10 } from '../../src/checker/rules/R10-retrait';
import { DECOUPAGE_SYNTHETIQUE, documentStandard, pageStandard } from '../helpers/document-synthetique';
import { chargerFixture, DECOUPAGES, FIXTURES_TEXTE } from '../helpers/fixtures';
import { attendreTextesEtSourcesS1S2 } from '../helpers/sources';

describe('R10 : pas de retrait en début de paragraphe', () => {
  it.each(FIXTURES_TEXTE)('%s : conforme', async (nom) => {
    const resultats = verifierR10(await chargerFixture(nom), DECOUPAGES[nom]);
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
    attendreTextesEtSourcesS1S2(resultats);
  });

  it('retrait de 20 pt sur les paragraphes de la page 3 : avertissement', () => {
    const resultats = verifierR10(documentStandard({ 3: { retraitPt: 20 } }), DECOUPAGE_SYNTHETIQUE);
    expect(resultats[0]).toMatchObject({ gravite: 'avertissement', pages: [3] });
    expect(resultats[0]?.detail).toContain('5 paragraphes commencent en retrait');
    attendreTextesEtSourcesS1S2(resultats);
  });

  it('décalage de 4 pt seulement : conforme', () => {
    const resultats = verifierR10(documentStandard({}, { retraitPt: 4 }), DECOUPAGE_SYNTHETIQUE);
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
  });

  it('un seul paragraphe en retrait : conforme (pas récurrent)', () => {
    const document = documentStandard();
    const page = pageStandard(3);
    const premiere = page.blocs[0]!;
    page.blocs[0] = { ...premiere, x: premiere.x + 20, largeur: premiere.largeur - 20 };
    document.pages[2] = page;
    expect(verifierR10(document, DECOUPAGE_SYNTHETIQUE).map((r) => r.gravite)).toEqual(['conforme']);
  });

  it('un titre centré n’est pas un retrait', () => {
    const document = documentStandard({}, { titre: { texte: 'Seconde partie : analyse' } });
    for (const page of document.pages) {
      const titre = page.blocs[0]!;
      page.blocs[0] = { ...titre, x: (page.largeur - titre.largeur) / 2 };
    }
    expect(verifierR10(document, DECOUPAGE_SYNTHETIQUE).map((r) => r.gravite)).toEqual(['conforme']);
  });
});
