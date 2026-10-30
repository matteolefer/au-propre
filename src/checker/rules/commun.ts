import { SANS_TEXTE } from '../../content/rules.fr';
import { contientDuTexte, pagesDesParties, pagesDuDocument } from '../texte';
import type { BlocTexte, Decoupage, ModeleDocument, PageModele, Plage, ResultatRegle, Source } from '../types';

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
