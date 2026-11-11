/**
 * Encart d'inscription facultative : le lien ouvre le formulaire tel quel,
 * dans un nouvel onglet, sans référent, et ne transmet rien du dossier.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Inscription } from '../../src/components/verificateur/Inscription';
import { INSCRIPTION, textesInscription } from '../../src/content/interface.fr';
import { rappelEnvoye, SESSION } from '../../src/content/session';

const ADRESSE = 'https://exemple.invalid/formulaire';
/** Juste avant et juste à l'heure de l'envoi du rappel : 1er décembre 2026, 18 h à Paris (17 h UTC). */
const AVANT_ENVOI = new Date('2026-12-01T16:59:59Z');
const ENVOI = new Date('2026-12-01T17:00:00Z');

function rendu(maintenant: Date): string {
  return renderToStaticMarkup(createElement(Inscription, { url: ADRESSE, maintenant }));
}

describe('encart d’inscription', () => {
  const html = rendu(AVANT_ENVOI);

  it('textes demandés : rappel avant la clôture, nouveautés en option', () => {
    expect(html).toContain('Recevez un rappel avant la clôture');
    expect(html).toContain('les nouveautés d’Au propre, dont un guide pour préparer l’oral, envoyé en janvier.');
    expect(html).toContain('Votre e-mail n’est jamais lié à votre dossier.');
    expect(html).toContain('M’inscrire au rappel');
    expect(html).toContain('Désinscription en un clic dans chaque e-mail.');
  });

  it('date de clôture tirée de la configuration de la session', () => {
    expect(INSCRIPTION.avantRappel.texte).toContain(`le ${SESSION.cloture.date} à ${SESSION.cloture.heure}.`);
    expect(SESSION.cloture.date).toBe('jeudi 3\u00A0décembre 2026');
    expect(SESSION.cloture.heure).toBe('23\u00A0h\u00A059');
    expect(new Date(SESSION.cloture.iso).toISOString()).toBe('2026-12-03T22:59:00.000Z');
    expect(SESSION.source.url).toMatch(/calendrier-des-concours.*session-2027/);
  });

  it('aucune promesse d’un seul e-mail ni de suppression après l’envoi', () => {
    expect(rendu(AVANT_ENVOI) + rendu(ENVOI)).not.toMatch(/un seul e-mail|annonce|suppression|relecture critique/i);
  });

  it('envoi du rappel le 1er décembre 2026 à 18 h, heure de Paris', () => {
    expect(new Date(SESSION.rappel.iso).toISOString()).toBe('2026-12-01T17:00:00.000Z');
    expect(rappelEnvoye(AVANT_ENVOI)).toBe(false);
    expect(rappelEnvoye(ENVOI)).toBe(true);
    expect(textesInscription(AVANT_ENVOI)).toBe(INSCRIPTION.avantRappel);
    expect(textesInscription(ENVOI)).toBe(INSCRIPTION.apresRappel);
  });

  it('après l’envoi du rappel : seulement les nouveautés, bouton « M’inscrire »', () => {
    const apres = rendu(ENVOI);
    expect(apres).toContain('Recevez les nouveautés d’Au propre');
    expect(apres).toContain('Dont un guide pour préparer l’oral, envoyé en janvier.');
    expect(apres).toContain('>M’inscrire<span class="v-visuellement-cache"> (nouvel onglet)</span></a>');
    expect(apres).not.toMatch(/rappel|clôture|En option/i);
    expect(apres).toContain(`href="${ADRESSE}" target="_blank" rel="noopener noreferrer"`);
    expect(apres).toContain('Votre e-mail n’est jamais lié à votre dossier.');
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
