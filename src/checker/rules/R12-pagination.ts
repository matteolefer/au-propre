import { R12 } from '../../content/rules.fr';
import { regrouperEnLignes } from '../texte';
import type { Decoupage, ModeleDocument, ResultatRegle } from '../types';
import { blocsDeTexte, pagesMesurees, resultatSansTexte } from './commun';

/** Numéro de page : « 2 », « - 2 - », « Page 2 », « 2/8 », « 2 sur 8 ». */
const NUMERO_DE_PAGE = /^[-–—\s]*(?:page\s*)?\d{1,3}(?:\s*(?:\/|sur)\s*\d{1,3})?[-–—\s]*$/iu;

/**
 * R12 : pagination (SPEC §5). On cherche un numéro sur la première ou la
 * dernière ligne de chaque page des parties.
 */
export function verifierR12(document: ModeleDocument, decoupage: Decoupage): ResultatRegle[] {
  const pages = pagesMesurees(document, decoupage);
  if (pages.every((page) => blocsDeTexte(page).length === 0)) return [resultatSansTexte('R12', R12.sources)];
  const numerotees = pages.filter((page) => {
    const lignes = regrouperEnLignes(page);
    return [lignes[0], lignes[lignes.length - 1]].some(
      (ligne) =>
        ligne !== undefined &&
        (NUMERO_DE_PAGE.test(ligne.texte) || ligne.blocs.some((bloc) => NUMERO_DE_PAGE.test(bloc.texte.trim()))),
    );
  });

  const sources = [...R12.sources];
  if (numerotees.length === 0) {
    return [
      {
        id: 'R12',
        gravite: 'avertissement',
        titre: R12.avertissement.titre,
        detail: R12.avertissement.detail,
        pages: pages.map((page) => page.numero),
        correction: R12.avertissement.correction,
        sources,
      },
    ];
  }
  return [
    {
      id: 'R12',
      gravite: 'conforme',
      titre: R12.conforme.titre,
      detail: R12.conforme.detail(numerotees.length, pages.length),
      correction: '',
      sources,
    },
  ];
}
