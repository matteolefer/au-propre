/**
 * Checklist manuelle du rapport (SPEC §6) : ce que l'outil ne peut pas
 * vérifier automatiquement. Chaque point cite ses sources.
 */
import { SESSION_ATTENDUE } from '../checker/measure';
import type { Source } from '../checker/types';
import { listePages, SOURCES } from './rules.fr';

const ESP = ' ';

export interface PointChecklist {
  id: string;
  texte: string;
  /** Précision affichée sous le point, par exemple les pages concernées. */
  precision?: string;
  sources: Source[];
}

export interface ContexteChecklist {
  /** Le concours de CPE n'a pas de discipline : le point sur la discipline ne s'affiche pas. */
  sansDiscipline: boolean;
  /** Pages d'annexes sans texte lisible (images, scans). */
  pagesAnnexesEnImage: readonly number[];
}

export function pointsChecklist(contexte: ContexteChecklist): PointChecklist[] {
  const points: (PointChecklist | null)[] = [
    {
      id: 'couverture',
      texte: `La page de couverture est celle de l’année ${SESSION_ATTENDUE}, téléchargée dans mon espace Cyclades.`,
      sources: [SOURCES.S2, SOURCES.S3],
    },
    { id: 'signature', texte: 'J’ai signé le dossier.', sources: [SOURCES.S5, SOURCES.S6] },
    contexte.sansDiscipline
      ? null
      : { id: 'discipline', texte: 'La discipline de ma séquence est celle choisie à l’inscription.', sources: [SOURCES.S5] },
    { id: 'attestation', texte: 'J’atteste sur l’honneur l’authenticité de toutes les informations.', sources: [SOURCES.S2] },
    {
      id: 'annexes',
      texte: 'Mes annexes sont 1 ou 2 exemples liés à la situation décrite et ne prolongent pas l’analyse.',
      sources: [SOURCES.S2, SOURCES.S5],
    },
    {
      id: 'annexes-images',
      texte:
        `Mes annexes en image (pages scannées, photos) ne contiennent ni CV, ni lettre de recommandation, ni rapport d’inspection ou de visite-conseil, ni lien ou QR code${ESP}: ` +
        'l’outil ne lit pas le texte des images.',
      ...(contexte.pagesAnnexesEnImage.length > 0
        ? {
            precision: `L’outil n’a pas pu lire ${
              contexte.pagesAnnexesEnImage.length === 1 ? 'la ' : 'les '
            }${listePages(contexte.pagesAnnexesEnImage)} des annexes, qui ${
              contexte.pagesAnnexesEnImage.length === 1 ? 'est une image' : 'sont des images'
            }.`,
          }
        : {}),
      // Sources des règles R15 (CV), R16 (documents interdits) et R17 (liens et QR codes).
      sources: [SOURCES.S5, SOURCES.S7, SOURCES.S9, SOURCES.S6],
    },
    { id: 'anonymat', texte: 'Les élèves sont anonymisés dans le texte et les annexes.', sources: [SOURCES.S5, SOURCES.S7] },
    { id: 'citations', texte: 'Chaque citation est entre guillemets et référencée.', sources: [SOURCES.S5] },
    { id: 'pagination', texte: 'J’ai vérifié la pagination après l’export en PDF.', sources: [SOURCES.S5] },
    {
      id: 'depot',
      texte: `Je dépose avant le jeudi 3${ESP}décembre 2026 à 23${ESP}h${ESP}59, rubrique « Mes justificatifs ».`,
      sources: [SOURCES.S3],
    },
  ];
  return points.filter((point): point is PointChecklist => point !== null);
}
