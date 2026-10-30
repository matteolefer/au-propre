import { cm, R09 } from '../../content/rules.fr';
import { cmEnPt, DISTANCE_EN_TETE_PIED_CM, ptEnCm, TOLERANCE_PT } from '../measure';
import type { Decoupage, ModeleDocument, ResultatRegle } from '../types';
import { pagesMesurees, resultatSansTexte } from './commun';

/**
 * R09 : en-tête et pied de page à 1,25 cm du bord (SPEC §5). On mesure la
 * distance entre le bord et la boîte de ligne du texte le plus haut et le plus
 * bas, comme le fait Word pour l'en-tête et le pied de page.
 */
export function verifierR09(document: ModeleDocument, decoupage: Decoupage): ResultatRegle[] {
  const seuil = cmEnPt(DISTANCE_EN_TETE_PIED_CM) - TOLERANCE_PT;
  let hautMin = Infinity;
  let basMin = Infinity;
  const defauts = { haut: { min: Infinity, pages: [] as number[] }, bas: { min: Infinity, pages: [] as number[] } };

  for (const page of pagesMesurees(document, decoupage)) {
    const blocs = page.blocs.filter((bloc) => bloc.texte.trim() !== '');
    if (blocs.length === 0) continue;
    const haut = Math.min(...blocs.map((bloc) => bloc.y));
    const bas = page.hauteur - Math.max(...blocs.map((bloc) => bloc.y + bloc.hauteur));
    hautMin = Math.min(hautMin, haut);
    basMin = Math.min(basMin, bas);
    for (const [bord, mesure] of [
      ['haut', haut],
      ['bas', bas],
    ] as const) {
      if (mesure < seuil) {
        defauts[bord].min = Math.min(defauts[bord].min, mesure);
        defauts[bord].pages.push(page.numero);
      }
    }
  }

  const sources = [...R09.sources];
  if (hautMin === Infinity) return [resultatSansTexte('R09', R09.sources)];
  const groupes = (['haut', 'bas'] as const)
    .filter((bord) => defauts[bord].pages.length > 0)
    .map((bord) => ({ libelle: `texte à ${cm(ptEnCm(defauts[bord].min))} du bord ${bord}`, pages: defauts[bord].pages }));
  if (groupes.length > 0) {
    return [
      {
        id: 'R09',
        gravite: 'erreur',
        titre: R09.erreur.titre,
        detail: R09.erreur.detail(groupes),
        pages: [...new Set(groupes.flatMap((g) => g.pages))].sort((a, b) => a - b),
        correction: R09.erreur.correction,
        sources,
      },
    ];
  }
  return [
    {
      id: 'R09',
      gravite: 'conforme',
      titre: R09.conforme.titre,
      detail: R09.conforme.detail(ptEnCm(hautMin), ptEnCm(basMin)),
      correction: '',
      sources,
    },
  ];
}
