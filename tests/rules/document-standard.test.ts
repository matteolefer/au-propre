import { describe, expect, it } from 'vitest';
import { REGLES } from '../../src/checker/rules';
import { DECOUPAGE_SYNTHETIQUE, documentStandard, documentSynthetique } from '../helpers/document-synthetique';

describe('dossier synthétique de référence', () => {
  it('le dossier standard est conforme à toutes les règles', () => {
    const document = documentStandard();
    const resultats = REGLES.flatMap((regle) => regle.verifier(document, DECOUPAGE_SYNTHETIQUE));
    expect(resultats.filter((r) => r.gravite !== 'conforme')).toEqual([]);
  });

  it('parties sans texte : les règles de mise en page renvoient « contrôle impossible »', () => {
    const document = documentSynthetique(11, { vides: [2, 3, 4, 5, 6, 7, 8, 9] });
    for (const id of ['R05', 'R06', 'R07', 'R08', 'R09', 'R10', 'R12', 'R13']) {
      const regle = REGLES.find((r) => r.id === id);
      const resultats = regle?.verifier(document, DECOUPAGE_SYNTHETIQUE) ?? [];
      expect(resultats.map((r) => [r.id, r.gravite])).toEqual([[id, 'info']]);
    }
  });
});
