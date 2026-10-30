import { describe, expect, it } from 'vitest';
import { REGLES } from '../../src/checker/rules';
import { DECOUPAGE_SYNTHETIQUE, documentStandard, documentSynthetique } from '../helpers/document-synthetique';
import { PARAMETRES_INCONNUS } from '../helpers/fixtures';

describe('dossier synthétique de référence', () => {
  it('le dossier standard est conforme à toutes les règles (R01 : couverture à confirmer)', () => {
    const document = documentStandard();
    const resultats = REGLES.flatMap((regle) => regle.verifier(document, DECOUPAGE_SYNTHETIQUE, PARAMETRES_INCONNUS));
    expect(resultats.filter((r) => r.gravite !== 'conforme' && r.gravite !== 'info')).toEqual([]);
    // La couverture synthétique est détectée : R01 donne l'information « à confirmer ».
    expect(resultats.filter((r) => r.gravite === 'info').map((r) => r.id)).toEqual(['R01']);
  });

  it('parties sans texte : les règles de mise en page renvoient « contrôle impossible »', () => {
    const document = documentSynthetique(11, { vides: [2, 3, 4, 5, 6, 7, 8, 9] });
    for (const id of ['R05', 'R06', 'R07', 'R08', 'R09', 'R10', 'R12', 'R13']) {
      const regle = REGLES.find((r) => r.id === id);
      const resultats = regle?.verifier(document, DECOUPAGE_SYNTHETIQUE, PARAMETRES_INCONNUS) ?? [];
      expect(resultats.map((r) => [r.id, r.gravite])).toEqual([[id, 'info']]);
    }
  });
});
