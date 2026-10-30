/// <reference lib="webworker" />
/**
 * Web Worker du vérificateur. pdf.js tourne ici, dans le même fil que notre
 * extraction : en exposant son gestionnaire dans globalThis.pdfjsWorker, on
 * évite qu'il crée un second Worker imbriqué.
 */
import * as pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs';
import { traiterMessage, type MessageExtraction, type ReponseExtraction } from './extract';

(globalThis as typeof globalThis & { pdfjsWorker?: unknown }).pdfjsWorker = pdfjsWorker;

declare const self: DedicatedWorkerGlobalScope;

self.addEventListener('message', (evenement: MessageEvent<MessageExtraction>) => {
  void traiterMessage(evenement.data).then((reponse: ReponseExtraction) => {
    self.postMessage(reponse);
  });
});
