/**
 * Encart d'inscription facultative : le lien ouvre le formulaire tel quel,
 * dans un nouvel onglet, sans référent, et ne transmet rien du dossier.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Inscription } from '../../src/components/verificateur/Inscription';

const ADRESSE = 'https://exemple.invalid/formulaire';

describe('encart d’inscription', () => {
  const html = renderToStaticMarkup(createElement(Inscription, { url: ADRESSE }));

  it('textes demandés', () => {
    expect(html).toContain('Être prévenu quand la relecture critique sera disponible');
    expect(html).toContain('Votre e-mail n’est jamais lié à votre dossier.');
    expect(html).toContain('M’inscrire par e-mail');
  });

  it('lien direct vers le formulaire, sans paramètre ni référent', () => {
    const liens = [...html.matchAll(/<a [^>]*>/g)].map((m) => m[0]);
    const lien = liens.find((balise) => balise.includes(ADRESSE));
    expect(lien).toBe(`<a class="v-bouton v-bouton--secondaire" href="${ADRESSE}" target="_blank" rel="noopener noreferrer">`);
  });

  it('aucun champ ni formulaire sur le site : rien n’est saisi ni envoyé depuis la page', () => {
    expect(html).not.toMatch(/<form|<input|<iframe|<script/);
  });

  it('renvoie à la politique de confidentialité', () => {
    expect(html).toContain('href="/confidentialite/#inscription"');
  });
});
