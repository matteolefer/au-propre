import { A4 } from '../../src/checker/measure';
import type { BlocTexte, Decoupage, ModeleDocument, PageModele } from '../../src/checker/types';

const BLOC: BlocTexte = {
  texte: 'Texte',
  police: 'ArialMT',
  policeBrute: 'ABCDEF+ArialMT',
  taille: 11,
  couleur: '#000000',
  x: 70.87,
  y: 100,
  largeur: 400,
  hauteur: 11,
};

interface OptionsDocument {
  /** Taille particulière de certaines pages : numéro → [largeur, hauteur] en points. */
  formats?: Record<number, readonly [number, number]>;
  /** Pages sans texte ni image. */
  vides?: readonly number[];
}

/** Document minimal pour les cas que les fixtures ne couvrent pas. */
export function documentSynthetique(nombrePages: number, options: OptionsDocument = {}): ModeleDocument {
  const pages: PageModele[] = Array.from({ length: nombrePages }, (_, i) => {
    const numero = i + 1;
    const [largeur, hauteur] = options.formats?.[numero] ?? [A4.largeur, A4.hauteur];
    return {
      numero,
      largeur,
      hauteur,
      rotation: 0,
      blocs: options.vides?.includes(numero) ? [] : [BLOC],
      liens: [],
      images: [],
    };
  });
  return { pages, contientTexte: pages.some((page) => page.blocs.length > 0) };
}

// --- Dossier synthétique ligne par ligne ---------------------------------------

/** Hauteur de la boîte d'une ligne, en multiple de la taille (ascendante 0,905 + descendante 0,212 d'Arial). */
const HAUTEUR_BOITE = 1.117;
const PT_PAR_CM = 28.3465;

export interface OptionsPage {
  margeGaucheCm?: number;
  margeDroiteCm?: number;
  taille?: number;
  police?: string;
  couleur?: string | null;
  /** Écart entre deux lignes d'un paragraphe, en multiple de la taille (1,15 : interligne simple d'Arial). */
  interligne?: number;
  /** Retrait de la première ligne de chaque paragraphe, en points. */
  retraitPt?: number;
  /** Texte du pied de page ; null : pas de pied de page. Par défaut, le numéro de la page. */
  pied?: string | null;
  /** Distance entre le bas du pied de page et le bord bas. */
  piedCm?: number;
  /** Distance entre le haut du texte et le bord haut. */
  hautCm?: number;
  /** Ligne de titre en tête de page. */
  titre?: { texte: string; taille?: number; police?: string };
}

export const DECOUPAGE_SYNTHETIQUE: Decoupage = {
  couverture: { debut: 1, fin: 1 },
  partie1: { debut: 2, fin: 3 },
  partie2: { debut: 4, fin: 9 },
  annexes: { debut: 10, fin: 11 },
};

function bloc(texte: string, x: number, y: number, largeur: number, taille: number, police: string, couleur: string | null): BlocTexte {
  return { texte, police, policeBrute: `ABCDEF+${police}`, taille, couleur, x, y, largeur, hauteur: taille * HAUTEUR_BOITE };
}

/**
 * Page A4 conforme par défaut : 5 paragraphes de 6 lignes en Arial 11 noir,
 * marges de 2,5 cm, interligne simple, numéro en pied de page à 1,25 cm.
 */
export function pageStandard(numero: number, options: OptionsPage = {}): PageModele {
  const taille = options.taille ?? 11;
  const police = options.police ?? 'ArialMT';
  const couleur = options.couleur === undefined ? '#000000' : options.couleur;
  const gauche = (options.margeGaucheCm ?? 2.5) * PT_PAR_CM;
  const droite = A4.largeur - (options.margeDroiteCm ?? 2.5) * PT_PAR_CM;
  const pas = (options.interligne ?? 1.15) * taille;
  const retrait = options.retraitPt ?? 0;
  const blocs: BlocTexte[] = [];

  let y = (options.hautCm ?? 2.5) * PT_PAR_CM;
  if (options.titre) {
    const tailleTitre = options.titre.taille ?? taille;
    blocs.push(bloc(options.titre.texte, gauche, y, 200, tailleTitre, options.titre.police ?? 'Arial-BoldMT', couleur));
    y += tailleTitre * 1.6;
  }
  for (let paragraphe = 0; paragraphe < 5; paragraphe++) {
    for (let ligne = 0; ligne < 6; ligne++) {
      const debut = ligne === 0 ? gauche + retrait : gauche;
      // Lignes justifiées jusqu'à la marge droite, sauf la dernière du paragraphe.
      const fin = ligne === 5 ? gauche + 0.6 * (droite - gauche) : droite;
      blocs.push(bloc('Texte d’un paragraphe du dossier, écrit pour les tests.', debut, y, fin - debut, taille, police, couleur));
      y += pas;
    }
    y += 6;
  }
  const pied = options.pied === undefined ? String(numero) : options.pied;
  if (pied !== null) {
    const bas = A4.hauteur - (options.piedCm ?? 1.25) * PT_PAR_CM;
    blocs.push(bloc(pied, A4.largeur / 2 - 5, bas - taille * HAUTEUR_BOITE, 10, taille, police, couleur));
  }
  return { numero, largeur: A4.largeur, hauteur: A4.hauteur, rotation: 0, blocs, liens: [], images: [] };
}

