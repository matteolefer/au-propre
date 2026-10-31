import { R02 } from '../../content/rules.fr';
import type { Decoupage, ModeleDocument, ParametresDossier, ResultatRegle } from '../types';
import { sourcesDe } from './commun';
import { verifierNombrePages } from './nombre-pages';

/** R02 : partie 1, 2 pages maximum (SPEC §5). */
export const MAX_PAGES_PARTIE1 = 2;

export function verifierR02(document: ModeleDocument, decoupage: Decoupage, parametres?: ParametresDossier): ResultatRegle[] {
  const textes = { ...R02, sources: sourcesDe(R02, parametres) };
  return [verifierNombrePages('R02', document, decoupage.partie1, MAX_PAGES_PARTIE1, textes)];
}
