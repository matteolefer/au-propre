import { R04 } from '../../content/rules.fr';
import type { Decoupage, ModeleDocument, ResultatRegle } from '../types';
import { verifierNombrePages } from './nombre-pages';

/** R04 : annexes, 10 pages maximum pour l'ensemble (SPEC §5). */
export const MAX_PAGES_ANNEXES = 10;

export function verifierR04(document: ModeleDocument, decoupage: Decoupage): ResultatRegle[] {
  if (decoupage.annexes === null) {
    // Les annexes sont facultatives.
    return [
      {
        id: 'R04',
        gravite: 'conforme',
        titre: R04.absentes.titre,
        detail: R04.absentes.detail,
        correction: '',
        sources: [...R04.sources],
      },
    ];
  }
  return [verifierNombrePages('R04', document, decoupage.annexes, MAX_PAGES_ANNEXES, R04)];
}
