import { describe, expect, it } from 'vitest';
import { CONCOURS_CPE } from '../../src/checker/rules/nombre-pages';
import { DISCIPLINE_HISTOIRE_GEOGRAPHIE } from '../../src/checker/rules/R18-hggsp';
import { CONCOURS, SOURCE_SECTIONS, SECTIONS_SANS_RAEP, trouverConcours } from '../../src/content/concours.fr';
import { normaliser } from '../../src/checker/recherche';

describe('concours et disciplines', () => {
  it('les 7 concours de SPEC §4, dans l’ordre', () => {
    expect(CONCOURS.map((c) => c.id)).toEqual([
      'capes-interne',
      'caer-capes',
      'caplp-interne',
      'caer-caplp',
      'capet-interne',
      'caer-capet',
      CONCOURS_CPE,
    ]);
  });

  it('identifiants uniques dans chaque concours', () => {
    for (const concours of CONCOURS) {
      const ids = concours.disciplines.map((d) => d.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('l’histoire-géographie du CAPES porte l’identifiant attendu par R18, pas celle du CAPLP', () => {
    expect(trouverConcours('capes-interne')?.disciplines.some((d) => d.id === DISCIPLINE_HISTOIRE_GEOGRAPHIE)).toBe(true);
    expect(trouverConcours('caer-capes')?.disciplines.some((d) => d.id === DISCIPLINE_HISTOIRE_GEOGRAPHIE)).toBe(true);
    expect(trouverConcours('caplp-interne')?.disciplines.some((d) => d.id === DISCIPLINE_HISTOIRE_GEOGRAPHIE)).toBe(false);
  });

  it('pas de discipline pour le CPE, au moins une pour les autres', () => {
    for (const concours of CONCOURS) {
      expect(concours.disciplines.length === 0).toBe(concours.id === CONCOURS_CPE);
    }
  });

  it('les sections sans RAEP sont écartées du CAPES', () => {
    const libelles = trouverConcours('capes-interne')?.disciplines.map((d) => normaliser(d.libelle)) ?? [];
    expect(libelles.some((l) => l.includes('documentation') || l.includes('education musicale'))).toBe(false);
    expect(SECTIONS_SANS_RAEP.source.url).toMatch(/^https:\/\//);
  });

  it('la liste cite sa source officielle', () => {
    expect(SOURCE_SECTIONS.url).toMatch(/^https:\/\/www\.devenirenseignant\.gouv\.fr\//);
  });
});
