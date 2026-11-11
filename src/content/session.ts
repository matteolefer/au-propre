/**
 * Session du concours : année et clôture du dépôt des dossiers RAEP dans
 * Cyclades, d'après le calendrier officiel (S3), et envoi du rappel par e-mail.
 * À changer pour la session 2028. Utilisé par l'encart d'inscription.
 */
import { SESSION_ATTENDUE } from '../checker/measure';
import { SOURCES } from './rules.fr';

const ESP = ' ';

export const SESSION = {
  annee: SESSION_ATTENDUE,
  cloture: {
    /** Heure de Paris. */
    iso: '2026-12-03T23:59:00+01:00',
    date: `jeudi 3${ESP}décembre 2026`,
    heure: `23${ESP}h${ESP}59`,
  },
  source: SOURCES.S3,
  /**
   * Envoi de la campagne de rappel par Brevo, heure de Paris. À partir de cette
   * heure, l'encart ne propose plus le rappel, seulement les nouveautés.
   */
  rappel: { iso: '2026-12-01T18:00:00+01:00' },
} as const;

/** Vrai à partir de l'envoi du rappel. Même calcul dans le script de InscriptionCompacte.astro. */
export function rappelEnvoye(maintenant: Date = new Date()): boolean {
  return maintenant.getTime() >= Date.parse(SESSION.rappel.iso);
}
