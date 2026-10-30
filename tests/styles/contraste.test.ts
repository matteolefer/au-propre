import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');

/** Résout une variable CSS jusqu'à sa valeur hexadécimale. */
function couleur(nom: string): string {
  const declaration = new RegExp(`${nom}:\\s*([^;]+);`).exec(css)?.[1]?.trim();
  if (!declaration) throw new Error(`Variable absente : ${nom}`);
  const reference = /^var\((--[\w-]+)\)$/.exec(declaration)?.[1];
  if (reference) return couleur(reference);
  if (!/^#[0-9a-f]{6}$/i.test(declaration)) throw new Error(`${nom} n’est pas une couleur opaque : ${declaration}`);
  return declaration;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

function contraste(a: string, b: string): number {
  const [clair, sombre] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((clair ?? 0) + 0.05) / ((sombre ?? 0) + 0.05);
}

const TEXTES = [
  '--color-text',
  '--color-text-muted',
  '--color-accent-text',
  '--color-erreur',
  '--color-avertissement',
  '--color-conforme',
];

const PAIRES: [string, string][] = [
  ...TEXTES.flatMap((texte): [string, string][] => [
    [texte, '--color-bg'],
    [texte, '--color-surface'],
  ]),
  ['--color-erreur', '--color-erreur-bg'],
  ['--color-avertissement', '--color-avertissement-bg'],
  ['--color-conforme', '--color-conforme-bg'],
  ['--color-accent-contrast', '--color-accent'],
  ['--color-accent-text', '--color-accent-soft'],
];

describe('contraste AA des couleurs de texte (4,5:1 minimum)', () => {
  it.each(PAIRES)('%s sur %s', (texte, fond) => {
    expect(contraste(couleur(texte), couleur(fond))).toBeGreaterThanOrEqual(4.5);
  });
});
