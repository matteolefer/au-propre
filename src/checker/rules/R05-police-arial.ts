import { R05 } from '../../content/rules.fr';
import { classerPolice, nomAffiche, type ClassePolice } from '../polices';
import { nombreCaracteres } from '../texte';
import type { Decoupage, ModeleDocument, ResultatRegle } from '../types';
import { ajouterPage, blocsDeTexte, enGroupes, pagesMesurees, resultatSansTexte } from './commun';

interface Famille {
  classe: ClassePolice;
  caracteres: number;
  pages: Set<number>;
}

/**
 * R05 : police Arial (SPEC §5). La famille majoritaire du texte des parties
 * décide ; les autres polices utilisées donnent un avertissement. Les polices
 * de puces (Symbol, Wingdings…) sont ignorées.
 */
export function verifierR05(document: ModeleDocument, decoupage: Decoupage): ResultatRegle[] {
  const familles = new Map<string, Famille>();
  for (const page of pagesMesurees(document, decoupage)) {
    for (const bloc of blocsDeTexte(page)) {
      const classe = classerPolice(bloc.police);
      if (classe === 'symbole') continue;
      const nom = nomAffiche(bloc.police);
      const famille = familles.get(nom) ?? { classe, caracteres: 0, pages: new Set<number>() };
      famille.caracteres += nombreCaracteres(bloc.texte);
      famille.pages.add(page.numero);
      familles.set(nom, famille);
    }
  }
  const classement = [...familles.entries()].sort((a, b) => b[1].caracteres - a[1].caracteres);
  const [principale] = classement;
  if (!principale) return [resultatSansTexte('R05', R05.sources)];

  const [nom, famille] = principale;
  const pages = [...famille.pages].sort((a, b) => a - b);
  const sources = [...R05.sources];
  const resultats: ResultatRegle[] = [];
  switch (famille.classe) {
    case 'arial':
      resultats.push({ id: 'R05', gravite: 'conforme', titre: R05.conforme.titre, detail: R05.conforme.detail(nom), correction: '', sources });
      break;
    case 'substitut':
      resultats.push({
        id: 'R05',
        gravite: 'avertissement',
        titre: R05.substitut.titre(nom),
        detail: R05.substitut.detail(nom),
        pages,
        correction: R05.substitut.correction,
        sources,
      });
      break;
    case 'inconnue':
      resultats.push({
        id: 'R05',
        gravite: 'avertissement',
        titre: R05.inconnue.titre,
        detail: R05.inconnue.detail,
        pages,
        correction: R05.inconnue.correction,
        sources,
      });
      break;
    default:
      resultats.push({
        id: 'R05',
        gravite: 'erreur',
        titre: R05.erreur.titre,
        detail: R05.erreur.detail(nom, pages),
        pages,
        correction: R05.erreur.correction,
        sources,
      });
  }

  // Polices minoritaires autres qu'Arial.
  const autres = new Map<string, Set<number>>();
  for (const [autreNom, autre] of classement.slice(1)) {
    if (autre.classe === 'arial') continue;
    for (const page of autre.pages) ajouterPage(autres, autreNom, page);
  }
  if (autres.size > 0) {
    const groupes = enGroupes(autres);
    resultats.push({
      id: 'R05',
      gravite: 'avertissement',
      titre: R05.autresPolices.titre,
      detail: R05.autresPolices.detail(groupes),
      pages: [...new Set(groupes.flatMap((g) => g.pages))].sort((a, b) => a - b),
      correction: R05.autresPolices.correction,
      sources,
    });
  }
  return resultats;
}
