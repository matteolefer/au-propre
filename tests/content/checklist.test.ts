import { describe, expect, it } from 'vitest';
import { pointsChecklist } from '../../src/content/checklist.fr';

describe('checklist manuelle (SPEC §6)', () => {
  it('les 9 points de SPEC §6 et le point sur les annexes en image, chacun avec ses sources', () => {
    const points = pointsChecklist({ sansDiscipline: false, pagesAnnexesEnImage: [] });
    expect(points).toHaveLength(10);
    for (const point of points) {
      expect(point.sources.length).toBeGreaterThan(0);
      for (const source of point.sources) expect(source.url).toMatch(/^https:\/\//);
    }
    expect(points.find((p) => p.id === 'annexes-images')?.precision).toBeUndefined();
  });

  it('cite les pages d’annexes en image', () => {
    const points = pointsChecklist({ sansDiscipline: false, pagesAnnexesEnImage: [10, 11] });
    expect(points.find((p) => p.id === 'annexes-images')?.precision).toBe(
      'L’outil n’a pas pu lire les pages 10 et 11 des annexes, qui sont des images.',
    );
  });

  it('CPE : pas de point sur la discipline', () => {
    const points = pointsChecklist({ sansDiscipline: true, pagesAnnexesEnImage: [] });
    expect(points.map((p) => p.id)).not.toContain('discipline');
    expect(points).toHaveLength(9);
  });
});
