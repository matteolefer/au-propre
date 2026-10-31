import { R07 } from '../../content/rules.fr';
import {
  ECART_LIGNES_MAX,
  ECART_LIGNES_MIN,
  ECARTS_INTERLIGNE_MIN,
  LONGUEUR_FRAGMENT_MAX,
  PART_LIGNE_PLEINE,
  RAPPORT_INTERLIGNE_MAX,
} from '../measure';
import { bornesHorizontales, estLigneDeTexte, estLignePleine, mediane, regrouperEnLignes, tailleDuCorps } from '../texte';
import type { Decoupage, ModeleDocument, ParametresDossier, ResultatRegle } from '../types';
import { blocsDeTexte, pagesMesurees, resultatSansTexte, sourcesDe } from './commun';

/**
 * R07 : interligne simple (SPEC §5, mesure approximative). On mesure l'écart
 * entre une ligne pleine et la suivante, c'est-à-dire entre deux lignes d'un
 * même paragraphe, et on rapporte la médiane à la taille du corps.
 */
export function verifierR07(document: ModeleDocument, decoupage: Decoupage, parametres?: ParametresDossier): ResultatRegle[] {
  const pages = pagesMesurees(document, decoupage);
  const corps = tailleDuCorps(pages.flatMap(blocsDeTexte));
  if (corps === undefined) return [resultatSansTexte('R07', sourcesDe(R07, parametres))];

  const ecarts: number[] = [];
  for (const page of pages) {
    const lignes = regrouperEnLignes(page).filter((ligne) => estLigneDeTexte(ligne, LONGUEUR_FRAGMENT_MAX));
    if (lignes.length < 2) continue;
    const bornes = bornesHorizontales(lignes);
    lignes.forEach((ligne, i) => {
      const precedente = lignes[i - 1];
      if (!precedente || !estLignePleine(precedente, bornes, PART_LIGNE_PLEINE)) return;
      const ecart = ligne.yReference - precedente.yReference;
      if (ecart >= ECART_LIGNES_MIN * corps && ecart <= ECART_LIGNES_MAX * corps) ecarts.push(ecart);
    });
  }

  const sources = sourcesDe(R07, parametres);
  const ecartMedian = mediane(ecarts);
  if (ecarts.length < ECARTS_INTERLIGNE_MIN || ecartMedian === undefined) {
    return [{ id: 'R07', gravite: 'info', titre: R07.nonMesurable.titre, detail: R07.nonMesurable.detail, correction: '', sources }];
  }
  const rapport = Math.round((ecartMedian / corps) * 100) / 100;
  if (rapport > RAPPORT_INTERLIGNE_MAX) {
    return [
      {
        id: 'R07',
        gravite: 'avertissement',
        titre: R07.avertissement.titre,
        detail: R07.avertissement.detail(rapport),
        correction: R07.avertissement.correction,
        sources,
      },
    ];
  }
  return [{ id: 'R07', gravite: 'conforme', titre: R07.conforme.titre, detail: R07.conforme.detail(rapport), correction: '', sources }];
}
