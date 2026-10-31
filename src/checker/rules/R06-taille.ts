import { pt, R06 } from '../../content/rules.fr';
import { ECART_TAILLE_PT, LONGUEUR_FRAGMENT_MAX, TAILLE_CORPS_MAX_PT, TAILLE_CORPS_MIN_PT } from '../measure';
import { estLigneDeTexte, regrouperEnLignes, tailleDuCorps } from '../texte';
import type { Decoupage, ModeleDocument, ParametresDossier, ResultatRegle } from '../types';
import { ajouterPage, blocsDeTexte, enGroupes, pagesMesurees, resultatSansTexte, sourcesDe } from './commun';

/**
 * R06 : taille 11 pt (SPEC §5). Erreur si le corps du texte sort de
 * [10,5 ; 11,5] pt ; avertissement pour les lignes d'une autre taille,
 * plus grandes (titres) ou plus petites (notes, passages réduits).
 */
export function verifierR06(document: ModeleDocument, decoupage: Decoupage, parametres?: ParametresDossier): ResultatRegle[] {
  const pages = pagesMesurees(document, decoupage);
  const corps = tailleDuCorps(pages.flatMap(blocsDeTexte));
  if (corps === undefined) return [resultatSansTexte('R06', sourcesDe(R06, parametres))];

  const sources = sourcesDe(R06, parametres);
  const resultats: ResultatRegle[] = [];
  if (corps < TAILLE_CORPS_MIN_PT || corps > TAILLE_CORPS_MAX_PT) {
    resultats.push({
      id: 'R06',
      gravite: 'erreur',
      titre: R06.erreur.titre(corps),
      detail: R06.erreur.detail(corps),
      pages: pages.map((page) => page.numero),
      correction: R06.erreur.correction,
      sources,
    });
  } else {
    resultats.push({ id: 'R06', gravite: 'conforme', titre: R06.conforme.titre, detail: R06.conforme.detail(corps), correction: '', sources });
  }

  const plusGrandes = new Map<string, Set<number>>();
  const plusPetites = new Map<string, Set<number>>();
  for (const page of pages) {
    for (const ligne of regrouperEnLignes(page)) {
      if (!estLigneDeTexte(ligne, LONGUEUR_FRAGMENT_MAX)) continue;
      const taille = pt(Math.round(ligne.taille * 10) / 10);
      if (ligne.taille > corps + ECART_TAILLE_PT) ajouterPage(plusGrandes, taille, page.numero);
      else if (ligne.taille < corps - ECART_TAILLE_PT) ajouterPage(plusPetites, taille, page.numero);
    }
  }
  for (const [groupes, textes] of [
    [plusGrandes, R06.plusGrand],
    [plusPetites, R06.plusPetit],
  ] as const) {
    if (groupes.size === 0) continue;
    const liste = enGroupes(groupes);
    resultats.push({
      id: 'R06',
      gravite: 'avertissement',
      titre: textes.titre,
      detail: textes.detail(liste),
      pages: [...new Set(liste.flatMap((g) => g.pages))].sort((a, b) => a - b),
      correction: textes.correction,
      sources,
    });
  }
  return resultats;
}
