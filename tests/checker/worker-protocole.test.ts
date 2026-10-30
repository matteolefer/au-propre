import { describe, expect, it } from 'vitest';
import { traiterMessage } from '../../src/checker/extract';
import { lireFixture } from '../helpers/fixtures';

function enArrayBuffer(octets: Uint8Array): ArrayBuffer {
  return octets.buffer.slice(octets.byteOffset, octets.byteOffset + octets.byteLength) as ArrayBuffer;
}

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
});
