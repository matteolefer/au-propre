import { describe, expect, it } from 'vitest';
import { verifierR14 } from '../../src/checker/rules/R14-sommaire';
import { aDroite, avecPage, DECOUPAGE_SYNTHETIQUE, documentStandard, pageDeLignes } from '../helpers/document-synthetique';
import { chargerFixture, DECOUPAGES, FIXTURES_TEXTE } from '../helpers/fixtures';
import { attendreTextesEtSources } from '../helpers/sources';

function verifierPage2(lignes: Parameters<typeof pageDeLignes>[1]) {
  return verifierR14(avecPage(documentStandard(), pageDeLignes(2, lignes)), DECOUPAGE_SYNTHETIQUE);
}

describe('R14 : pas de sommaire', () => {
  it.each(FIXTURES_TEXTE)('%s : conforme', async (nom) => {
    const resultats = verifierR14(await chargerFixture(nom), DECOUPAGES[nom]);
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
    attendreTextesEtSources(resultats, ['S5', 'S7']);
  });

  it.each(['Sommaire', 'Table des matières', 'SOMMAIRE'])('titre « %s » : avertissement', (titre) => {
    const resultats = verifierPage2([titre, 'Première partie : parcours professionnel']);
    expect(resultats[0]).toMatchObject({ gravite: 'avertissement', pages: [2] });
    attendreTextesEtSources(resultats, ['S5', 'S7']);
  });

  it('table des matières avec points de suite, sans le mot : avertissement', () => {
    const resultats = verifierPage2([
      'Introduction ........................................ 2',
      'Première partie : parcours .......................... 2',
      'Seconde partie : analyse de séquence ................ 4',
      'Annexes ............................................. 10',
    ]);
    expect(resultats.map((r) => r.gravite)).toEqual(['avertissement']);
  });

  it('table des matières avec numéros alignés à droite (tabulation) : avertissement', () => {
    const resultats = verifierPage2([
      [{ texte: 'Première partie : parcours' }, aDroite('2')],
      [{ texte: 'Seconde partie : analyse' }, aDroite('4')],
      [{ texte: 'Annexes' }, aDroite('10')],
    ]);
    expect(resultats.map((r) => r.gravite)).toEqual(['avertissement']);
  });

  it('« le sommaire du manuel » dans une phrase : conforme', () => {
    const resultats = verifierPage2(['Les élèves ont d’abord consulté le sommaire du manuel pour repérer le chapitre.']);
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
  });

  it('tableau de notes (numéros non croissants) : conforme', () => {
    const resultats = verifierPage2([
      [{ texte: 'Élève A' }, aDroite('12')],
      [{ texte: 'Élève B' }, aDroite('9')],
      [{ texte: 'Élève C' }, aDroite('11')],
    ]);
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
  });

  it('liste « Séance 1 / 2 / 3 » (numéro collé au texte) : conforme', () => {
    const resultats = verifierPage2(['Séance 1', 'Séance 2', 'Séance 3']);
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
  });
});
