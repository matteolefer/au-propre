import { R03 } from '../../content/rules.fr';
import type { Decoupage, ModeleDocument, ParametresDossier, ResultatRegle } from '../types';
import { sourcesDe } from './commun';
import { verifierNombrePages } from './nombre-pages';

/** R03 : partie 2, 6 pages maximum (SPEC §5), pour le CPE comme pour les autres concours (S10). */
export const MAX_PAGES_PARTIE2 = 6;

export function verifierR03(document: ModeleDocument, decoupage: Decoupage, parametres?: ParametresDossier): ResultatRegle[] {
  const textes = { ...R03, sources: sourcesDe(R03, parametres) };
  return [verifierNombrePages('R03', document, decoupage.partie2, MAX_PAGES_PARTIE2, textes)];
}
