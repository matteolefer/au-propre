/**
 * Découpage du dossier : proposition d'après les titres des parties, puis
 * construction du découpage à partir des pages de début confirmées par le
 * candidat. Rien n'est analysé avant cette confirmation (SPEC §4).
 */
import { estDebutDeParagraphe, numeroDeFinDeLigne, texteDePage } from './recherche';
import { bornesHorizontales } from './texte';
import type { Decoupage, ModeleDocument, PageModele } from './types';

/** Page de début de chaque section. La couverture occupe les pages avant la partie 1. */
export interface DebutsDecoupage {
  partie1: number;
  partie2: number;
  /** null : pas d'annexes, la partie 2 va jusqu'à la fin du document. */
  annexes: number | null;
}

/** « detecte » : d'après un titre trouvé dans le document ; « suppose » : structure courante, à vérifier. */
export type Origine = 'detecte' | 'suppose';

export interface PropositionDecoupage {
  debuts: DebutsDecoupage;
  origines: Record<keyof DebutsDecoupage, Origine>;
}

/** Numérotation facultative avant le titre : « I. », « 1 - », « A) ». */
const NUMEROTATION = String.raw`(?:(?:[ivx]+|\d+|[a-d])\s*[.)\-–—:]\s*)?`;
/** Après le libellé : fin de ligne, ou ponctuation qui annonce le titre (« : », « - », « . »). */
const FIN_DE_LIBELLE = String.raw`\s*(?:$|[:.\-–—)])`;

/** Titres reconnus, sur le texte normalisé (sans accents ni majuscules). */
const TITRES = {
  partie1: new RegExp(`^${NUMEROTATION}(?:(?:premiere|1re|1ere)\\s*partie|partie\\s*(?:1|i|une))${FIN_DE_LIBELLE}`),
  partie2: new RegExp(
    `^${NUMEROTATION}(?:(?:seconde|deuxieme|2de|2nde|2e|2eme)\\s*partie|partie\\s*(?:2|ii|deux))${FIN_DE_LIBELLE}`,
  ),
  // « Annexes », « Annexe 1 : … », « ANNEXE A - … » ; pas « Annexe 3 montre que… ».
  annexes: new RegExp(`^${NUMEROTATION}annexes?(?:\\s*(?:n[°o]\\s*)?(?:\\d+|[ivx]+|[a-z]))?${FIN_DE_LIBELLE}`),
} as const;

/**
 * Une annexe commence en haut de page : son titre figure dans les premières
 * lignes (un en-tête peut le précéder). Une liste d'annexes à la fin de la
 * partie 2 n'ouvre donc pas les annexes.
 */
const LIGNES_TITRE_ANNEXE = 3;

/** Vrai si la page contient le titre : ligne en début de paragraphe, hors sommaire. */
function pageContientTitre(page: PageModele, titre: RegExp, lignesMax = Infinity): boolean {
  const texte = texteDePage(page);
  if (texte.lignes.length === 0) return false;
  const droite = bornesHorizontales(texte.lignes).droite;
  return texte.lignes.some(
    (ligne, i) =>
      i < lignesMax &&
      titre.test(texte.textes[i] ?? '') &&
      estDebutDeParagraphe(texte.lignes, i) &&
      // Une entrée de sommaire (« Première partie ........ 2 ») n'ouvre pas la partie.
      numeroDeFinDeLigne(ligne, droite) === null,
  );
}

/** Première page, à partir de `depuis`, qui contient le titre. */
function chercherTitre(document: ModeleDocument, titre: RegExp, depuis: number, lignesMax?: number): number | null {
  const page = document.pages.find((p) => p.numero >= depuis && pageContientTitre(p, titre, lignesMax));
  return page?.numero ?? null;
}

/** Structure courante d'un dossier : couverture, 2 pages, 6 pages, puis annexes. */
const PAGES_PARTIE1_COURANTES = 2;
const PAGES_PARTIE2_COURANTES = 6;

/**
 * Propose les pages de début d'après les titres « Première partie »,
 * « Seconde partie » et « Annexe ». Un titre introuvable est remplacé par la
 * structure courante, bornée au nombre de pages, et marqué « supposé ».
 */
