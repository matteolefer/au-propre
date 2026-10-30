import { expect } from 'vitest';
import { SOURCES } from '../../src/content/rules.fr';
import type { ResultatRegle } from '../../src/checker/types';

/** Chaque résultat a un titre, un détail et cite S1 et S2 (SPEC §5). */
export function attendreTextesEtSourcesS1S2(resultats: readonly ResultatRegle[]): void {
  for (const resultat of resultats) {
    expect(resultat.titre).not.toBe('');
    expect(resultat.detail).not.toBe('');
    expect(resultat.sources.map((source) => source.url)).toEqual([SOURCES.S1.url, SOURCES.S2.url]);
    if (resultat.gravite === 'erreur' || resultat.gravite === 'avertissement') {
      expect(resultat.correction).not.toBe('');
    }
  }
}
