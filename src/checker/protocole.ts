/**
 * Messages échangés entre la page et le Web Worker du vérificateur.
 * Ce module n'importe pas pdf.js : la page peut l'utiliser sans charger pdf.js.
 */
import type { ModeleDocument } from './types';

export type RaisonEchec = 'mot-de-passe' | 'pdf-invalide' | 'inconnue';

/** Page → Worker : le contenu du fichier. */
export interface MessageExtraction {
  donnees: ArrayBuffer;
}

/** Worker → page : avancement, une étape et une page à la fois. */
export interface ProgressionExtraction {
  type: 'progression';
  /** « lecture » : extraction du texte ; « miniatures » : dessin des aperçus. */
  etape: 'lecture' | 'miniatures';
  page: number;
  total: number;
}

/** Worker → page : la réponse finale. */
export type ReponseExtraction =
  | {
      ok: true;
      document: ModeleDocument;
      /** Aperçu de chaque page (PNG), ou null si le dessin a échoué. Absent si le navigateur ne sait pas les dessiner. */
      miniatures?: (Blob | null)[];
    }
  | {
      ok: false;
      raison: RaisonEchec;
      /** Erreur d'origine d'un échec « inconnue » (nom et message) : écrite dans la console, jamais affichée ni envoyée. */
      diagnostic?: string;
    };

function estObjet(valeur: unknown): valeur is Record<string, unknown> {
  return typeof valeur === 'object' && valeur !== null;
}

export function estMessageExtraction(valeur: unknown): valeur is MessageExtraction {
  return estObjet(valeur) && valeur['donnees'] instanceof ArrayBuffer;
}

/**
 * Chargé dans un Worker, pdf.worker.mjs s'initialise de lui-même et envoie ses
 * propres messages (« ready », de la forme { sourceName, targetName, action }) :
 * ces gardes ne retiennent que nos messages.
 */
export function estReponseExtraction(valeur: unknown): valeur is ReponseExtraction {
  if (!estObjet(valeur) || typeof valeur['ok'] !== 'boolean') return false;
  return valeur['ok'] ? estObjet(valeur['document']) : typeof valeur['raison'] === 'string';
}

export function estProgressionExtraction(valeur: unknown): valeur is ProgressionExtraction {
  return (
    estObjet(valeur) &&
    valeur['type'] === 'progression' &&
    (valeur['etape'] === 'lecture' || valeur['etape'] === 'miniatures') &&
    typeof valeur['page'] === 'number' &&
    typeof valeur['total'] === 'number'
  );
}