/** Dossier de 11 pages (découpage DECOUPAGE_SYNTHETIQUE), couverture en page 1 ; `pages` modifie certaines pages. */
export function documentStandard(pages: Record<number, OptionsPage> = {}, communes: OptionsPage = {}): ModeleDocument {
  return {
    pages: Array.from({ length: 11 }, (_, i) =>
      i === 0 ? pageCouverture() : pageStandard(i + 1, { ...communes, ...pages[i + 1] }),
    ),
    contientTexte: true,
  };
}

// --- Pages écrites ligne par ligne ---------------------------------------------

/** Une ligne : un texte (un seul bloc, largeur proportionnelle à sa longueur) ou plusieurs blocs. */
export type LigneSynthetique = string | readonly { texte: string; x?: number; largeur?: number }[];

const GAUCHE = 2.5 * PT_PAR_CM;
const DROITE = A4.largeur - 2.5 * PT_PAR_CM;

/**
 * Page dont on choisit chaque ligne. Une chaîne vide laisse une ligne blanche.
 * Une ligne d'environ 90 caractères ou plus occupe toute la largeur du texte.
 */
export function pageDeLignes(numero: number, lignes: readonly LigneSynthetique[], pied: string | null = String(numero)): PageModele {
  const taille = 11;
  const blocs: BlocTexte[] = [];
  let y = 2.5 * PT_PAR_CM;
  for (const ligne of lignes) {
    if (typeof ligne === 'string') {
      if (ligne !== '') {
        blocs.push(bloc(ligne, GAUCHE, y, Math.min(DROITE - GAUCHE, ligne.length * taille * 0.46), taille, 'ArialMT', '#000000'));
      }
    } else {
      for (const morceau of ligne) {
        const largeur = morceau.largeur ?? morceau.texte.length * taille * 0.5;
        blocs.push(bloc(morceau.texte, morceau.x ?? GAUCHE, y, largeur, taille, 'ArialMT', '#000000'));
      }
    }
    y += 1.15 * taille;
  }
  if (pied !== null) {
    const bas = A4.hauteur - 1.25 * PT_PAR_CM;
    blocs.push(bloc(pied, A4.largeur / 2 - 5, bas - taille * HAUTEUR_BOITE, 10, taille, 'ArialMT', '#000000'));
  }
  return { numero, largeur: A4.largeur, hauteur: A4.hauteur, rotation: 0, blocs, liens: [], images: [] };
}

/** Bloc aligné sur la marge droite, pour un numéro de page dans un sommaire. */
export function aDroite(texte: string): { texte: string; x: number; largeur: number } {
  return { texte, x: DROITE - texte.length * 5.5, largeur: texte.length * 5.5 };
}

/** Couverture synthétique, avec les mots du formulaire. */
export function pageCouverture(session = 2027): PageModele {
  return pageDeLignes(
    1,
    [
      'PAGE DE COUVERTURE',
      `Concours : CAPES interne – Section : Lettres modernes – Session ${session}`,
      'Dossier de reconnaissance des acquis de l’expérience professionnelle (RAEP)',
      'Nom : CANDIDAT',
      'Prénom : Test',
      'J’atteste sur l’honneur l’authenticité de toutes les informations figurant dans ce dossier.',
      'Signature du candidat :',
    ],
    null,
  );
}

/** Remplace une page d'un dossier synthétique. */
export function avecPage(document: ModeleDocument, page: PageModele): ModeleDocument {
  return { ...document, pages: document.pages.map((p) => (p.numero === page.numero ? page : p)) };
}
