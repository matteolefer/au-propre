import { R10 } from '../../content/rules.fr';
import { LONGUEUR_FRAGMENT_MAX, PART_LIGNE_PLEINE, RETRAIT_MIN_PT, RETRAITS_RECURRENTS_MIN, TOLERANCE_PT } from '../measure';
import { bornesHorizontales, estLigneDeTexte, estLignePleine, regrouperEnLignes, type Ligne } from '../texte';
import type { Decoupage, ModeleDocument, ResultatRegle } from '../types';
import { blocsDeTexte, pagesMesurees, resultatSansTexte } from './commun';

/**
 * R10 : pas de retrait en début de paragraphe (SPEC §5, mesure approximative).
 * Une ligne pleine décalée de plus de 5 pt vers la droite, suivie d'une ligne
 * revenue à l'alignement habituel de la page, est une première ligne en retrait.
 */
export function verifierR10(document: ModeleDocument, decoupage: Decoupage): ResultatRegle[] {
  const pages = pagesMesurees(document, decoupage);
  if (pages.every((page) => blocsDeTexte(page).length === 0)) return [resultatSansTexte('R10', R10.sources)];
  const pagesEnRetrait: number[] = [];
  for (const page of pages) {
    const lignes = regrouperEnLignes(page).filter((ligne) => estLigneDeTexte(ligne, LONGUEUR_FRAGMENT_MAX));
    if (lignes.length < 2) continue;
    const alignement = alignementHabituel(lignes);
    const bornes = bornesHorizontales(lignes);
    lignes.forEach((ligne, i) => {
      const suivante = lignes[i + 1];
      if (
        suivante &&
        ligne.xDebut - alignement > RETRAIT_MIN_PT &&
        estLignePleine(ligne, bornes, PART_LIGNE_PLEINE) &&
        Math.abs(suivante.xDebut - alignement) <= TOLERANCE_PT
      ) {
        pagesEnRetrait.push(page.numero);
      }
    });
  }

  const sources = [...R10.sources];
  if (pagesEnRetrait.length >= RETRAITS_RECURRENTS_MIN) {
    const pages = [...new Set(pagesEnRetrait)].sort((a, b) => a - b);
    return [
      {
        id: 'R10',
        gravite: 'avertissement',
        titre: R10.avertissement.titre,
        detail: R10.avertissement.detail(pagesEnRetrait.length, pages),
        pages,
        correction: R10.avertissement.correction,
        sources,
      },
    ];
  }
  return [{ id: 'R10', gravite: 'conforme', titre: R10.conforme.titre, detail: R10.conforme.detail, correction: '', sources }];
}

/** Début de ligne le plus fréquent de la page, au point près (le plus à gauche en cas d'égalité). */
function alignementHabituel(lignes: readonly Ligne[]): number {
  const comptes = new Map<number, number>();
  for (const ligne of lignes) {
    const x = Math.round(ligne.xDebut);
    comptes.set(x, (comptes.get(x) ?? 0) + 1);
  }
  return [...comptes.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0] ?? 0;
}
