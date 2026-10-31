import { describe, expect, it } from 'vitest';
import { analyser, construireRapport, ORDRE_GROUPES, pagesAnnexesEnImage } from '../../src/checker/report';
import type { Gravite, ResultatRegle } from '../../src/checker/types';
import { documentSynthetique } from '../helpers/document-synthetique';
import { chargerFixture, DECOUPAGES, PARAMETRES_INCONNUS } from '../helpers/fixtures';

function resultat(id: string, gravite: Gravite): ResultatRegle {
  return { id, gravite, titre: `${id} ${gravite}`, detail: 'Mesure.', correction: '', sources: [] };
}

describe('construireRapport', () => {
  it('range chaque gravité dans son groupe et compte les résultats', () => {
    const rapport = construireRapport([
      resultat('R08', 'erreur'),
      resultat('R05', 'avertissement'),
      resultat('R02', 'erreur'),
      resultat('R01', 'info'),
      resultat('R03', 'conforme'),
    ]);
    expect(rapport.resume).toEqual({ aCorriger: 2, aVerifier: 1, conforme: 1, informations: 1 });
    expect(rapport.groupes.aCorriger.map((r) => r.id)).toEqual(['R02', 'R08']);
    expect(rapport.bloquant).toBeNull();
  });

  it('trie par numéro de règle (R10 après R09) en gardant l’ordre au sein d’une règle', () => {
    const rapport = construireRapport([
      resultat('R10', 'conforme'),
      { ...resultat('R06', 'conforme'), titre: 'premier' },
      resultat('R09', 'conforme'),
      { ...resultat('R06', 'conforme'), titre: 'second' },
      resultat('R00', 'conforme'),
    ]);
    expect(rapport.groupes.conforme.map((r) => r.titre)).toEqual(['R00 conforme', 'premier', 'second', 'R09 conforme', 'R10 conforme']);
  });

  it('isole le résultat bloquant', () => {
    const rapport = construireRapport([resultat('R00', 'bloquant')]);
    expect(rapport.bloquant?.id).toBe('R00');
    expect(ORDRE_GROUPES.every((cle) => rapport.groupes[cle].length === 0)).toBe(true);
  });
});

describe('analyser', () => {
  it('01_conforme_word : aucune erreur, R00 en tête des contrôles conformes', async () => {
    const rapport = construireRapport(analyser(await chargerFixture('01_conforme_word'), DECOUPAGES['01_conforme_word'], PARAMETRES_INCONNUS));
    expect(rapport.resume.aCorriger).toBe(0);
    expect(rapport.resume.aVerifier).toBe(0);
    expect(rapport.groupes.conforme[0]?.id).toBe('R00');
    expect(rapport.groupes.informations.map((r) => r.id)).toEqual(['R01']);
  });

  it('02_partie1_3pages_word : R02 à corriger', async () => {
    const rapport = construireRapport(
      analyser(await chargerFixture('02_partie1_3pages_word'), DECOUPAGES['02_partie1_3pages_word'], PARAMETRES_INCONNUS),
    );
    expect(rapport.groupes.aCorriger.map((r) => r.id)).toEqual(['R02']);
  });

  it('05_scanne : seul R00 est rendu, bloquant', async () => {
    const resultats = analyser(await chargerFixture('05_scanne'), DECOUPAGES['01_conforme'], PARAMETRES_INCONNUS);
    expect(resultats.map((r) => [r.id, r.gravite])).toEqual([['R00', 'bloquant']]);
  });
});

describe('pagesAnnexesEnImage', () => {
  it('relève les pages d’annexes sans texte qui contiennent une image', () => {
    const document = documentSynthetique(12, { vides: [11, 12] });
    const image = { x: 0, y: 0, largeur: 595, hauteur: 842 };
    const pages = document.pages.map((page) => (page.numero === 11 ? { ...page, images: [image] } : page));
    expect(pagesAnnexesEnImage({ ...document, pages }, DECOUPAGES['02_partie1_3pages'])).toEqual([11]);
  });

  it('aucune annexe : aucune page', () => {
    const decoupage = { ...DECOUPAGES['01_conforme'], annexes: null };
    expect(pagesAnnexesEnImage(documentSynthetique(9), decoupage)).toEqual([]);
  });
});
