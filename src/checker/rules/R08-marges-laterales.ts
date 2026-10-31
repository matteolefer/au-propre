import { cm, R08 } from '../../content/rules.fr';
import { cmEnPt, MARGE_LATERALE_CM, ptEnCm, TOLERANCE_PT } from '../measure';
import type { Decoupage, ModeleDocument, ParametresDossier, ResultatRegle, ZoneEnFaute } from '../types';
import { englobant, pagesMesurees, resultatSansTexte, sourcesDe, zoneEnFaute } from './commun';

/**
 * R08 : marges gauche et droite de 2,5 cm (SPEC §5). Tout le texte des pages
 * des parties est mesuré, en-tête et pied de page compris.
 */
export function verifierR08(document: ModeleDocument, decoupage: Decoupage, parametres?: ParametresDossier): ResultatRegle[] {
  const seuil = cmEnPt(MARGE_LATERALE_CM) - TOLERANCE_PT;
  const marge = cmEnPt(MARGE_LATERALE_CM);
  const zones: ZoneEnFaute[] = [];
  let gaucheMin = Infinity;
  let droiteMin = Infinity;
  const defauts = { gauche: { min: Infinity, pages: [] as number[] }, droite: { min: Infinity, pages: [] as number[] } };

  for (const page of pagesMesurees(document, decoupage)) {
    const blocs = page.blocs.filter((bloc) => bloc.texte.trim() !== '');
    if (blocs.length === 0) continue;
    const gauche = Math.min(...blocs.map((bloc) => bloc.x));
    const droite = page.largeur - Math.max(...blocs.map((bloc) => bloc.x + bloc.largeur));
    gaucheMin = Math.min(gaucheMin, gauche);
    droiteMin = Math.min(droiteMin, droite);
    for (const [cote, mesure] of [
      ['gauche', gauche],
      ['droite', droite],
    ] as const) {
      if (mesure < seuil) {
        defauts[cote].min = Math.min(defauts[cote].min, mesure);
        defauts[cote].pages.push(page.numero);
        // Zone : la bande de marge occupée par le texte, sur la hauteur des blocs qui débordent.
        const debordants = blocs.filter((bloc) =>
          cote === 'gauche' ? bloc.x < seuil : page.largeur - (bloc.x + bloc.largeur) < seuil,
        );
        const boite = englobant(debordants);
        const x = cote === 'gauche' ? boite.x : page.largeur - marge;
        const largeur = cote === 'gauche' ? marge - boite.x : boite.x + boite.largeur - x;
        zones.push(zoneEnFaute(page, { x, y: boite.y, largeur, hauteur: boite.hauteur }));
      }
    }
  }

  const sources = sourcesDe(R08, parametres);
  if (gaucheMin === Infinity) return [resultatSansTexte('R08', sources)];
  const groupes = (['gauche', 'droite'] as const)
    .filter((cote) => defauts[cote].pages.length > 0)
    .map((cote) => ({ libelle: `marge ${cote} de ${cm(ptEnCm(defauts[cote].min))}`, pages: defauts[cote].pages }));
  if (groupes.length > 0) {
    return [
      {
        id: 'R08',
        gravite: 'erreur',
        titre: R08.erreur.titre,
        detail: R08.erreur.detail(groupes),
        pages: [...new Set(groupes.flatMap((g) => g.pages))].sort((a, b) => a - b),
        correction: R08.erreur.correction,
        sources,
        zones,
      },
    ];
  }
  return [
    {
      id: 'R08',
      gravite: 'conforme',
      titre: R08.conforme.titre,
      detail: R08.conforme.detail(ptEnCm(gaucheMin), ptEnCm(droiteMin)),
      correction: '',
      sources,
    },
  ];
}
