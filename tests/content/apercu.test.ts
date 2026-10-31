/** Aperçu du rapport de l'accueil : données d'exemple cohérentes, textes réels des règles. */
import { describe, expect, it } from 'vitest';
import { construireRapport } from '../../src/checker/report';
import { verifierR08 } from '../../src/checker/rules/R08-marges-laterales';
import { APERCU, MINIATURES_EXEMPLE, RESULTATS_EXEMPLE } from '../../src/content/apercu.fr';
import { chargerFixture, DECOUPAGES } from '../helpers/fixtures';
import { erreursTypographiques } from '../helpers/typographie';

describe('aperçu du rapport (accueil)', () => {
  it('un point à corriger, un à vérifier, trois conformes', () => {
    expect(construireRapport(RESULTATS_EXEMPLE).resume).toEqual({ aCorriger: 1, aVerifier: 1, conforme: 3, informations: 0 });
  });

  it('chaque résultat cite ses sources et propose une correction quand il signale un problème', () => {
    for (const resultat of RESULTATS_EXEMPLE) {
      expect(resultat.sources.length).toBeGreaterThan(0);
      if (resultat.gravite !== 'conforme') expect(resultat.correction).not.toBe('');
    }
  });

  it('l’erreur R08 est celle que produit la règle sur la fixture 04 (marges de 2 cm), zones de la page 2 comprises', async () => {
    const [reel] = verifierR08(await chargerFixture('04_marges_2cm_word'), DECOUPAGES['04_marges_2cm_word']);
    const exemple = RESULTATS_EXEMPLE.find((r) => r.id === 'R08');
    expect(exemple).toMatchObject({ gravite: reel?.gravite, titre: reel?.titre, detail: reel?.detail, pages: reel?.pages, correction: reel?.correction });
    const reelles = (reel?.zones ?? []).filter((zone) => zone.page === 2);
    expect(exemple?.zones).toHaveLength(reelles.length);
    exemple?.zones?.forEach((zone, i) => {
      for (const cle of ['x', 'y', 'largeur', 'hauteur', 'largeurPage', 'hauteurPage'] as const) {
        expect(zone[cle]).toBeCloseTo(reelles[i]?.[cle] ?? NaN, 1);
      }
    });
    expect(MINIATURES_EXEMPLE[1]).toBe('/exemple/page-2.png');
  });

  it('typographie française et mention de l’exemple', () => {
    const textes = [...Object.values(APERCU), ...RESULTATS_EXEMPLE.flatMap((r) => [r.titre, r.detail, r.correction])];
    expect(textes.flatMap(erreursTypographiques)).toEqual([]);
    expect(APERCU.legende).toMatch(/fictif/);
  });
});
