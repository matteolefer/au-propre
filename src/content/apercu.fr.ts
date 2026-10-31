/**
 * Aperçu du rapport sur la page d'accueil : un dossier fictif, avec les textes
 * réels des règles (rules.fr.ts). L'erreur R08 et sa miniature viennent de la
 * fixture 04_marges_2cm_word (marges de 2 cm) : tests/content/apercu.test.ts
 * vérifie qu'elles sont identiques à ce que produit la règle.
 */
import type { ResultatRegle } from '../checker/types';
import { cm, R02, R05, R06, R08, R10 } from './rules.fr';

export const APERCU = {
  titre: 'Exemple de rapport',
  feuille: 'Rapport de vérification',
  fichier: 'DUPONT_Marie.pdf (11 pages)',
  legende: 'Exemple de rapport sur un dossier fictif.',
} as const;

/** Aperçus des pages de l'exemple : seule la page 2 est utilisée (public/exemple/, outils/miniature-exemple.mjs). */
export const MINIATURES_EXEMPLE: readonly (string | null)[] = [null, '/exemple/page-2.png'];

const PAGES_PARTIES = [2, 3, 4, 5, 6, 7, 8, 9];
const PAGE_A4 = { largeurPage: 595.2, hauteurPage: 841.92 };

export const RESULTATS_EXEMPLE: readonly ResultatRegle[] = [
  {
    id: 'R08',
    gravite: 'erreur',
    titre: R08.erreur.titre,
    detail: R08.erreur.detail([
      { libelle: `marge gauche de ${cm(2)}`, pages: PAGES_PARTIES },
      { libelle: `marge droite de ${cm(1.99)}`, pages: PAGES_PARTIES },
    ]),
    pages: PAGES_PARTIES,
    correction: R08.erreur.correction,
    sources: [...R08.sources],
    zones: [
      { page: 2, ...PAGE_A4, x: 56.64, y: 71.13, largeur: 14.23, hauteur: 691.53 },
      { page: 2, ...PAGE_A4, x: 524.33, y: 89.85, largeur: 14.55, hauteur: 672.81 },
    ],
  },
  {
    id: 'R10',
    gravite: 'avertissement',
    titre: R10.avertissement.titre,
    detail: R10.avertissement.detail(4, [3, 5, 7]),
    pages: [3, 5, 7],
    correction: R10.avertissement.correction,
    sources: [...R10.sources],
  },
  { id: 'R02', gravite: 'conforme', titre: R02.conforme.titre, detail: R02.conforme.detail({ debut: 2, fin: 3 }, 2), pages: [2, 3], correction: '', sources: [...R02.sources] },
  { id: 'R05', gravite: 'conforme', titre: R05.conforme.titre, detail: R05.conforme.detail('ArialMT'), correction: '', sources: [...R05.sources] },
  { id: 'R06', gravite: 'conforme', titre: R06.conforme.titre, detail: R06.conforme.detail(11), correction: '', sources: [...R06.sources] },
];
