import { R14 } from '../../content/rules.fr';
import { LIGNES_SOMMAIRE_MIN } from '../measure';
import { estTitre, numeroDeFinDeLigne, texteDePage } from '../recherche';
import { bornesHorizontales } from '../texte';
import type { Decoupage, ModeleDocument, PageModele, ResultatRegle } from '../types';
import { pagesSaufCouverture } from './commun';

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
