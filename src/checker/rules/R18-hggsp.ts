import { R18 } from '../../content/rules.fr';
import { rechercher, texteDePage } from '../recherche';
import type { Decoupage, ModeleDocument, ParametresDossier, ResultatRegle } from '../types';
import { estDansPlage } from './commun';

/** Identifiant de la discipline histoire-géographie dans les paramètres du dossier. */
export const DISCIPLINE_HISTOIRE_GEOGRAPHIE = 'histoire-geographie';

const HGGSP = /\bhggsp\b|histoire-geographie,? geopolitique et sciences politiques/;

/**
 * R18 : HGGSP en histoire-géographie (SPEC §5). Seulement si la discipline
 * est l'histoire-géographie ; on cherche dans la partie 2 et les annexes, où
 * figure la séquence analysée. Avoir enseigné l'HGGSP (partie 1) est légitime.
 */
export function verifierR18(document: ModeleDocument, decoupage: Decoupage, parametres?: ParametresDossier): ResultatRegle[] {
  if (parametres?.discipline !== DISCIPLINE_HISTOIRE_GEOGRAPHIE) return [];
  const pages = document.pages
    .filter((page) => estDansPlage(page.numero, decoupage.partie2) || estDansPlage(page.numero, decoupage.annexes))
    .filter((page) => rechercher(texteDePage(page), HGGSP).length > 0)
    .map((page) => page.numero);
  const sources = [...R18.sources];
  if (pages.length > 0) {
    return [
      { id: 'R18', gravite: 'avertissement', titre: R18.avertissement.titre, detail: R18.avertissement.detail(pages), pages, correction: R18.avertissement.correction, sources },
    ];
  }
  return [{ id: 'R18', gravite: 'conforme', titre: R18.conforme.titre, detail: R18.conforme.detail, correction: '', sources }];
}
