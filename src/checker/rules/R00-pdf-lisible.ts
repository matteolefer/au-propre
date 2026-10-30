import { R00 } from '../../content/rules.fr';
import type { ModeleDocument, ResultatRegle } from '../types';

/**
 * R00 : le PDF doit contenir une couche texte. Sans elle (scan), aucune autre
 * règle ne peut être mesurée : l'analyse s'arrête. S'exécute avant le découpage.
 */
export function verifierR00(document: ModeleDocument): ResultatRegle {
  const total = document.pages.length;
  if (!document.contientTexte) {
    const pagesImages = document.pages.filter((page) => page.images.length > 0).length;
    return {
      id: 'R00',
      gravite: 'bloquant',
      titre: R00.bloquant.titre,
      detail: R00.bloquant.detail(total, pagesImages),
      correction: R00.bloquant.correction,
      sources: [],
    };
  }
  const pagesAvecTexte = document.pages.filter((page) => page.blocs.length > 0).length;
  return {
    id: 'R00',
    gravite: 'conforme',
    titre: R00.conforme.titre,
    detail: R00.conforme.detail(pagesAvecTexte, total),
    correction: '',
    sources: [],
  };
}
