import { describe, expect, it } from 'vitest';
import { traiterMessage } from '../../src/checker/extract';
import { estMessageExtraction, estProgressionExtraction, estReponseExtraction } from '../../src/checker/protocole';
import { lireFixture } from '../helpers/fixtures';

function enArrayBuffer(octets: Uint8Array): ArrayBuffer {
  return octets.buffer.slice(octets.byteOffset, octets.byteOffset + octets.byteLength) as ArrayBuffer;
}

/** Message envoyé par pdf.worker.mjs dès son chargement dans un Worker. */
const MESSAGE_READY_PDFJS = { sourceName: 'worker', targetName: 'main', action: 'ready', data: new Uint8Array() };

describe('traiterMessage (protocole du Web Worker)', () => {
  it('renvoie le modèle de document pour un PDF valide', async () => {
    const reponse = await traiterMessage({ donnees: enArrayBuffer(lireFixture('01_conforme')) });
    expect(reponse.ok).toBe(true);
    if (reponse.ok) expect(reponse.document.pages).toHaveLength(11);
  });

  it('renvoie « pdf-invalide » pour des octets quelconques', async () => {
    const reponse = await traiterMessage({ donnees: enArrayBuffer(new Uint8Array([1, 2, 3, 4, 5])) });
    expect(reponse).toEqual({ ok: false, raison: 'pdf-invalide' });
  });

  it('signale la progression page par page, puis appelle avantFermeture avec le modèle', async () => {
    const pages: string[] = [];
    let pagesDuModele = 0;
    await traiterMessage(
      { donnees: enArrayBuffer(lireFixture('01_conforme')) },
      {
        progression: (page, total) => pages.push(`${page}/${total}`),
        avantFermeture: async (pdf, modele) => {
          expect(pdf.numPages).toBe(11);
          pagesDuModele = modele.pages.length;
        },
      },
    );
    expect(pages).toEqual(Array.from({ length: 11 }, (_, i) => `${i + 1}/11`));
    expect(pagesDuModele).toBe(11);
  });
});

describe('gardes du protocole', () => {
  it('le message « ready » de pdf.js n’est ni une réponse ni une progression', () => {
    expect(estReponseExtraction(MESSAGE_READY_PDFJS)).toBe(false);
    expect(estProgressionExtraction(MESSAGE_READY_PDFJS)).toBe(false);
    expect(estMessageExtraction(MESSAGE_READY_PDFJS)).toBe(false);
  });

  it('reconnaît nos messages', () => {
    expect(estReponseExtraction({ ok: true, document: { pages: [], contientTexte: false } })).toBe(true);
    expect(estReponseExtraction({ ok: false, raison: 'pdf-invalide' })).toBe(true);
    expect(estProgressionExtraction({ type: 'progression', etape: 'lecture', page: 1, total: 3 })).toBe(true);
    expect(estMessageExtraction({ donnees: new ArrayBuffer(4) })).toBe(true);
  });

  it('refuse les messages incomplets', () => {
    expect(estReponseExtraction({ ok: true })).toBe(false);
    expect(estReponseExtraction({ ok: false })).toBe(false);
    expect(estProgressionExtraction({ type: 'progression', etape: 'autre', page: 1, total: 3 })).toBe(false);
    expect(estReponseExtraction(null)).toBe(false);
  });
});
