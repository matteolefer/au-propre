/**
 * Encart d'inscription facultative : le lien ouvre le formulaire tel quel,
 * dans un nouvel onglet, sans référent, et ne transmet rien du dossier.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Inscription } from '../../src/components/verificateur/Inscription';
import { INSCRIPTION } from '../../src/content/interface.fr';
import { SESSION } from '../../src/content/session';

const ADRESSE = 'https://exemple.invalid/formulaire';

describe('encart d’inscription', () => {
  const html = renderToStaticMarkup(createElement(Inscription, { url: ADRESSE }));

  it('textes demandés : rappel avant la clôture, nouveautés en option', () => {
    expect(html).toContain('Recevez un rappel avant la clôture');
    expect(html).toContain('les nouveautés d’Au propre, dont un guide pour préparer l’oral, envoyé en janvier.');
    expect(html).toContain('Votre e-mail n’est jamais lié à votre dossier.');
    expect(html).toContain('M’inscrire au rappel');
    expect(html).toContain('Désinscription en un clic dans chaque e-mail.');
  });

  it('date de clôture tirée de la configuration de la session', () => {
    expect(INSCRIPTION.texte).toContain(`le ${SESSION.cloture.date} à ${SESSION.cloture.heure}.`);
    expect(SESSION.cloture.date).toBe('jeudi 3\u00A0décembre 2026');
    expect(SESSION.cloture.heure).toBe('23\u00A0h\u00A059');
    expect(new Date(SESSION.cloture.iso).toISOString()).toBe('2026-12-03T22:59:00.000Z');
    expect(SESSION.source.url).toMatch(/calendrier-des-concours.*session-2027/);
  });

  it('aucune promesse d’un seul e-mail ni de suppression après l’envoi', () => {
    expect(Object.values(INSCRIPTION).join(' ')).not.toMatch(/un seul e-mail|annonce|suppression|relecture critique/i);
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
