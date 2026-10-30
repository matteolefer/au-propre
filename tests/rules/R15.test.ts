import { describe, expect, it } from 'vitest';
import { verifierR15 } from '../../src/checker/rules/R15-cv';
import { avecPage, DECOUPAGE_SYNTHETIQUE, documentStandard, pageDeLignes } from '../helpers/document-synthetique';
import { chargerFixture, DECOUPAGES, FIXTURES_TEXTE } from '../helpers/fixtures';
import { attendreTextesEtSources } from '../helpers/sources';

function verifierPage(numero: number, lignes: Parameters<typeof pageDeLignes>[1]) {
  return verifierR15(avecPage(documentStandard(), pageDeLignes(numero, lignes)), DECOUPAGE_SYNTHETIQUE);
}

describe('R15 : pas de CV', () => {
  it.each(FIXTURES_TEXTE)('%s : conforme', async (nom) => {
    const resultats = verifierR15(await chargerFixture(nom), DECOUPAGES[nom]);
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
    attendreTextesEtSources(resultats, ['S5', 'S7']);
  });

  it('titre « Curriculum vitae » en annexe : avertissement', () => {
    const resultats = verifierPage(11, ['Curriculum vitae', 'Formation : master de lettres modernes']);
    expect(resultats[0]).toMatchObject({ gravite: 'avertissement', pages: [11] });
    attendreTextesEtSources(resultats, ['S5', 'S7']);
  });

  it('titre « CV » : avertissement', () => {
    expect(verifierPage(2, ['CV', 'Expériences professionnelles']).map((r) => r.gravite)).toEqual(['avertissement']);
  });

  it('« curriculum vitae » cité dans une phrase : info, avec le message', () => {
    const resultats = verifierPage(2, ['Cette année, j’ai actualisé mon curriculum vitae avant de préparer le concours.']);
    expect(resultats[0]).toMatchObject({ gravite: 'info', pages: [2] });
    expect(resultats[0]?.detail).toBe(
      'Citer un curriculum vitae dans le texte est possible. En revanche, les jurys demandent de ne pas joindre de CV au dossier.',
    );
  });

  it('« CVC » n’est pas un CV', () => {
    expect(verifierPage(5, ['Le délégué au CVC a présenté le projet aux élèves.']).map((r) => r.gravite)).toEqual(['conforme']);
  });
});
