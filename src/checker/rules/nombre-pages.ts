import { nombrePages, pagesDe } from '../measure';
import type { ModeleDocument, Plage, ResultatRegle, Source } from '../types';

export { CONCOURS_CPE, estConcoursCpe } from './commun';

interface TextesNombrePages {
  erreur: {
    titre: string;
    detail: (plage: Plage, n: number, vides: readonly number[]) => string;
    correction: string;
  };
  conforme: { titre: string; detail: (plage: Plage, n: number) => string };
  sources: readonly Source[];
}

/** Contrôle commun à R02, R03 et R04 : une partie ne dépasse pas `maximum` pages. */
export function verifierNombrePages(
  id: string,
  document: ModeleDocument,
  plage: Plage,
  maximum: number,
  textes: TextesNombrePages,
): ResultatRegle {
  const n = nombrePages(plage);
  const pages = pagesDe(plage);
  if (n > maximum) {
    // Indication utile pour corriger : une page blanche ajoutée à l'export.
    const vides = pages.filter((numero) => {
      const page = document.pages[numero - 1];
      return page !== undefined && page.blocs.length === 0 && page.images.length === 0;
    });
    return {
      id,
      gravite: 'erreur',
      titre: textes.erreur.titre,
      detail: textes.erreur.detail(plage, n, vides),
      pages,
      correction: textes.erreur.correction,
      sources: [...textes.sources],
    };
  }
  return {
    id,
    gravite: 'conforme',
    titre: textes.conforme.titre,
    detail: textes.conforme.detail(plage, n),
    pages,
    correction: '',
    sources: [...textes.sources],
  };
}
