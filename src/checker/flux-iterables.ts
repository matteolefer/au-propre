/**
 * Safari 18 et antérieurs (Mac, iPhone) ne savent pas parcourir un
 * ReadableStream avec `for await`. pdf.js 6 le fait pour lire le texte d'une
 * page et pour décompresser certains flux, et son build « legacy » ne le
 * complète pas : sans ce complément, toute lecture échoue (« undefined is not
 * a function »). Installé dans le Worker, seulement si le navigateur ne le
 * fournit pas.
 */
export function rendreFluxIterables(prototype: object = ReadableStream.prototype): void {
  if (Symbol.asyncIterator in prototype) return;
  Object.defineProperty(prototype, Symbol.asyncIterator, {
    configurable: true,
    writable: true,
    value: async function* (this: ReadableStream<unknown>) {
      const lecteur = this.getReader();
      try {
        for (;;) {
          const { done, value } = await lecteur.read();
          if (done) return;
          yield value;
        }
      } finally {
        lecteur.releaseLock();
      }
    },
  });
}
