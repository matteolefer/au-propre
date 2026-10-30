import { R02 } from '../../content/rules.fr';
import type { Decoupage, ModeleDocument, ResultatRegle } from '../types';
import { verifierNombrePages } from './nombre-pages';

/** R02 : partie 1, 2 pages maximum (SPEC §5). */
export const MAX_PAGES_PARTIE1 = 2;

export function verifierR02(document: ModeleDocument, decoupage: Decoupage): ResultatRegle[] {
  return [verifierNombrePages('R02', document, decoupage.partie1, MAX_PAGES_PARTIE1, R02)];
}
