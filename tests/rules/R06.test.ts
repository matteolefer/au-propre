import { describe, expect, it } from 'vitest';
import { verifierR06 } from '../../src/checker/rules/R06-taille';
import { DECOUPAGE_SYNTHETIQUE, documentStandard, pageStandard } from '../helpers/document-synthetique';
import { chargerFixture, DECOUPAGES, FIXTURES_TEXTE } from '../helpers/fixtures';
import { attendreTextesEtSources } from '../helpers/sources';

describe('R06 : taille 11 pt', () => {
  it.each(FIXTURES_TEXTE)('%s : conforme, corps en 11 pt', async (nom) => {
    const resultats = verifierR06(await chargerFixture(nom), DECOUPAGES[nom]);
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
    expect(resultats[0]?.detail).toBe('Taille du corps du texte : 11 pt.');
    attendreTextesEtSources(resultats, ['S1', 'S2', 'S8']);
  });

  it.each([
    [10, 'erreur'],
    [10.5, 'conforme'],
    [11.5, 'conforme'],
    [12, 'erreur'],
  ] as const)('corps en %f pt : %s', (taille, gravite) => {
    const resultats = verifierR06(documentStandard({}, { taille }), DECOUPAGE_SYNTHETIQUE);
    expect(resultats.map((r) => r.gravite)).toEqual([gravite]);
    attendreTextesEtSources(resultats, ['S1', 'S2', 'S8']);
  });

  it('titres en 14 pt : avertissement avec la taille et les pages', () => {
    const titre = { texte: 'Seconde partie : analyse', taille: 14 };
    const resultats = verifierR06(documentStandard({ 2: { titre }, 4: { titre } }), DECOUPAGE_SYNTHETIQUE);
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme', 'avertissement']);
    expect(resultats[1]).toMatchObject({ titre: 'Des lignes sont plus grandes que le texte', pages: [2, 4] });
    expect(resultats[1]?.detail).toContain('14 pt (pages 2 et 4)');
  });

  it('une page en 9 pt : avertissement « texte plus petit »', () => {
    const resultats = verifierR06(documentStandard({ 6: { taille: 9 } }), DECOUPAGE_SYNTHETIQUE);
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme', 'avertissement']);
    expect(resultats[1]).toMatchObject({ titre: 'Du texte est plus petit que 11 pt', pages: [6] });
  });

  it('exposants et appels de note isolés sont ignorés', () => {
    const document = documentStandard();
    const page = pageStandard(5);
    const premiere = page.blocs[0]!;
    page.blocs.push({ ...premiere, texte: 'er', taille: 7, hauteur: 7.8, y: premiere.y - 2, x: 300, largeur: 6 });
    page.blocs.push({ ...premiere, texte: '12', taille: 8, hauteur: 8.9, y: 700, largeur: 8 });
    document.pages[4] = page;
    expect(verifierR06(document, DECOUPAGE_SYNTHETIQUE).map((r) => r.gravite)).toEqual(['conforme']);
  });
});
