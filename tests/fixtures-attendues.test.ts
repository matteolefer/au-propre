/**
 * Le tableau « Résultats attendus » de tests/fixtures/README.md : chaque
 * fixture déclenche les règles attendues, et seulement elles (SPEC §8).
 * R01 donne une simple information sur ces couvertures fictives (« à confirmer »).
 */
import { describe, expect, it } from 'vitest';
import { REGLES, verifierLisibilite } from '../src/checker/rules';
import type { Gravite } from '../src/checker/types';
import { chargerFixture, DECOUPAGES, fixtureDisponible, PARAMETRES_INCONNUS, type FixtureTexte } from './helpers/fixtures';

type Attendus = Partial<Record<string, Gravite>>;

const ATTENDUS: Record<FixtureTexte, Attendus> = {
  '01_conforme': { R05: 'avertissement' },
  '01_conforme_word': {},
  '02_partie1_3pages': { R02: 'erreur', R05: 'avertissement' },
  '02_partie1_3pages_word': { R02: 'erreur' },
  '03_calibri': { R05: 'erreur' },
  '03_calibri_word': { R05: 'erreur' },
  '04_marges_2cm': { R08: 'erreur', R05: 'avertissement' },
  '04_marges_2cm_word': { R08: 'erreur' },
};

/** Règles signalées (ni conformes ni simple information), avec leur gravité la plus forte. */
async function signalees(nom: FixtureTexte): Promise<Attendus> {
  const document = await chargerFixture(nom);
  const resultats = REGLES.flatMap((regle) => regle.verifier(document, DECOUPAGES[nom], PARAMETRES_INCONNUS));
  const ordre: Gravite[] = ['bloquant', 'erreur', 'avertissement'];
  const parRegle: Attendus = {};
  for (const resultat of resultats) {
    if (!ordre.includes(resultat.gravite)) continue;
    const actuelle = parRegle[resultat.id];
    if (actuelle === undefined || ordre.indexOf(resultat.gravite) < ordre.indexOf(actuelle)) {
      parRegle[resultat.id] = resultat.gravite;
    }
  }
  return parRegle;
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
