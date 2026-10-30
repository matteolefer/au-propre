import { readFileSync } from 'node:fs';
import { extraireDocument } from '../../src/checker/extract';
import type { Decoupage, ModeleDocument } from '../../src/checker/types';

const DECOUPAGE_STANDARD: Decoupage = {
  couverture: { debut: 1, fin: 1 },
  partie1: { debut: 2, fin: 3 },
  partie2: { debut: 4, fin: 9 },
  annexes: { debut: 10, fin: 11 },
};

/**
 * Découpage de chaque fixture, d'après tests/fixtures/README.md. Le test
 * d'extraction vérifie que les titres des parties tombent bien sur ces pages.
 */
export const DECOUPAGES = {
  '01_conforme': DECOUPAGE_STANDARD,
  '02_partie1_3pages': {
    couverture: { debut: 1, fin: 1 },
    partie1: { debut: 2, fin: 4 },
    partie2: { debut: 5, fin: 10 },
    annexes: { debut: 11, fin: 12 },
  },
  '03_calibri': DECOUPAGE_STANDARD,
  '04_marges_2cm': DECOUPAGE_STANDARD,
} as const satisfies Record<string, Decoupage>;

export type FixtureTexte = keyof typeof DECOUPAGES;
export type Fixture = FixtureTexte | '05_scanne';

export const FIXTURES_TEXTE = Object.keys(DECOUPAGES) as FixtureTexte[];

export function lireFixture(nom: Fixture): Uint8Array {
  return new Uint8Array(readFileSync(new URL(`../fixtures/${nom}.pdf`, import.meta.url)));
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
