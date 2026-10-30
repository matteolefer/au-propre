import type { Plage } from './types';

/** 1 cm = 28,3465 pt (SPEC §5). */
export const PT_PAR_CM = 28.3465;

/** Format A4 en points, portrait (SPEC §5). */
export const A4 = { largeur: 595.28, hauteur: 841.89 } as const;

/** Tolérance par défaut des mesures, en points (SPEC §5). */
export const TOLERANCE_PT = 2;

export function cmEnPt(cm: number): number {
  return cm * PT_PAR_CM;
}

export function ptEnCm(pt: number): number {
  return pt / PT_PAR_CM;
}

export function egalAvecTolerance(mesure: number, attendu: number, tolerance = TOLERANCE_PT): boolean {
  return Math.abs(mesure - attendu) <= tolerance;
}

/** Vrai si la page mesure 21 × 29,7 cm, en portrait ou en paysage. */
export function estA4(largeur: number, hauteur: number): boolean {
  const portrait = egalAvecTolerance(largeur, A4.largeur) && egalAvecTolerance(hauteur, A4.hauteur);
  const paysage = egalAvecTolerance(largeur, A4.hauteur) && egalAvecTolerance(hauteur, A4.largeur);
  return portrait || paysage;
}

export function nombrePages(plage: Plage): number {
  return plage.fin - plage.debut + 1;
}

export function pagesDe(plage: Plage): number[] {
  return Array.from({ length: nombrePages(plage) }, (_, i) => plage.debut + i);
}

// --- Seuils officiels ou fixés par SPEC §5 -------------------------------------

/** R06 : taille du corps de texte, Arial 11 (S1, S2). Hors de cet intervalle : erreur. */
export const TAILLE_CORPS_MIN_PT = 10.5;
export const TAILLE_CORPS_MAX_PT = 11.5;

/** R08 : marges gauche et droite (S1, S2). */
export const MARGE_LATERALE_CM = 2.5;

/** R09 : distance de l'en-tête et du pied de page au bord (S1, S2). */
export const DISTANCE_EN_TETE_PIED_CM = 1.25;

/** R07 : écart médian entre lignes, rapporté à la taille, au-delà duquel l'interligne n'est plus simple. */
export const RAPPORT_INTERLIGNE_MAX = 1.35;

/** R10 : décalage de première ligne au-delà duquel on parle de retrait. */
export const RETRAIT_MIN_PT = 5;

// --- Seuils de calibration -----------------------------------------------------
// Non officiels : SPEC ne les chiffre pas. Calés sur les fixtures ; les règles
// qui en dépendent restent en avertissement.

/** R06 : écart avec la taille du corps au-delà duquel une ligne est « d'une autre taille ». */
export const ECART_TAILLE_PT = 0.5;

/** R06, R10 : lignes de cette longueur ou moins ignorées (exposants, appels de note, numéros). */
export const LONGUEUR_FRAGMENT_MAX = 3;

/** R07, R10 : une ligne est « pleine » si elle atteint cette part de la largeur du texte. */
export const PART_LIGNE_PLEINE = 0.8;

/** R07 : écarts entre lignes retenus, en multiples de la taille du corps. */
export const ECART_LIGNES_MIN = 0.8;
export const ECART_LIGNES_MAX = 2.5;

/** R07 : nombre minimal d'écarts mesurés pour conclure. */
export const ECARTS_INTERLIGNE_MIN = 5;

/** R10 : nombre minimal de paragraphes en retrait pour parler de retrait récurrent. */
export const RETRAITS_RECURRENTS_MIN = 2;

/** R13 : écart minimal entre composantes RVB (0 à 255) pour qu'un texte soit « en couleur ». */
export const ECART_RVB_COULEUR_MIN = 40;
