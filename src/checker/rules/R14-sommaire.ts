import { R14 } from '../../content/rules.fr';
import { LIGNES_SOMMAIRE_MIN, LONGUEUR_TITRE_MAX } from '../measure';
import { estTitre, normaliser, texteDePage } from '../recherche';
import { bornesHorizontales, type Ligne } from '../texte';
import type { Decoupage, ModeleDocument, PageModele, ResultatRegle } from '../types';
import { pagesSaufCouverture } from './commun';

/** Entrée de sommaire avec points de suite : « Introduction ........ 2 ». */
const ENTREE_AVEC_POINTS = /^(.*\p{L}.*?)\s*[.·…]{3,}\s*(\d{1,3})$/u;

/**
 * R14 : pas de sommaire (SPEC §5). Titre « Sommaire » ou « Table des
 * matières », ou forme typique d'une table des matières : plusieurs lignes
 * courtes consécutives terminées par un numéro de page croissant.
 */
export function verifierR14(document: ModeleDocument, decoupage: Decoupage): ResultatRegle[] {
  const pages = pagesSaufCouverture(document, decoupage)
    .filter((page) => contientUnTitreDeSommaire(page) || contientUneTableDesMatieres(page, document.pages.length))
    .map((page) => page.numero);
  const sources = [...R14.sources];
  if (pages.length > 0) {
    return [
      { id: 'R14', gravite: 'avertissement', titre: R14.avertissement.titre, detail: R14.avertissement.detail(pages), pages, correction: R14.avertissement.correction, sources },
    ];
  }
  return [{ id: 'R14', gravite: 'conforme', titre: R14.conforme.titre, detail: R14.conforme.detail, correction: '', sources }];
}

function contientUnTitreDeSommaire(page: PageModele): boolean {
  const texte = texteDePage(page);
  return texte.textes.some((ligne, i) => /^(sommaire|table des matieres)\b/.test(ligne) && estTitre(texte.lignes, i));
}

function contientUneTableDesMatieres(page: PageModele, nombrePages: number): boolean {
  const texte = texteDePage(page);
  if (texte.lignes.length === 0) return false;
  const droite = bornesHorizontales(texte.lignes).droite;
  let serie: number[] = [];
  for (const ligne of texte.lignes) {
    const numero = numeroDeFinDeLigne(ligne, droite);
    const croissant = numero !== null && numero <= nombrePages && (serie.length === 0 || numero >= (serie[serie.length - 1] ?? 0));
    serie = croissant ? [...serie, numero] : numero !== null && numero <= nombrePages ? [numero] : [];
    if (serie.length >= LIGNES_SOMMAIRE_MIN) return true;
  }
  return false;
}

/**
 * Numéro de page qui termine une entrée de sommaire : après des points de
 * suite, ou dans un bloc séparé par une tabulation et aligné sur la marge droite.
 */
function numeroDeFinDeLigne(ligne: Ligne, droiteDuTexte: number): number | null {
  const texte = normaliser(ligne.texte);
  const avecPoints = ENTREE_AVEC_POINTS.exec(texte);
  if (avecPoints && (avecPoints[1] ?? '').length <= LONGUEUR_TITRE_MAX) return Number(avecPoints[2]);

  const dernier = ligne.blocs[ligne.blocs.length - 1];
  const precedents = ligne.blocs.slice(0, -1);
  if (!dernier || precedents.length === 0 || !/^\d{1,3}$/.test(dernier.texte.trim())) return null;
  const finDuTitre = Math.max(...precedents.map((bloc) => bloc.x + bloc.largeur));
  const titre = precedents.map((bloc) => bloc.texte).join(' ').trim();
  const tabulation = dernier.x - finDuTitre >= 2 * dernier.taille;
  const aligneADroite = dernier.x + dernier.largeur >= droiteDuTexte - 10;
  if (!tabulation || !aligneADroite || titre.length > LONGUEUR_TITRE_MAX || !/\p{L}/u.test(titre)) return null;
  return Number(dernier.texte.trim());
}
