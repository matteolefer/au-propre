/**
 * Complément pour Safari 18 et antérieurs : `for await` sur un ReadableStream,
 * utilisé par pdf.js 6 pour lire le texte (getTextContent). Node le fournit
 * déjà : le test porte sur un flux sans itérateur, comme dans Safari.
 */
import { describe, expect, it } from 'vitest';
import { rendreFluxIterables } from '../../src/checker/flux-iterables';

/** Flux à la manière de Safari 18 : un lecteur, mais pas de Symbol.asyncIterator. */
class FluxSansIterateur<T> {
  verrouLibere = false;

  constructor(private readonly morceaux: T[]) {}

  getReader() {
    const morceaux = [...this.morceaux];
    return {
      read: async () => (morceaux.length > 0 ? { done: false, value: morceaux.shift() } : { done: true, value: undefined }),
      releaseLock: () => {
        this.verrouLibere = true;
      },
    };
  }
}

describe('rendreFluxIterables', () => {
  it('rend un flux sans itérateur parcourable avec for await, puis libère le lecteur', async () => {
    const flux = new FluxSansIterateur(['a', 'b', 'c']);
    expect(Symbol.asyncIterator in flux).toBe(false);
    rendreFluxIterables(FluxSansIterateur.prototype);
    const lus: string[] = [];
    for await (const morceau of flux as unknown as AsyncIterable<string>) lus.push(morceau);
    expect(lus).toEqual(['a', 'b', 'c']);
    expect(flux.verrouLibere).toBe(true);
  });

  it('ne remplace pas l’itérateur fourni par le navigateur', () => {
    const avant = (ReadableStream.prototype as unknown as Record<symbol, unknown>)[Symbol.asyncIterator];
    expect(avant).toBeTypeOf('function');
    rendreFluxIterables();
    expect((ReadableStream.prototype as unknown as Record<symbol, unknown>)[Symbol.asyncIterator]).toBe(avant);
  });
});
