/**
 * Côté page : lance l'extraction dans un Web Worker pour ne pas bloquer
 * l'interface. Le fichier reste dans le navigateur.
 */
import type { MessageExtraction, ReponseExtraction } from './extract';

export async function extraireDansWorker(fichier: File): Promise<ReponseExtraction> {
  const donnees = await fichier.arrayBuffer();
  return new Promise<ReponseExtraction>((resoudre) => {
    const worker = new Worker(new URL('./extract.worker.ts', import.meta.url), { type: 'module' });
    const terminer = (reponse: ReponseExtraction) => {
      worker.terminate();
      resoudre(reponse);
    };
    worker.addEventListener('message', (evenement: MessageEvent<unknown>) => {
      // Chargé dans un Worker, pdf.worker.mjs s'initialise de lui-même et envoie
      // ses propres messages (« ready ») : on ne retient que notre réponse.
      if (estReponseExtraction(evenement.data)) terminer(evenement.data);
    });
    worker.addEventListener('error', () => terminer({ ok: false, raison: 'inconnue' }));
    const message: MessageExtraction = { donnees };
    // Transfert sans copie : le tampon passe au Worker.
    worker.postMessage(message, [donnees]);
  });
}

function estReponseExtraction(donnees: unknown): donnees is ReponseExtraction {
  return typeof donnees === 'object' && donnees !== null && 'ok' in donnees && typeof donnees.ok === 'boolean';
}
