import { SANS_TEXTE } from '../../content/rules.fr';
import { contientDuTexte, pagesDesParties, pagesDuDocument } from '../texte';
import type { BlocTexte, Decoupage, ModeleDocument, PageModele, ParametresDossier, Plage, Rectangle, ResultatRegle, Source, ZoneEnFaute } from '../types';

/** Identifiant du concours interne de CPE dans les paramètres du dossier. */
export const CONCOURS_CPE = 'cpe-interne';

export function estConcoursCpe(parametres?: ParametresDossier): boolean {
  return parametres?.concours === CONCOURS_CPE;
}

/** Sources d'une règle : celles propres au concours de CPE quand elles existent (SPEC §5). */
export function sourcesDe(
  textes: { sources: readonly Source[]; sourcesCpe?: readonly Source[] },
  parametres?: ParametresDossier,
): Source[] {
  return [...(estConcoursCpe(parametres) && textes.sourcesCpe ? textes.sourcesCpe : textes.sources)];
}

/** Pages des parties 1 et 2, où portent les règles de mise en page (SPEC §5). */
export function pagesMesurees(document: ModeleDocument, decoupage: Decoupage): PageModele[] {
  return pagesDuDocument(document, pagesDesParties(decoupage));
}

/** Blocs contenant au moins une lettre ou un chiffre. */
export function blocsDeTexte(page: PageModele): BlocTexte[] {
  return page.blocs.filter((bloc) => contientDuTexte(bloc.texte));
}

/** Résultat « info » quand les parties ne contiennent aucun texte à mesurer. */
export function resultatSansTexte(id: string, sources: readonly Source[]): ResultatRegle {
  return { id, gravite: 'info', titre: SANS_TEXTE.titre, detail: SANS_TEXTE.detail, correction: '', sources: [...sources] };
}

/** Zone en faute sur une page, à surligner dans l'aperçu du rapport. */
export function zoneEnFaute(page: PageModele, rectangle: Rectangle): ZoneEnFaute {
  return { page: page.numero, largeurPage: page.largeur, hauteurPage: page.hauteur, ...rectangle };
}

/** Rectangle qui englobe des blocs. */
export function englobant(blocs: readonly Rectangle[]): Rectangle {
  const x = Math.min(...blocs.map((b) => b.x));
  const y = Math.min(...blocs.map((b) => b.y));
  const largeur = Math.max(...blocs.map((b) => b.x + b.largeur)) - x;
  const hauteur = Math.max(...blocs.map((b) => b.y + b.hauteur)) - y;
  return { x, y, largeur, hauteur };
}

/** Ajoute une page à la liste associée à une clé, sans doublon. */
export function ajouterPage(groupes: Map<string, Set<number>>, cle: string, page: number): void {
  const pages = groupes.get(cle) ?? new Set<number>();
  pages.add(page);
  groupes.set(cle, pages);
}

export function enGroupes(groupes: Map<string, Set<number>>): { libelle: string; pages: number[] }[] {
  return [...groupes.entries()].map(([libelle, pages]) => ({ libelle, pages: [...pages].sort((a, b) => a - b) }));
}

/** Toutes les pages sauf la couverture : portée des règles de contenu R14 à R17. */
export function pagesSaufCouverture(document: ModeleDocument, decoupage: Decoupage): PageModele[] {
  const couverture = decoupage.couverture;
  return document.pages.filter((page) => !couverture || page.numero < couverture.debut || page.numero > couverture.fin);
}

export function estDansPlage(numero: number, plage: Plage | null): boolean {
  return plage !== null && numero >= plage.debut && numero <= plage.fin;
}
