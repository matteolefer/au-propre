/**
 * Modèle de document produit par extract.ts et consommé par les règles.
 * Unités : points PDF. Origine : coin haut gauche de la page telle qu'elle
 * s'affiche (rotation et CropBox appliquées), y croissant vers le bas.
 */

export interface Rectangle {
  x: number;
  y: number;
  largeur: number;
  hauteur: number;
}

/** Un élément de texte de pdf.js : un fragment de ligne dans un même style. */
export interface BlocTexte extends Rectangle {
  texte: string;
  /** Nom de police sans préfixe de sous-ensemble, ex. « LiberationSans ». */
  police: string;
  /** Nom tel qu'inscrit dans le PDF, ex. « BCDEEE+LiberationSans ». */
  policeBrute: string;
  /** Taille de police effective, en points. */
  taille: number;
  /** Couleur de remplissage « #rrggbb », ou null si elle n'a pas pu être déterminée. */
  couleur: string | null;
}

export interface Lien extends Rectangle {
  url: string | null;
}

export type ImageModele = Rectangle;

export interface PageModele {
  /** Numéro de page, à partir de 1. */
  numero: number;
  largeur: number;
  hauteur: number;
  rotation: number;
  blocs: BlocTexte[];
  liens: Lien[];
  images: ImageModele[];
}

export interface ModeleDocument {
  pages: PageModele[];
  /** Faux si aucune page ne contient de texte (PDF scanné ou imprimé en image). */
  contientTexte: boolean;
}

/** Plage de pages, numérotées à partir de 1, bornes incluses. */
export interface Plage {
  debut: number;
  fin: number;
}

export interface Decoupage {
  couverture: Plage | null;
  partie1: Plage;
  partie2: Plage;
  annexes: Plage | null;
}

export type Gravite = 'bloquant' | 'erreur' | 'avertissement' | 'conforme' | 'info';

export interface Source {
  libelle: string;
  url: string;
}

export interface ResultatRegle {
  /** Ex. « R05 ». */
  id: string;
  gravite: Gravite;
  titre: string;
  /** Ce qui a été mesuré, avec les pages concernées. */
  detail: string;
  pages?: number[];
  /** Comment corriger, concrètement. */
  correction: string;
  /** Sources officielles de la règle (vide pour R00, qui n'est pas une règle officielle). */
  sources: Source[];
}

/** Informations fournies par le candidat en plus du PDF. */
export interface ParametresDossier {
  /** Identifiant de la discipline choisie à l'inscription (ex. « histoire-geographie »), si connue. */
  discipline: string | null;
  /** Nom du fichier déposé, si connu. */
  nomFichier: string | null;
}