export function proposerDecoupage(document: ModeleDocument): PropositionDecoupage {
  const total = Math.max(document.pages.length, 1);
  const borner = (page: number) => Math.min(Math.max(page, 1), total);

  const partie1Trouvee = chercherTitre(document, TITRES.partie1, 1);
  const partie2Trouvee = chercherTitre(document, TITRES.partie2, (partie1Trouvee ?? 1) + 1);
  const debutAnnexes = (partie2Trouvee ?? (partie1Trouvee ?? 1) + 1) + 1;
  const annexesTrouvees = chercherTitre(document, TITRES.annexes, debutAnnexes, LIGNES_TITRE_ANNEXE);

  const partie1 =
    partie1Trouvee ?? (partie2Trouvee !== null ? Math.max(1, Math.min(2, partie2Trouvee - 1)) : borner(total >= 3 ? 2 : 1));
  const partie2 = partie2Trouvee ?? borner(partie1 + PAGES_PARTIE1_COURANTES);
  let annexes = annexesTrouvees;
  if (annexes === null) {
    // Plus de 6 pages après le début de la partie 2 : les suivantes sont probablement des annexes.
    const suppose = partie2 + PAGES_PARTIE2_COURANTES;
    annexes = suppose <= total ? suppose : null;
  }

  return {
    debuts: { partie1, partie2, annexes },
    origines: {
      partie1: partie1Trouvee !== null ? 'detecte' : 'suppose',
      partie2: partie2Trouvee !== null ? 'detecte' : 'suppose',
      annexes: annexesTrouvees !== null ? 'detecte' : 'suppose',
    },
  };
}

export type ErreurDecoupage =
  | { champ: keyof DebutsDecoupage; code: 'hors-document' }
  | { champ: 'partie2'; code: 'partie2-avant-partie1' }
  | { champ: 'annexes'; code: 'annexes-avant-partie2' };

export type ResultatDecoupage = { ok: true; decoupage: Decoupage } | { ok: false; erreurs: ErreurDecoupage[] };

/**
 * Découpage à partir des pages de début : la couverture occupe les pages
 * avant la partie 1 (aucune si la partie 1 commence page 1), chaque section
 * va jusqu'à la suivante, la dernière jusqu'à la fin du document.
 */
export function construireDecoupage(debuts: DebutsDecoupage, totalPages: number): ResultatDecoupage {
  const erreurs: ErreurDecoupage[] = [];
  const dansLeDocument = (page: number) => Number.isInteger(page) && page >= 1 && page <= totalPages;
  if (!dansLeDocument(debuts.partie1)) erreurs.push({ champ: 'partie1', code: 'hors-document' });
  if (!dansLeDocument(debuts.partie2)) erreurs.push({ champ: 'partie2', code: 'hors-document' });
  else if (debuts.partie2 <= debuts.partie1) erreurs.push({ champ: 'partie2', code: 'partie2-avant-partie1' });
  if (debuts.annexes !== null) {
    if (!dansLeDocument(debuts.annexes)) erreurs.push({ champ: 'annexes', code: 'hors-document' });
    else if (debuts.annexes <= debuts.partie2) erreurs.push({ champ: 'annexes', code: 'annexes-avant-partie2' });
  }
  if (erreurs.length > 0) return { ok: false, erreurs };

  const finPartie2 = debuts.annexes === null ? totalPages : debuts.annexes - 1;
  return {
    ok: true,
    decoupage: {
      couverture: debuts.partie1 > 1 ? { debut: 1, fin: debuts.partie1 - 1 } : null,
      partie1: { debut: debuts.partie1, fin: debuts.partie2 - 1 },
      partie2: { debut: debuts.partie2, fin: finPartie2 },
      annexes: debuts.annexes === null ? null : { debut: debuts.annexes, fin: totalPages },
    },
  };
}

/** Section d'une page selon le découpage, pour regrouper les miniatures. */
export type Section = 'couverture' | 'partie1' | 'partie2' | 'annexes';

export function sectionDeLaPage(numero: number, decoupage: Decoupage): Section {
  if (decoupage.couverture && numero <= decoupage.couverture.fin) return 'couverture';
  if (numero <= decoupage.partie1.fin) return 'partie1';
  if (numero <= decoupage.partie2.fin) return 'partie2';
  return 'annexes';
}
