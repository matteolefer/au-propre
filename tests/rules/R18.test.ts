import { describe, expect, it } from 'vitest';
import { DISCIPLINE_HISTOIRE_GEOGRAPHIE, verifierR18 } from '../../src/checker/rules/R18-hggsp';
import { avecPage, DECOUPAGE_SYNTHETIQUE, documentStandard, pageDeLignes } from '../helpers/document-synthetique';
import { attendreTextesEtSources } from '../helpers/sources';

const HG = { discipline: DISCIPLINE_HISTOIRE_GEOGRAPHIE, nomFichier: null };

describe('R18 : HGGSP en histoire-géographie', () => {
  it('« HGGSP » en partie 2 en histoire-géographie : avertissement', () => {
    const document = avecPage(documentStandard(), pageDeLignes(5, ['Cette séance de spécialité HGGSP en terminale porte sur la puissance.']));
    const resultats = verifierR18(document, DECOUPAGE_SYNTHETIQUE, HG);
    expect(resultats[0]).toMatchObject({ gravite: 'avertissement', pages: [5] });
    attendreTextesEtSources(resultats, ['S5']);
  });

  it('« HGGSP » en partie 1 seulement (parcours) : conforme', () => {
    const document = avecPage(documentStandard(), pageDeLignes(2, ['J’ai enseigné l’HGGSP en terminale pendant deux ans.']));
    const resultats = verifierR18(document, DECOUPAGE_SYNTHETIQUE, HG);
    expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
    attendreTextesEtSources(resultats, ['S5']);
  });

  it('autre discipline ou discipline inconnue : la règle ne s’applique pas', () => {
    const document = avecPage(documentStandard(), pageDeLignes(5, ['Séance de spécialité HGGSP.']));
    expect(verifierR18(document, DECOUPAGE_SYNTHETIQUE, { discipline: 'lettres-modernes', nomFichier: null })).toEqual([]);
    expect(verifierR18(document, DECOUPAGE_SYNTHETIQUE, { discipline: null, nomFichier: null })).toEqual([]);
  });
});
