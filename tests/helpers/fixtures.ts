import { existsSync, readFileSync } from 'node:fs';
import { extraireDocument } from '../../src/checker/extract';
import type { ModeleDocument, ParametresDossier } from '../../src/checker/types';
import { DECOUPAGES, type FixtureTexte } from './attendus';

export { DECOUPAGES, type FixtureTexte } from './attendus';

/** Concours, discipline et nom de fichier inconnus : R18 et R19 ne s'appliquent pas. */
export const PARAMETRES_INCONNUS: ParametresDossier = { concours: null, discipline: null, nomFichier: null };

export type Fixture = FixtureTexte | '05_scanne' | '06_protege';

function cheminFixture(nom: Fixture): URL {
  return new URL(`../fixtures/${nom}.pdf`, import.meta.url);
}

/** Vrai si le PDF est présent : deux exports Word manquent encore. */
export function fixtureDisponible(nom: Fixture): boolean {
  return existsSync(cheminFixture(nom));
}

/** Fixtures avec couche texte effectivement présentes dans tests/fixtures. */
export const FIXTURES_TEXTE = (Object.keys(DECOUPAGES) as FixtureTexte[]).filter(fixtureDisponible);

export function lireFixture(nom: Fixture): Uint8Array {
  return new Uint8Array(readFileSync(cheminFixture(nom)));
}

const cache = new Map<Fixture, Promise<ModeleDocument>>();

export function chargerFixture(nom: Fixture): Promise<ModeleDocument> {
  let document = cache.get(nom);
  if (!document) {
    document = extraireDocument(lireFixture(nom));
    cache.set(nom, document);
  }
  return document;
}
