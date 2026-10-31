import { R04 } from '../../content/rules.fr';
import type { Decoupage, ModeleDocument, ParametresDossier, Plage, ResultatRegle } from '../types';
import { estConcoursCpe, sourcesDe } from './commun';
import { verifierNombrePages } from './nombre-pages';

/** R04 : annexes, 10 pages maximum pour l'ensemble (SPEC §5). */
export const MAX_PAGES_ANNEXES = 10;

export function verifierR04(document: ModeleDocument, decoupage: Decoupage, parametres?: ParametresDossier): ResultatRegle[] {
  if (decoupage.annexes === null) {
    // Les annexes sont facultatives.
    return [
      {
        id: 'R04',
        gravite: 'conforme',
        titre: R04.absentes.titre,
        detail: R04.absentes.detail,
        correction: '',
        sources: sourcesDe(R04, parametres),
      },
    ];
  }
  const textes = {
    ...R04,
    sources: sourcesDe(R04, parametres),
    // Pour le CPE, le détail donne la conséquence fixée par le jury (rapport 2026).
    erreur: estConcoursCpe(parametres)
      ? { ...R04.erreur, detail: (plage: Plage, n: number, vides: readonly number[]) => R04.erreur.detail(plage, n, vides) + R04.consequenceCpe }
      : R04.erreur,
  };
  return [verifierNombrePages('R04', document, decoupage.annexes, MAX_PAGES_ANNEXES, textes)];
}
