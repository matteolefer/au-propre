/**
 * Concours interne de CPE (SPEC §5) : sources propres au concours (S10, S11)
 * pour la présentation, et mention « bonne pratique » pour R12 et R13, que
 * seuls des jurys d'autres concours recommandent.
 */
import { describe, expect, it } from 'vitest';
import { CONCOURS_CPE } from '../../src/checker/rules/nombre-pages';
import { verifierR05 } from '../../src/checker/rules/R05-police-arial';
import { verifierR06 } from '../../src/checker/rules/R06-taille';
import { verifierR07 } from '../../src/checker/rules/R07-interligne';
import { verifierR08 } from '../../src/checker/rules/R08-marges-laterales';
import { verifierR09 } from '../../src/checker/rules/R09-en-tete-pied';
import { verifierR10 } from '../../src/checker/rules/R10-retrait';
import { verifierR11 } from '../../src/checker/rules/R11-format-a4';
import { verifierR12 } from '../../src/checker/rules/R12-pagination';
import { verifierR13 } from '../../src/checker/rules/R13-couleur';
import { verifierR15 } from '../../src/checker/rules/R15-cv';
import { verifierR16 } from '../../src/checker/rules/R16-documents-interdits';
import type { ParametresDossier } from '../../src/checker/types';
import { DECOUPAGE_SYNTHETIQUE, documentStandard, documentSynthetique } from '../helpers/document-synthetique';
import { chargerFixture, DECOUPAGES } from '../helpers/fixtures';
import { attendreTextesEtSources } from '../helpers/sources';

const CPE: ParametresDossier = { concours: CONCOURS_CPE, discipline: null, nomFichier: null };
const CAPES: ParametresDossier = { concours: 'capes-interne', discipline: 'lettres-modernes', nomFichier: null };

const PRESENTATION = [
  ['R05', verifierR05],
  ['R07', verifierR07],
  ['R08', verifierR08],
  ['R09', verifierR09],
  ['R10', verifierR10],
  ['R11', verifierR11],
] as const;

describe('CPE interne : sources de la présentation matérielle', () => {
  it.each(PRESENTATION)('%s cite S10 et S11 au CPE, S1 et S2 sinon', async (_id, verifier) => {
    const document = await chargerFixture('01_conforme_word');
    const decoupage = DECOUPAGES['01_conforme_word'];
    attendreTextesEtSources(verifier(document, decoupage, CPE), ['S10', 'S11']);
    attendreTextesEtSources(verifier(document, decoupage, CAPES), ['S1', 'S2']);
    attendreTextesEtSources(verifier(document, decoupage), ['S1', 'S2']);
  });

  it('R06 garde S8, source de la recommandation sur les titres', async () => {
    const document = await chargerFixture('01_conforme_word');
    const decoupage = DECOUPAGES['01_conforme_word'];
    attendreTextesEtSources(verifierR06(document, decoupage, CPE), ['S10', 'S11', 'S8']);
    attendreTextesEtSources(verifierR06(document, decoupage, CAPES), ['S1', 'S2', 'S8']);
  });

  it('contrôle impossible (parties sans texte) : sources du CPE aussi', () => {
    const vide = documentSynthetique(11, { vides: [2, 3, 4, 5, 6, 7, 8, 9] });
    attendreTextesEtSources(verifierR08(vide, DECOUPAGE_SYNTHETIQUE, CPE), ['S10', 'S11']);
  });
});

describe('CPE interne : R12 et R13, bonnes pratiques venues d’autres jurys', () => {
  it('R12 : avertissement avec la mention, source S8 inchangée', () => {
    const document = documentStandard({}, { pied: null });
    const [cpe] = verifierR12(document, DECOUPAGE_SYNTHETIQUE, CPE);
    expect(cpe?.gravite).toBe('avertissement');
    expect(cpe?.detail).toContain(
      'Pour le CPE, cette recommandation vient du jury d’un autre concours (CAPES interne de lettres) : elle est donnée comme bonne pratique.',
    );
    attendreTextesEtSources([cpe!], ['S8']);
    expect(verifierR12(document, DECOUPAGE_SYNTHETIQUE, CAPES)[0]?.detail).not.toContain('CPE');
  });

  it('R13 : avertissement avec la mention, source S7 inchangée', () => {
    const document = documentStandard({ 5: { couleur: '#c00000' } });
    const [cpe] = verifierR13(document, DECOUPAGE_SYNTHETIQUE, CPE);
    expect(cpe?.gravite).toBe('avertissement');
    expect(cpe?.detail).toBe(
      'Couleur #C00000 (page\u00A05). Pour le CPE, cette recommandation vient du jury d’un autre concours (CAPES interne d’arts plastiques) : elle est donnée comme bonne pratique.',
    );
    attendreTextesEtSources([cpe!], ['S7']);
    expect(verifierR13(document, DECOUPAGE_SYNTHETIQUE, CAPES)[0]?.detail).toBe('Couleur #C00000 (page\u00A05).');
  });

  it('conforme : pas de mention', () => {
    expect(verifierR12(documentStandard(), DECOUPAGE_SYNTHETIQUE, CPE)[0]?.detail).not.toContain('CPE');
    expect(verifierR13(documentStandard(), DECOUPAGE_SYNTHETIQUE, CPE)[0]?.detail).not.toContain('CPE');
  });
});

describe('CPE interne : R15 et R16 citent aussi le rapport du jury 2026', () => {
  it('R15 : S5, S7 et S11', async () => {
    const document = await chargerFixture('01_conforme_word');
    attendreTextesEtSources(verifierR15(document, DECOUPAGES['01_conforme_word'], CPE), ['S5', 'S7', 'S11']);
    attendreTextesEtSources(verifierR15(document, DECOUPAGES['01_conforme_word'], CAPES), ['S5', 'S7']);
  });

  it('R16 : S9 et S11', async () => {
    const document = await chargerFixture('01_conforme_word');
    attendreTextesEtSources(verifierR16(document, DECOUPAGES['01_conforme_word'], CPE), ['S9', 'S11']);
    attendreTextesEtSources(verifierR16(document, DECOUPAGES['01_conforme_word'], CAPES), ['S9']);
  });
});
