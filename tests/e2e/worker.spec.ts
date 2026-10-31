/**
 * Chargé dans un Worker, pdf.worker.mjs s'initialise de lui-même et envoie un
 * message « ready » avant notre réponse. La page doit l'ignorer et attendre
 * la vraie réponse (src/checker/protocole.ts).
 */
import { expect, test } from '@playwright/test';
import {
  cheminFixture,
  lireJusquAuDecoupage,
  ouvrirVerificateur,
  remplirParametres,
} from './outils.ts';

interface MessageNote {
  action: string | null;
  type: string | null;
  ok: boolean | null;
}

test('le message « ready » de pdf.js est reçu puis ignoré : le découpage s’affiche', async ({ page }) => {
  // Enregistre chaque message reçu d'un Worker créé par la page.
  await page.addInitScript(() => {
    const WorkerOriginal = window.Worker;
    const messages: unknown[] = [];
    Object.assign(window, { __messagesWorker: messages });
    window.Worker = class extends WorkerOriginal {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        this.addEventListener('message', (evenement: MessageEvent<unknown>) => {
          const d = evenement.data as Record<string, unknown> | null;
          messages.push({
            action: typeof d?.['action'] === 'string' ? d['action'] : null,
            type: typeof d?.['type'] === 'string' ? d['type'] : null,
            ok: typeof d?.['ok'] === 'boolean' ? d['ok'] : null,
          });
        });
      }
    };
  });

  await ouvrirVerificateur(page);
  await remplirParametres(page, { fichier: cheminFixture('01_conforme_word.pdf') });
  await lireJusquAuDecoupage(page);

  const messages = await page.evaluate(() => (window as unknown as { __messagesWorker: MessageNote[] }).__messagesWorker);
  const ready = messages.findIndex((m) => m.action === 'ready');
  const reponse = messages.findIndex((m) => m.ok === true);
  expect(ready).toBeGreaterThanOrEqual(0);
  expect(reponse).toBeGreaterThan(ready);
  // Entre les deux : la progression, page par page.
  expect(messages.filter((m) => m.type === 'progression').length).toBeGreaterThanOrEqual(11);
  await expect(page.getByRole('alert')).toHaveCount(0);
});
