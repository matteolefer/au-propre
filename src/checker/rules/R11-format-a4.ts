import { R11, type FormatMesure } from '../../content/rules.fr';
import { estA4, pagesDe, ptEnCm } from '../measure';
import type { Decoupage, ModeleDocument, PageModele, ResultatRegle } from '../types';

/**
 * R11 : format A4 (SPEC §5). Erreur pour les parties 1 et 2 ; avertissement
 * pour la couverture et les annexes, où la règle est moins certaine.
 * L'A4 paysage est accepté.
 */
export function verifierR11(document: ModeleDocument, decoupage: Decoupage): ResultatRegle[] {
  const parties = [...pagesDe(decoupage.partie1), ...pagesDe(decoupage.partie2)];
  const autres = [
    ...(decoupage.couverture ? pagesDe(decoupage.couverture) : []),
    ...(decoupage.annexes ? pagesDe(decoupage.annexes) : []),
  ];
  const horsA4 = (numeros: number[]) =>
    numeros
      .map((numero) => document.pages[numero - 1])
      .filter((page): page is PageModele => page !== undefined && !estA4(page.largeur, page.hauteur));

  const resultats: ResultatRegle[] = [];
  const partiesHorsA4 = horsA4(parties);
  if (partiesHorsA4.length > 0) {
    resultats.push({
      id: 'R11',
      gravite: 'erreur',
      titre: R11.erreur.titre,
      detail: R11.erreur.detail(regrouperParFormat(partiesHorsA4)),
      pages: partiesHorsA4.map((page) => page.numero),
      correction: R11.erreur.correction,
      sources: [...R11.sources],
    });
  }
  const autresHorsA4 = horsA4(autres);
  if (autresHorsA4.length > 0) {
    resultats.push({
      id: 'R11',
      gravite: 'avertissement',
      titre: R11.avertissement.titre,
      detail: R11.avertissement.detail(regrouperParFormat(autresHorsA4)),
      pages: autresHorsA4.map((page) => page.numero),
      correction: R11.avertissement.correction,
      sources: [...R11.sources],
    });
  }
  if (resultats.length === 0) {
    resultats.push({
      id: 'R11',
      gravite: 'conforme',
      titre: R11.conforme.titre,
      detail: R11.conforme.detail(parties.length + autres.length),
      correction: '',
      sources: [...R11.sources],
    });
  }
  return resultats;
}

/** Regroupe les pages de même taille, arrondie au centième de centimètre. */
function regrouperParFormat(pages: readonly PageModele[]): FormatMesure[] {
  const formats = new Map<string, FormatMesure>();
  for (const page of pages) {
    const largeurCm = Math.round(ptEnCm(page.largeur) * 100) / 100;
    const hauteurCm = Math.round(ptEnCm(page.hauteur) * 100) / 100;
    const cle = `${largeurCm}x${hauteurCm}`;
    const format = formats.get(cle) ?? { largeurCm, hauteurCm, pages: [] };
    format.pages.push(page.numero);
    formats.set(cle, format);
  }
  return [...formats.values()];
}
