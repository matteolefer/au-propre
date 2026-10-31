/**
 * Découpage et résultats attendus de chaque fixture, d'après
 * tests/fixtures/README.md. Module de données sans dépendance : partagé par
 * les tests Vitest et les tests Playwright.
 */
import type { Decoupage, Gravite } from '../../src/checker/types';

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
 * Découpage de chaque fixture. Le test d'extraction vérifie que les titres
 * des parties tombent bien sur ces pages. Les exports Word (suffixe _word) ont
 * le découpage de leur version LibreOffice.
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
  // Copie de 01_conforme_word dont la copie et la modification sont interdites, sans mot de passe d'ouverture.
  '07_restrictions': DECOUPAGE_STANDARD,
} as const satisfies Record<string, Decoupage>;

export type FixtureTexte = keyof typeof DECOUPAGES;

export type Attendus = Partial<Record<string, Gravite>>;

/**
 * Règles signalées (ni conformes ni simple information) par chaque fixture,
 * avec leur gravité la plus forte, quand la discipline et le nom du fichier
 * sont inconnus (SPEC §8). R01 donne une simple information sur ces
 * couvertures fictives.
 */
export const ATTENDUS: Record<FixtureTexte, Attendus> = {
  '01_conforme': { R05: 'avertissement' },
  '01_conforme_word': {},
  '02_partie1_3pages': { R02: 'erreur', R05: 'avertissement' },
  '02_partie1_3pages_word': { R02: 'erreur' },
  '03_calibri': { R05: 'erreur' },
  '03_calibri_word': { R05: 'erreur' },
  '04_marges_2cm': { R08: 'erreur', R05: 'avertissement' },
  '04_marges_2cm_word': { R08: 'erreur' },
  '07_restrictions': {},
};

const ORDRE_GRAVITES: readonly Gravite[] = ['bloquant', 'erreur', 'avertissement'];

/** Gravité la plus forte de chaque règle signalée, à partir de couples (règle, gravité). */
export function plusFortesGravites(resultats: readonly { id: string; gravite: Gravite }[]): Attendus {
  const parRegle: Attendus = {};
  for (const { id, gravite } of resultats) {
    if (!ORDRE_GRAVITES.includes(gravite)) continue;
    const actuelle = parRegle[id];
    if (actuelle === undefined || ORDRE_GRAVITES.indexOf(gravite) < ORDRE_GRAVITES.indexOf(actuelle)) parRegle[id] = gravite;
  }
  return parRegle;
}
