import { describe, expect, it } from 'vitest';
import { classerPolice, nomAffiche, nomSansPrefixe } from '../../src/checker/polices';

describe('classerPolice', () => {
  it.each([
    // Arial et ses variantes, telles que Word, Mac et d'anciens PDF les nomment.
    ['ArialMT', 'arial'],
    ['AAAAAC+ArialMT', 'arial'],
    ['Arial-BoldMT', 'arial'],
    ['Arial-ItalicMT', 'arial'],
    ['Arial-BoldItalicMT', 'arial'],
    ['Arial', 'arial'],
    ['Arial,Bold', 'arial'],
    ['Arial,BoldItalic', 'arial'],
    // Polices de substitution aux mêmes dimensions.
    ['CAAAAA+LiberationSans', 'substitut'],
    ['BAAAAA+LiberationSans-Bold', 'substitut'],
    ['LiberationSans-BoldItalic', 'substitut'],
    ['Liberation Sans', 'substitut'],
    ['Arimo', 'substitut'],
    ['Arimo-Italic', 'substitut'],
    // Autres polices, dont des cousines d'Arial qui ne sont pas Arial.
    ['CAAAAA+Carlito-Regular', 'autre'],
    ['AAAAAC+Calibri', 'autre'],
    ['TimesNewRomanPSMT', 'autre'],
    ['ArialNarrow', 'autre'],
    ['ArialNarrow-Bold', 'autre'],
    ['Arial-Black', 'autre'],
    ['ArialUnicodeMS', 'autre'],
    ['LiberationSansNarrow', 'autre'],
    // Polices de puces.
    ['Symbol', 'symbole'],
    ['SymbolMT', 'symbole'],
    ['Wingdings-Regular', 'symbole'],
    ['OpenSymbol', 'symbole'],
    // Identifiant interne de pdf.js quand le PDF ne nomme pas la police.
    ['g_d0_f3', 'inconnue'],
  ] as const)('%s → %s', (nom, classe) => {
    expect(classerPolice(nom)).toBe(classe);
  });
});

describe('nomAffiche et nomSansPrefixe', () => {
  it.each([
    ['CAAAAA+LiberationSans', 'Liberation Sans'],
    ['BAAAAA+LiberationSans-Bold', 'Liberation Sans'],
    ['AAAAAC+ArialMT', 'Arial'],
    ['Arial-BoldItalicMT', 'Arial'],
    ['CAAAAA+Carlito-Regular', 'Carlito'],
    ['TimesNewRomanPSMT', 'Times New Roman'],
    ['Arial-Black', 'Arial Black'],
  ])('%s → %s', (nom, affiche) => {
    expect(nomAffiche(nom)).toBe(affiche);
  });

  it('retire le préfixe de sous-ensemble et lui seul', () => {
    expect(nomSansPrefixe('BCDEEE+Arial-BoldMT')).toBe('Arial-BoldMT');
    expect(nomSansPrefixe('ArialMT')).toBe('ArialMT');
  });
});
