/** Textes de la page « Les règles officielles du RAEP » (SPEC §9). */
import { describe, expect, it } from 'vitest';
import { EXPLICATIONS, GROUPES_REGLES, LIBELLES_REGLES, TEXTES_REGLES, type IdRegleExpliquee } from '../../src/content/rules.fr';
import { pointsChecklist } from '../../src/content/checklist.fr';
import { INSCRIPTION } from '../../src/content/interface.fr';
import { erreursTypographiques } from '../helpers/typographie';

const IDS = Object.keys(EXPLICATIONS) as IdRegleExpliquee[];

describe('page des règles', () => {
  it('explique les 19 règles officielles, R01 à R19 (R00 est une condition de l’outil)', () => {
    expect(IDS).toEqual(Array.from({ length: 19 }, (_, i) => `R${String(i + 1).padStart(2, '0')}`));
  });

  it('chaque règle figure dans un seul groupe', () => {
    const rangees = GROUPES_REGLES.flatMap((groupe) => groupe.regles);
    expect([...rangees].sort()).toEqual(IDS);
  });

  it.each(IDS)('%s : énoncé, contrôle, conseil et sources', (id) => {
    const explication = EXPLICATIONS[id];
    for (const texte of [explication.regle, explication.controle, explication.conseil]) expect(texte).toMatch(/\S.*\.$/);
    expect(LIBELLES_REGLES[id]).toBe(TEXTES_REGLES[id].libelle);
    expect(TEXTES_REGLES[id].sources.length).toBeGreaterThan(0);
    for (const source of TEXTES_REGLES[id].sources) expect(source.url).toMatch(/^https:\/\//);
  });

  it('typographie française de tous les textes affichés sur les pages', () => {
    const textes = [
      ...IDS.flatMap((id) => [LIBELLES_REGLES[id] ?? '', ...Object.values(EXPLICATIONS[id])]),
      ...GROUPES_REGLES.flatMap((groupe) => [groupe.titre, groupe.intro]),
      ...pointsChecklist({ sansDiscipline: false, pagesAnnexesEnImage: [] }).map((point) => point.texte),
      INSCRIPTION.titre,
      INSCRIPTION.texte,
      INSCRIPTION.independance,
      INSCRIPTION.note('Brevo'),
    ];
    expect(textes.flatMap(erreursTypographiques)).toEqual([]);
  });

  it('aucun mot qui ferait passer le produit pour un service officiel ou une IA', () => {
    const textes = IDS.flatMap((id) => Object.values(EXPLICATIONS[id])).join(' ');
    expect(textes).not.toMatch(/\bIA\b|magique|révolution|boost|garanti/i);
  });
});
