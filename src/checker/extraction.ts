/**
 * Côté page : lance l'extraction dans un Web Worker pour ne pas bloquer
 * l'interface. Le fichier reste dans le navigateur.
 */
import {
  estProgressionExtraction,
  estReponseExtraction,
  type MessageExtraction,
  type ProgressionExtraction,
  type ReponseExtraction,
} from './protocole';

export interface OptionsLecture {
  progression?: (progression: ProgressionExtraction) => void;
  /** Annule la lecture : le Worker est arrêté et la promesse rejetée (AbortError). */
  signal?: AbortSignal;
}

function erreurAnnulation(): DOMException {
  return new DOMException('Lecture annulée', 'AbortError');
}

export async function extraireDansWorker(fichier: File, options: OptionsLecture = {}): Promise<ReponseExtraction> {
  const { progression, signal } = options;
  if (signal?.aborted) throw erreurAnnulation();
  const donnees = await fichier.arrayBuffer();
  if (signal?.aborted) throw erreurAnnulation();
  return new Promise<ReponseExtraction>((resoudre, rejeter) => {
    const worker = new Worker(new URL('./extract.worker.ts', import.meta.url), { type: 'module' });
    const annuler = () => {
      worker.terminate();
      rejeter(erreurAnnulation());
    };
    const terminer = (reponse: ReponseExtraction) => {
      worker.terminate();
      signal?.removeEventListener('abort', annuler);
      resoudre(reponse);
    };
    signal?.addEventListener('abort', annuler, { once: true });
    worker.addEventListener('message', (evenement: MessageEvent<unknown>) => {
      // Chargé dans un Worker, pdf.worker.mjs s'initialise de lui-même et envoie
      // ses propres messages (« ready ») : on ne retient que les nôtres.
      if (estReponseExtraction(evenement.data)) terminer(evenement.data);
      else if (estProgressionExtraction(evenement.data)) progression?.(evenement.data);
    });
    worker.addEventListener('error', () => terminer({ ok: false, raison: 'inconnue' }));
    const message: MessageExtraction = { donnees };
    // Transfert sans copie : le tampon passe au Worker.
    worker.postMessage(message, [donnees]);
  });
}
