import { R13 } from '../../content/rules.fr';
import { ECART_RVB_COULEUR_MIN } from '../measure';
import type { Decoupage, ModeleDocument, ParametresDossier, ResultatRegle } from '../types';
import { ajouterPage, blocsDeTexte, enGroupes, estConcoursCpe, pagesMesurees, resultatSansTexte, sourcesDe, zoneEnFaute } from './commun';

/**
 * R13 : texte en noir (SPEC §5). Un texte est « en couleur » quand ses
 * composantes rouge, verte et bleue s'écartent assez : le gris n'en est pas.
 */
export function verifierR13(document: ModeleDocument, decoupage: Decoupage, parametres?: ParametresDossier): ResultatRegle[] {
  const blocs = pagesMesurees(document, decoupage).flatMap((page) =>
    blocsDeTexte(page).map((bloc) => ({ bloc, page: page.numero, modele: page })),
  );
  const sources = sourcesDe(R13, parametres);
  if (blocs.length === 0) return [resultatSansTexte('R13', sources)];
  const connus = blocs.filter(({ bloc }) => bloc.couleur !== null);
  if (connus.length === 0) {
    return [{ id: 'R13', gravite: 'info', titre: R13.nonVerifiable.titre, detail: R13.nonVerifiable.detail, correction: '', sources }];
  }

  const couleurs = new Map<string, Set<number>>();
  const enCouleur = connus.filter(({ bloc }) => bloc.couleur !== null && estEnCouleur(bloc.couleur));
  for (const { bloc, page } of enCouleur) ajouterPage(couleurs, (bloc.couleur ?? '').toUpperCase(), page);
  if (couleurs.size > 0) {
    const groupes = enGroupes(couleurs);
    return [
      {
        id: 'R13',
        gravite: 'avertissement',
        titre: R13.avertissement.titre,
        detail: R13.avertissement.detail(groupes) + (estConcoursCpe(parametres) ? R13.mentionCpe : ''),
        pages: [...new Set(groupes.flatMap((g) => g.pages))].sort((a, b) => a - b),
        correction: R13.avertissement.correction,
        sources,
        // Zones : chaque bloc en couleur.
        zones: enCouleur.map(({ bloc, modele }) => zoneEnFaute(modele, { x: bloc.x, y: bloc.y, largeur: bloc.largeur, hauteur: bloc.hauteur })),
      },
    ];
  }
  return [{ id: 'R13', gravite: 'conforme', titre: R13.conforme.titre, detail: R13.conforme.detail, correction: '', sources }];
}

/** Vrai si l'écart entre les composantes RVB de « #rrggbb » atteint le seuil. */
export function estEnCouleur(hex: string): boolean {
  const composantes = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  if (composantes.some(Number.isNaN)) return false;
  return Math.max(...composantes) - Math.min(...composantes) >= ECART_RVB_COULEUR_MIN;
}
