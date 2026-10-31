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
  '--color-accent-survol',
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
  ['--color-accent-contrast', '--color-accent-survol'],
  ['--color-accent-text', '--color-accent-soft'],
  ['--color-accent-text', '--color-accent-soft-survol'],
  ['--color-info', '--color-info-bg'],
  ['--color-text', '--color-surface-muted'],
  ['--color-text-muted', '--color-surface-muted'],
  ['--color-text', '--color-avertissement-bg'],
  ['--color-text', '--color-erreur-bg'],
  // Panneau de l'exemple de rapport (accueil).
  ['--color-text', '--color-panneau-exemple'],
  ['--color-text-muted', '--color-panneau-exemple'],
  ['--color-accent-text', '--color-panneau-exemple'],
];

/** Éléments graphiques et bordures de champs : 3:1 minimum (WCAG 1.4.11). */
const PAIRES_NON_TEXTUELLES: [string, string][] = [
  ['--color-border-champ', '--color-surface'],
  ['--color-border-champ', '--color-bg'],
  ['--color-accent', '--color-surface-muted'],
  // Anneau de focus visible sur le fond papier et sur les cartes blanches.
  ['--color-focus', '--color-bg'],
  ['--color-focus', '--color-surface'],
  // Contour des zones surlignées, sur la miniature blanche d'une page.
  ['--color-surligne-bord', '--color-surface'],
];

describe('accent de la marque (IDENTITE.md)', () => {
  it('bleu encre #1E4A9A pour les boutons, les liens et le focus', () => {
    expect(couleur('--color-accent').toLowerCase()).toBe('#1e4a9a');
    expect(couleur('--color-accent-text').toLowerCase()).toBe('#1e4a9a');
    expect(couleur('--color-focus').toLowerCase()).toBe('#1e4a9a');
  });

  it('le survol est plus sombre que l’état normal', () => {
    expect(luminance(couleur('--color-accent-survol'))).toBeLessThan(luminance(couleur('--color-accent')));
    expect(luminance(couleur('--color-accent-soft-survol'))).toBeLessThan(luminance(couleur('--color-accent-soft')));
  });

  it('encre et papier d’IDENTITE.md, surligneur jaune', () => {
    expect(couleur('--color-text').toLowerCase()).toBe('#37352f');
    expect(couleur('--color-bg').toLowerCase()).toBe('#fbfaf7');
    expect(couleur('--color-panneau-exemple').toLowerCase()).toBe('#f2f5fb');
    expect(couleur('--color-surligne').toLowerCase()).toBe('#fff1a8');
  });

  it('thème clair seulement en V1', () => {
    expect(css).toMatch(/color-scheme:\s*only light;/);
  });
});

describe('contraste AA des couleurs de texte (4,5:1 minimum)', () => {
  it.each(PAIRES)('%s sur %s', (texte, fond) => {
    expect(contraste(couleur(texte), couleur(fond))).toBeGreaterThanOrEqual(4.5);
  });
});

describe('contraste des éléments non textuels (3:1 minimum)', () => {
  it.each(PAIRES_NON_TEXTUELLES)('%s sur %s', (element, fond) => {
    expect(contraste(couleur(element), couleur(fond))).toBeGreaterThanOrEqual(3);
  });
});
