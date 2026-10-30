/**
 * Recherche d'expressions dans le texte des pages, pour les règles de contenu.
 */
import { LONGUEUR_TITRE_MAX, PART_LIGNE_PLEINE } from './measure';
import { bornesHorizontales, estLignePleine, regrouperEnLignes, type Ligne } from './texte';
import type { PageModele } from './types';

/** Texte comparable : sans accents, en minuscules, apostrophes et tirets unifiés, espaces réduites. */
export function normaliser(texte: string): string {
  return texte
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/\s+/gu, ' ')
    .trim();
}

export interface TexteDePage {
  numeroPage: number;
  lignes: Ligne[];
  /** Texte normalisé de chaque ligne. */
  textes: string[];
  /** Texte normalisé de la page, lignes jointes par une espace : une expression coupée en fin de ligne reste trouvable. */
  texte: string;
  /** Position du début de chaque ligne dans `texte`. */
  debuts: number[];
}

export function texteDePage(page: PageModele): TexteDePage {
  const lignes = regrouperEnLignes(page);
  const textes = lignes.map((ligne) => normaliser(ligne.texte));
  const debuts: number[] = [];
  let position = 0;
  for (const texte of textes) {
    debuts.push(position);
    position += texte.length + 1;
  }
  return { numeroPage: page.numero, lignes, textes, texte: textes.join(' '), debuts };
}

export interface Occurrence {
  /** Texte trouvé, normalisé. */
  trouve: string;
  /** Indice de la ligne où commence l'occurrence. */
  ligne: number;
  /** Position de l'occurrence dans le texte de cette ligne. */
  positionDansLigne: number;
}

/** Toutes les occurrences d'un motif (drapeau « g » ajouté si besoin) dans le texte d'une page. */
export function rechercher(page: TexteDePage, motif: RegExp): Occurrence[] {
  const global = motif.flags.includes('g') ? motif : new RegExp(motif.source, `${motif.flags}g`);
  return [...page.texte.matchAll(global)].map((correspondance) => {
    const index = correspondance.index;
    let ligne = 0;
    while (ligne + 1 < page.debuts.length && (page.debuts[ligne + 1] ?? Infinity) <= index) ligne++;
    return { trouve: correspondance[0], ligne, positionDansLigne: index - (page.debuts[ligne] ?? 0) };
  });
}

/** Vrai si la ligne commence un paragraphe : première ligne de la page, ou ligne précédente non pleine. */
export function estDebutDeParagraphe(lignes: readonly Ligne[], indice: number): boolean {
  const precedente = lignes[indice - 1];
  if (!precedente) return true;
  return !estLignePleine(precedente, bornesHorizontales(lignes), PART_LIGNE_PLEINE);
}

/**
 * Vrai si la ligne ressemble à un titre : courte, en début de paragraphe, et
 * sans point final (une phrase courte qui termine par un point n'en est pas un).
 */
export function estTitre(lignes: readonly Ligne[], indice: number): boolean {
  const ligne = lignes[indice];
  if (!ligne) return false;
  const texte = ligne.texte.trim();
  return texte.length <= LONGUEUR_TITRE_MAX && estDebutDeParagraphe(lignes, indice) && !/[.!?…]$/.test(texte);
}
