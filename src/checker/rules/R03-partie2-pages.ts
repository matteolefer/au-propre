import { R03 } from '../../content/rules.fr';
import type { Decoupage, ModeleDocument, ResultatRegle } from '../types';
import { verifierNombrePages } from './nombre-pages';

/** R03 : partie 2, 6 pages maximum (SPEC §5). */
export const MAX_PAGES_PARTIE2 = 6;

export function verifierR03(document: ModeleDocument, decoupage: Decoupage): ResultatRegle[] {
  return [verifierNombrePages('R03', document, decoupage.partie2, MAX_PAGES_PARTIE2, R03)];
}
