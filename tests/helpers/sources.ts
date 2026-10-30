import { expect } from 'vitest';
import { SOURCES } from '../../src/content/rules.fr';
import type { ResultatRegle } from '../../src/checker/types';

type CodeSource = keyof typeof SOURCES;

/**
 * Chaque résultat a un titre et un détail, cite exactement les sources de
 * SPEC §5, et propose une correction quand il signale un problème.
 */
export function attendreTextesEtSources(resultats: readonly ResultatRegle[], codes: readonly CodeSource[]): void {
  expect(resultats.length).toBeGreaterThan(0);
  for (const resultat of resultats) {
    expect(resultat.titre).not.toBe('');
    expect(resultat.detail).not.toBe('');
    expect(resultat.sources.map((source) => source.url)).toEqual(codes.map((code) => SOURCES[code].url));
    if (resultat.gravite === 'erreur' || resultat.gravite === 'avertissement') {
      expect(resultat.correction).not.toBe('');
    }
  }
}

export function attendreTextesEtSourcesS1S2(resultats: readonly ResultatRegle[]): void {
  attendreTextesEtSources(resultats, ['S1', 'S2']);
}
