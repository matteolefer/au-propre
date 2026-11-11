/**
 * Session du concours : année et clôture du dépôt des dossiers RAEP dans
 * Cyclades, d'après le calendrier officiel (S3). À changer pour la session 2028.
 * Utilisé par l'encart de rappel par e-mail.
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
} as const;
