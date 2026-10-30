import { describe, expect, it } from 'vitest';
import { verifierR01 } from '../../src/checker/rules/R01-couverture';
import { avecPage, documentStandard, pageCouverture, pageDeLignes } from '../helpers/document-synthetique';
import { chargerFixture, DECOUPAGES, FIXTURES_TEXTE } from '../helpers/fixtures';
import { attendreTextesEtSources } from '../helpers/sources';

const SOURCES_R01 = ['S2', 'S3', 'S5'] as const;

describe('R01 : page de couverture', () => {
  it.each(FIXTURES_TEXTE)('%s : couverture détectée, à confirmer (info)', async (nom) => {
    const resultats = verifierR01(await chargerFixture(nom), DECOUPAGES[nom]);
    expect(resultats).toHaveLength(1);
    expect(resultats[0]).toMatchObject({ gravite: 'info', titre: 'Couverture détectée' });
    expect(resultats[0]?.detail).toBe(
      'Couverture détectée : vérifiez dans la checklist qu’il s’agit du formulaire 2027 téléchargé dans Cyclades.',
    );
    attendreTextesEtSources(resultats, SOURCES_R01);
  });

  it('page 1 sans aucun mot-clé : avertissement', () => {
    const document = avecPage(documentStandard(), pageDeLignes(1, ['Mon dossier', 'Introduction générale à mon parcours.'], null));
    const resultats = verifierR01(document);
    expect(resultats.map((r) => [r.gravite, r.titre])).toEqual([['avertissement', 'La page 1 ne ressemble pas à la couverture']]);
    attendreTextesEtSources(resultats, SOURCES_R01);
  });

  it('couverture de la session 2026 : avertissement', () => {
    const resultats = verifierR01(avecPage(documentStandard(), pageCouverture(2026)));
    expect(resultats.map((r) => r.gravite)).toEqual(['avertissement']);
    expect(resultats[0]?.titre).toBe('La couverture mentionne une autre session que 2027');
    expect(resultats[0]?.detail).toContain('session 2026');
  });

  it('page 1 sans texte (couverture scannée) : avertissement', () => {
    const scan = { ...pageDeLignes(1, [], null), images: [{ x: 0, y: 0, largeur: 595, hauteur: 842 }] };
    const resultats = verifierR01(avecPage(documentStandard(), scan));
    expect(resultats.map((r) => [r.gravite, r.titre])).toEqual([['avertissement', 'La page 1 ne contient pas de texte']]);
  });

  it('page 1 qui commence par « Première partie » : avertissement, couverture absente', () => {
    const page = pageDeLignes(1, ['Première partie : mon parcours', 'Concours préparé en 2026 et en 2027.'], null);
    const resultats = verifierR01(avecPage(documentStandard(), page));
    expect(resultats.map((r) => [r.gravite, r.titre])).toEqual([['avertissement', 'La couverture semble absente']]);
  });

  it('session configurable : « Session 2028 » acceptée pour la session 2028', () => {
    const document = avecPage(documentStandard(), pageCouverture(2028));
    expect(verifierR01(document, undefined, undefined, 2028).map((r) => r.gravite)).toEqual(['info']);
    expect(verifierR01(document).map((r) => r.gravite)).toEqual(['avertissement']);
  });
});
