import { existsSync, readFileSync } from 'node:fs';
import { extraireDocument } from '../../src/checker/extract';
import type { Decoupage, ModeleDocument, ParametresDossier } from '../../src/checker/types';

/** Discipline et nom de fichier inconnus : R18 et R19 ne s'appliquent pas. */
export const PARAMETRES_INCONNUS: ParametresDossier = { discipline: null, nomFichier: null };

const DECOUPAGE_STANDARD: Decoupage = {
  couverture: { debut: 1, fin: 1 },
  partie1: { debut: 2, fin: 3 },
  partie2: { debut: 4, fin: 9 },
  annexes: { debut: 10, fin: 11 },
};

const DECOUPAGE_PARTIE1_3PAGES: Decoupage = {
  couverture: { debut: 1, fin: 1 },
  partie1: { debut: 2, fin: 4 },
  partie2: { debut: 5, fin: 10 },
  annexes: { debut: 11, fin: 12 },
};

/**
 * Découpage de chaque fixture, d'après tests/fixtures/README.md. Le test
 * d'extraction vérifie que les titres des parties tombent bien sur ces pages.
 * Les exports Word (suffixe _word) ont le découpage de leur version LibreOffice.
 */
export const DECOUPAGES = {
  '01_conforme': DECOUPAGE_STANDARD,
  '01_conforme_word': DECOUPAGE_STANDARD,
  '02_partie1_3pages': DECOUPAGE_PARTIE1_3PAGES,
  '02_partie1_3pages_word': DECOUPAGE_PARTIE1_3PAGES,
  '03_calibri': DECOUPAGE_STANDARD,
  '03_calibri_word': DECOUPAGE_STANDARD,
  '04_marges_2cm': DECOUPAGE_STANDARD,
  '04_marges_2cm_word': DECOUPAGE_STANDARD,
} as const satisfies Record<string, Decoupage>;

export type FixtureTexte = keyof typeof DECOUPAGES;
export type Fixture = FixtureTexte | '05_scanne';

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
