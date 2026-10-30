import { describe, expect, it } from 'vitest';
import { adressesDuTexte, verifierR17 } from '../../src/checker/rules/R17-liens';
import { avecPage, DECOUPAGE_SYNTHETIQUE, documentStandard, pageCouverture, pageDeLignes } from '../helpers/document-synthetique';
import { chargerFixture, DECOUPAGES, FIXTURES_TEXTE } from '../helpers/fixtures';
import { attendreTextesEtSources } from '../helpers/sources';

describe('R17 : liens et QR codes', () => {
  it.each(FIXTURES_TEXTE)('%s : conforme, en rappelant que les QR codes ne sont pas détectés', async (nom) => {
    const resultats = verifierR17(await chargerFixture(nom), DECOUPAGES[nom]);
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
    expect(resultats[0]?.detail).toContain('QR codes ne peuvent pas être détectés');
    attendreTextesEtSources(resultats, ['S6']);
  });

  it.each([
    ['https://eduscol.education.fr/ressources', 'https://eduscol.education.fr/ressources'],
    ['www.lumni.fr', 'www.lumni.fr'],
    ['eduscol.education.fr', 'eduscol.education.fr'],
  ])('adresse « %s » dans le texte : avertissement', (adresse, attendue) => {
    const page = pageDeLignes(5, [`Les élèves ont consulté ${adresse}.`]);
    const resultats = verifierR17(avecPage(documentStandard(), page), DECOUPAGE_SYNTHETIQUE);
    expect(resultats[0]).toMatchObject({ gravite: 'avertissement', pages: [5] });
    expect(resultats[0]?.detail).toContain(attendue);
    attendreTextesEtSources(resultats, ['S6']);
  });

  it('lien cliquable vers le web : avertissement ; lien interne : ignoré', () => {
    const lien = { x: 70, y: 100, largeur: 100, hauteur: 12 };
    const externe = { ...pageDeLignes(6, ['Texte']), liens: [{ ...lien, url: 'https://www.youtube.com/watch?v=x' }] };
    const interne = { ...pageDeLignes(6, ['Texte']), liens: [{ ...lien, url: null }] };
    expect(verifierR17(avecPage(documentStandard(), externe), DECOUPAGE_SYNTHETIQUE).map((r) => r.gravite)).toEqual(['avertissement']);
    expect(verifierR17(avecPage(documentStandard(), interne), DECOUPAGE_SYNTHETIQUE).map((r) => r.gravite)).toEqual(['conforme']);
  });

  it('adresse e-mail : ignorée', () => {
    expect(adressesDuTexte('ecrire a prenom.nom@ac-lyon.fr pour toute question.')).toEqual([]);
  });

  it('adresse sur la couverture : ignorée', () => {
    const couverture = { ...pageCouverture(), liens: [{ x: 0, y: 0, largeur: 10, hauteur: 10, url: 'https://cyclades.education.gouv.fr' }] };
    expect(verifierR17(avecPage(documentStandard(), couverture), DECOUPAGE_SYNTHETIQUE).map((r) => r.gravite)).toEqual(['conforme']);
  });
});
