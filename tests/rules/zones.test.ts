/**
 * Zones en faute (R08, R09, R10, R13) : le rapport les surligne sur l'aperçu
 * de la page. Elles sont en points, dans le repère des blocs.
 */
import { describe, expect, it } from 'vitest';
import { cmEnPt } from '../../src/checker/measure';
import { verifierR08 } from '../../src/checker/rules/R08-marges-laterales';
import { verifierR09 } from '../../src/checker/rules/R09-en-tete-pied';
import { verifierR10 } from '../../src/checker/rules/R10-retrait';
import { verifierR13 } from '../../src/checker/rules/R13-couleur';
import { DECOUPAGE_SYNTHETIQUE, documentStandard } from '../helpers/document-synthetique';
import { chargerFixture, DECOUPAGES } from '../helpers/fixtures';

describe('zones en faute', () => {
  it('R08 sur la fixture 04 : une bande à gauche et une à droite, sur chaque page des parties', async () => {
    const [resultat] = verifierR08(await chargerFixture('04_marges_2cm_word'), DECOUPAGES['04_marges_2cm_word']);
    const zones = resultat?.zones ?? [];
    expect(zones.map((z) => z.page)).toEqual([2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9]);
    const [gauche, droite] = zones;
    // Gauche : du bord du texte (2 cm) jusqu'à la limite de 2,5 cm.
    expect(gauche?.x).toBeCloseTo(cmEnPt(2), 0);
    expect((gauche?.x ?? 0) + (gauche?.largeur ?? 0)).toBeCloseTo(cmEnPt(2.5), 1);
    // Droite : de la limite de 2,5 cm jusqu'au bord du texte (1,99 cm du bord).
    expect(droite?.x).toBeCloseTo((droite?.largeurPage ?? 0) - cmEnPt(2.5), 1);
    expect(droite?.largeur).toBeGreaterThan(0);
    expect(gauche?.hauteur).toBeGreaterThan(cmEnPt(20));
  });

  it('R09 : la boîte du pied de page trop proche du bord bas', () => {
    const [resultat] = verifierR09(documentStandard({ 4: { piedCm: 1 } }), DECOUPAGE_SYNTHETIQUE);
    const [zone] = resultat?.zones ?? [];
    expect(zone?.page).toBe(4);
    expect((zone?.hauteurPage ?? 0) - ((zone?.y ?? 0) + (zone?.hauteur ?? 0))).toBeCloseTo(cmEnPt(1), 0);
  });

  it('R10 : l’espace laissé par chaque retrait de 20 pt', () => {
    const [resultat] = verifierR10(documentStandard({ 3: { retraitPt: 20 } }), DECOUPAGE_SYNTHETIQUE);
    const zones = resultat?.zones ?? [];
    expect(zones.length).toBeGreaterThanOrEqual(2);
    for (const zone of zones) {
      expect(zone.page).toBe(3);
      expect(zone.largeur).toBeCloseTo(20, 0);
      expect(zone.hauteur).toBeGreaterThan(0);
    }
  });

  it('R13 : chaque bloc en couleur', () => {
    const [resultat] = verifierR13(documentStandard({ 5: { couleur: '#c00000' } }), DECOUPAGE_SYNTHETIQUE);
    const zones = resultat?.zones ?? [];
    expect(zones.length).toBeGreaterThan(0);
    expect(new Set(zones.map((z) => z.page))).toEqual(new Set([5]));
  });

  it('pas de zone pour un résultat conforme', async () => {
    const document = await chargerFixture('01_conforme_word');
    const decoupage = DECOUPAGES['01_conforme_word'];
    for (const verifier of [verifierR08, verifierR09, verifierR10, verifierR13]) {
      for (const resultat of verifier(document, decoupage)) expect(resultat.zones).toBeUndefined();
    }
  });
});
