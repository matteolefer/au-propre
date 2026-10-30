import { describe, expect, it } from 'vitest';
import { verifierR16 } from '../../src/checker/rules/R16-documents-interdits';
import { avecPage, DECOUPAGE_SYNTHETIQUE, documentStandard, pageDeLignes } from '../helpers/document-synthetique';
import { chargerFixture, DECOUPAGES, FIXTURES_TEXTE } from '../helpers/fixtures';
import { attendreTextesEtSources } from '../helpers/sources';

const PHRASE_PLEINE = 'Cette ligne de texte courant occupe toute la largeur de la page, comme une ligne justifiée, et la phrase continue';
const MESSAGE =
  'Mentionner une visite ou une inspection est possible. En revanche, joindre un rapport d’inspection, de visite-conseil ou une lettre de recommandation écarte le dossier.';

function verifierPage(numero: number, lignes: Parameters<typeof pageDeLignes>[1]) {
  return verifierR16(avecPage(documentStandard(), pageDeLignes(numero, lignes)), DECOUPAGE_SYNTHETIQUE);
}

describe('R16 : pas de lettre de recommandation ni de rapport d’inspection', () => {
  it.each(FIXTURES_TEXTE)('%s : conforme', async (nom) => {
    const resultats = verifierR16(await chargerFixture(nom), DECOUPAGES[nom]);
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
    attendreTextesEtSources(resultats, ['S9']);
  });

  describe('erreur : document probablement joint', () => {
    it('dans une annexe, même au milieu d’une phrase', () => {
      const resultats = verifierPage(10, ['Voici la lettre de recommandation de mon chef d’établissement.']);
      expect(resultats[0]).toMatchObject({ gravite: 'erreur', pages: [10] });
      expect(resultats[0]?.detail).toContain('« lettre de recommandation » (page 10)');
      attendreTextesEtSources(resultats, ['S9']);
    });

    it('en titre dans la partie 2', () => {
      const resultats = verifierPage(5, ['Rapport d’inspection du 12 mars 2025', PHRASE_PLEINE]);
      expect(resultats.map((r) => r.gravite)).toEqual(['erreur']);
    });

    it('en tête d’un paragraphe', () => {
      const resultats = verifierPage(3, ['Visite-conseil du 12 mars : l’inspectrice a observé une séance de lecture en classe de quatrième.']);
      expect(resultats.map((r) => r.gravite)).toEqual(['erreur']);
    });

    it('au pluriel', () => {
      expect(verifierPage(11, ['Lettres de recommandation']).map((r) => r.gravite)).toEqual(['erreur']);
    });

    it('coupée sur deux lignes, en annexe', () => {
      expect(verifierPage(10, [`${PHRASE_PLEINE} rapport de visite-`, 'conseil de l’inspectrice.']).map((r) => r.gravite)).toEqual(['erreur']);
    });
  });

  it('citée dans une phrase de la partie 1 : info, avec le message', () => {
    const resultats = verifierPage(2, [
      'Lors d’une visite-conseil, l’inspectrice m’a conseillé de mieux expliciter les critères d’évaluation aux élèves.',
    ]);
    expect(resultats[0]).toMatchObject({ gravite: 'info', pages: [2], detail: MESSAGE });
    attendreTextesEtSources(resultats, ['S9']);
  });
});
