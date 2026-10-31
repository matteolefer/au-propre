/// <reference lib="webworker" />
/**
 * Web Worker du vérificateur. pdf.js tourne ici, dans le même fil que notre
 * extraction : en exposant son gestionnaire dans globalThis.pdfjsWorker, on
 * évite qu'il crée un second Worker imbriqué.
 *
 * Messages envoyés à la page : la progression (une page à la fois), puis la
 * réponse, avec les aperçus des pages si le PDF contient du texte.
 */
import * as pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs';
import { traiterMessage } from './extract';
import { dessinerMiniatures, FabriqueCanvasHorsEcran, miniaturesPossibles } from './miniatures';
import { estMessageExtraction, type ProgressionExtraction, type ReponseExtraction } from './protocole';

(globalThis as typeof globalThis & { pdfjsWorker?: unknown }).pdfjsWorker = pdfjsWorker;

declare const self: DedicatedWorkerGlobalScope;

function envoyerProgression(etape: ProgressionExtraction['etape'], page: number, total: number): void {
  const message: ProgressionExtraction = { type: 'progression', etape, page, total };
  self.postMessage(message);
}

self.addEventListener('message', (evenement: MessageEvent<unknown>) => {
  // pdf.js écoute aussi les messages de ce Worker : on ne traite que les nôtres.
  if (!estMessageExtraction(evenement.data)) return;
  let miniatures: (Blob | null)[] | undefined;
  void traiterMessage(evenement.data, {
    progression: (page, total) => envoyerProgression('lecture', page, total),
    ...(miniaturesPossibles() ? { CanvasFactory: FabriqueCanvasHorsEcran } : {}),
    avantFermeture: async (pdf, modele) => {
      // Un scan ne passe pas à l'écran de découpage : pas d'aperçu à dessiner.
      if (!modele.contientTexte || !miniaturesPossibles()) return;
      try {
        miniatures = await dessinerMiniatures(pdf, (page, total) => envoyerProgression('miniatures', page, total));
      } catch {
        miniatures = undefined;
      }
    },
  }).then((reponse: ReponseExtraction) => {
    self.postMessage(reponse.ok && miniatures ? { ...reponse, miniatures } : reponse);
  });
});
