/**
 * Le tableau « Résultats attendus » de tests/fixtures/README.md : chaque
 * fixture déclenche les règles attendues, et seulement elles (SPEC §8).
 * R01 donne une simple information sur ces couvertures fictives (« à confirmer »).
 */
import { describe, expect, it } from 'vitest';
import { REGLES, verifierLisibilite } from '../src/checker/rules';
import { ATTENDUS, plusFortesGravites, type Attendus } from './helpers/attendus';
import { chargerFixture, DECOUPAGES, fixtureDisponible, PARAMETRES_INCONNUS, type FixtureTexte } from './helpers/fixtures';

/** Règles signalées (ni conformes ni simple information), avec leur gravité la plus forte. */
async function signalees(nom: FixtureTexte): Promise<Attendus> {
  const document = await chargerFixture(nom);
  return plusFortesGravites(REGLES.flatMap((regle) => regle.verifier(document, DECOUPAGES[nom], PARAMETRES_INCONNUS)));
}

describe('résultats attendus du README sur les fixtures', () => {
  for (const [nom, attendus] of Object.entries(ATTENDUS) as [FixtureTexte, Attendus][]) {
    const libelle = `${nom} : ${Object.entries(attendus).map(([id, g]) => `${id} ${g}`).join(', ') || 'aucune règle signalée'}`;
    it.skipIf(!fixtureDisponible(nom))(libelle, async () => {
      expect(verifierLisibilite(await chargerFixture(nom)).gravite).toBe('conforme');
      expect(await signalees(nom)).toEqual(attendus);
    });
  }

  it('05_scanne : R00 bloquant, l’analyse s’arrête', async () => {
    expect(verifierLisibilite(await chargerFixture('05_scanne')).gravite).toBe('bloquant');
  });
});
