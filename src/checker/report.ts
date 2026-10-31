/**
 * Analyse complète et rapport : agrégation des résultats des règles et
 * regroupement par gravité, dans l'ordre d'affichage (SPEC §4).
 */
import { pagesDe } from './measure';
import { REGLES, verifierLisibilite } from './rules';
import { contientDuTexte } from './texte';
import type { Decoupage, Gravite, ModeleDocument, ParametresDossier, ResultatRegle } from './types';

/** Lance R00 puis toutes les règles sur le découpage confirmé. */
export function analyser(document: ModeleDocument, decoupage: Decoupage, parametres: ParametresDossier): ResultatRegle[] {
  const lisibilite = verifierLisibilite(document);
  if (lisibilite.gravite === 'bloquant') return [lisibilite];
  return [lisibilite, ...REGLES.flatMap((regle) => regle.verifier(document, decoupage, parametres))];
}

export type CleGroupe = 'aCorriger' | 'aVerifier' | 'conforme' | 'informations';

/** Groupes du rapport, dans l'ordre d'affichage. */
export const ORDRE_GROUPES: readonly CleGroupe[] = ['aCorriger', 'aVerifier', 'conforme', 'informations'];

const GROUPE_DE_LA_GRAVITE: Record<Exclude<Gravite, 'bloquant'>, CleGroupe> = {
  erreur: 'aCorriger',
  avertissement: 'aVerifier',
  conforme: 'conforme',
  info: 'informations',
};

export interface Rapport {
  /** Nombre de résultats de chaque groupe. */
  resume: Record<CleGroupe, number>;
  groupes: Record<CleGroupe, ResultatRegle[]>;
  /** Résultat bloquant (PDF sans texte) : aucun autre contrôle n'a été fait. */
  bloquant: ResultatRegle | null;
}

/** « R05 » → 5, pour trier dans l'ordre des règles. */
function numeroDeRegle(id: string): number {
  const numero = /^R(\d+)$/.exec(id)?.[1];
  return numero === undefined ? Number.MAX_SAFE_INTEGER : Number(numero);
}

export function construireRapport(resultats: readonly ResultatRegle[]): Rapport {
  const groupes: Record<CleGroupe, ResultatRegle[]> = { aCorriger: [], aVerifier: [], conforme: [], informations: [] };
  let bloquant: ResultatRegle | null = null;
  for (const resultat of resultats) {
    if (resultat.gravite === 'bloquant') bloquant ??= resultat;
    else groupes[GROUPE_DE_LA_GRAVITE[resultat.gravite]].push(resultat);
  }
  for (const cle of ORDRE_GROUPES) {
    // Tri stable : deux résultats d'une même règle gardent leur ordre.
    groupes[cle].sort((a, b) => numeroDeRegle(a.id) - numeroDeRegle(b.id));
  }
  return {
    resume: {
      aCorriger: groupes.aCorriger.length,
      aVerifier: groupes.aVerifier.length,
      conforme: groupes.conforme.length,
      informations: groupes.informations.length,
    },
    groupes,
    bloquant,
  };
}

/**
 * Pages d'annexes qui ne contiennent qu'une image (scan, photo) : l'outil
 * n'en lit pas le texte, la checklist le rappelle.
 */
export function pagesAnnexesEnImage(document: ModeleDocument, decoupage: Decoupage): number[] {
  if (decoupage.annexes === null) return [];
  return pagesDe(decoupage.annexes).filter((numero) => {
    const page = document.pages[numero - 1];
    return page !== undefined && page.images.length > 0 && !page.blocs.some((bloc) => contientDuTexte(bloc.texte));
  });
}
