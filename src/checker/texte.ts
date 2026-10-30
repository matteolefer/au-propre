/**
 * Outils communs aux règles de mise en page : sélection des pages des parties,
 * valeurs majoritaires et regroupement des blocs en lignes.
 */
import { pagesDe } from './measure';
import type { BlocTexte, Decoupage, ModeleDocument, PageModele } from './types';

/** Numéros des pages des parties 1 et 2, où portent les mesures (SPEC §5). */
export function pagesDesParties(decoupage: Decoupage): number[] {
  return [...pagesDe(decoupage.partie1), ...pagesDe(decoupage.partie2)];
}

export function pagesDuDocument(document: ModeleDocument, numeros: readonly number[]): PageModele[] {
  return numeros
    .map((numero) => document.pages[numero - 1])
    .filter((page): page is PageModele => page !== undefined);
}

/** Nombre de caractères visibles : poids d'un bloc dans les calculs de majorité. */
export function nombreCaracteres(texte: string): number {
  return texte.replace(/\s+/gu, '').length;
}

/** Vrai si le texte contient au moins une lettre ou un chiffre. */
export function contientDuTexte(texte: string): boolean {
  return /[\p{L}\p{N}]/u.test(texte);
}

/** Valeur la plus fréquente, pondérée par le nombre de caractères. */
export function majoritaire<T extends string | number>(
  blocs: readonly BlocTexte[],
  cle: (bloc: BlocTexte) => T,
): T | undefined {
  const comptes = new Map<T, number>();
  for (const bloc of blocs) {
    const valeur = cle(bloc);
    comptes.set(valeur, (comptes.get(valeur) ?? 0) + nombreCaracteres(bloc.texte));
  }
  let meilleure: T | undefined;
  let maximum = -1;
  for (const [valeur, compte] of comptes) {
    if (compte > maximum) {
      meilleure = valeur;
      maximum = compte;
    }
  }
  return meilleure;
}

export function mediane(valeurs: readonly number[]): number | undefined {
  if (valeurs.length === 0) return undefined;
  const triees = [...valeurs].sort((a, b) => a - b);
  const milieu = Math.floor(triees.length / 2);
  return triees.length % 2 === 1 ? triees[milieu] : ((triees[milieu - 1] ?? 0) + (triees[milieu] ?? 0)) / 2;
}

export interface Ligne {
  numeroPage: number;
  /** Haut et bas de la boîte de la ligne, en points depuis le haut de la page. */
  y: number;
  bas: number;
  /** Haut du bloc principal : sert à mesurer l'écart entre deux lignes. */
  yReference: number;
  xDebut: number;
  xFin: number;
  /** Taille du bloc principal (celui qui a le plus de caractères). */
  taille: number;
  texte: string;
  blocs: BlocTexte[];
}

/**
 * Regroupe les blocs d'une page en lignes. Un bloc rejoint une ligne si son
 * centre vertical tombe dans la boîte de la ligne : un exposant reste ainsi
 * sur sa ligne. Les lignes sont triées de haut en bas.
 */
export function regrouperEnLignes(page: PageModele): Ligne[] {
  // Les blocs les plus grands d'abord : les lignes se forment autour du texte
  // courant, puis les exposants et indices s'y rattachent.
  const blocs = page.blocs
    .filter((bloc) => bloc.texte.trim() !== '')
    .sort((a, b) => b.taille - a.taille || a.y + a.hauteur / 2 - (b.y + b.hauteur / 2));
  const groupes: { y: number; bas: number; blocs: BlocTexte[] }[] = [];
  for (const bloc of blocs) {
    const centre = bloc.y + bloc.hauteur / 2;
    const groupe = groupes.find((g) => centre >= g.y && centre <= g.bas);
    if (groupe) {
      groupe.blocs.push(bloc);
      groupe.y = Math.min(groupe.y, bloc.y);
      groupe.bas = Math.max(groupe.bas, bloc.y + bloc.hauteur);
    } else {
      groupes.push({ y: bloc.y, bas: bloc.y + bloc.hauteur, blocs: [bloc] });
    }
  }
  return groupes
    .map((groupe) => {
      const ordonnes = [...groupe.blocs].sort((a, b) => a.x - b.x);
      const principal = ordonnes.reduce((a, b) => (nombreCaracteres(b.texte) > nombreCaracteres(a.texte) ? b : a));
      return {
        numeroPage: page.numero,
        y: groupe.y,
        bas: groupe.bas,
        yReference: principal.y,
        xDebut: Math.min(...ordonnes.map((b) => b.x)),
        xFin: Math.max(...ordonnes.map((b) => b.x + b.largeur)),
        taille: principal.taille,
        texte: ordonnes
          .map((b) => b.texte)
          .join(' ')
          .replace(/\s+/gu, ' ')
          .trim(),
        blocs: ordonnes,
      };
    })
    .sort((a, b) => a.yReference - b.yReference);
}

/** Lignes de texte suivi : au moins une lettre ou un chiffre, plus longues qu'un simple fragment. */
export function estLigneDeTexte(ligne: Ligne, longueurFragmentMax: number): boolean {
  return contientDuTexte(ligne.texte) && nombreCaracteres(ligne.texte) > longueurFragmentMax;
}

/** Bords gauche et droit du texte d'un ensemble de lignes. */
export function bornesHorizontales(lignes: readonly Ligne[]): { gauche: number; droite: number } {
  return {
    gauche: Math.min(...lignes.map((l) => l.xDebut)),
    droite: Math.max(...lignes.map((l) => l.xFin)),
  };
}

/** Une ligne est « pleine » si elle s'étend sur la plus grande partie de la largeur du texte. */
export function estLignePleine(
  ligne: Ligne,
  bornes: { gauche: number; droite: number },
  partMinimale: number,
): boolean {
  return ligne.xFin >= bornes.gauche + partMinimale * (bornes.droite - bornes.gauche);
}

/** Taille majoritaire des blocs, arrondie au dixième de point. */
export function tailleDuCorps(blocs: readonly BlocTexte[]): number | undefined {
  return majoritaire(blocs, (bloc) => Math.round(bloc.taille * 10) / 10);
}
