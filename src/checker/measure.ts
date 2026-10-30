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
