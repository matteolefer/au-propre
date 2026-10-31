/**
 * Typographie française exigée par CLAUDE.md : apostrophe ’, guillemets « »,
 * espace insécable avant « : ; ! ? » et dans « 23 h 59 ». Module sans
 * dépendance : partagé par Vitest et Playwright.
 */

const REGLES: readonly { motif: RegExp; message: string }[] = [
  { motif: /'/, message: 'apostrophe droite au lieu de ’' },
  { motif: /"/, message: 'guillemet droit au lieu de « »' },
  { motif: / [:;!?](?=\s|$)/, message: 'espace ordinaire avant « : ; ! ? » au lieu d’une espace insécable' },
  { motif: /[\p{L}\d»)][:;!?](?=\s|$)/u, message: 'pas d’espace avant « : ; ! ? »' },
  { motif: /\d h( | )\d|\d( | )h \d/, message: 'espace ordinaire dans une heure (23 h 59)' },
];

/** Défauts typographiques d'un texte, avec un extrait pour les retrouver. */
export function erreursTypographiques(texte: string): string[] {
  const erreurs: string[] = [];
  for (const { motif, message } of REGLES) {
    const trouve = new RegExp(motif.source, motif.flags.includes('g') ? motif.flags : `${motif.flags}g`);
    for (const resultat of texte.matchAll(trouve)) {
      const debut = Math.max(0, (resultat.index ?? 0) - 30);
      erreurs.push(`${message} : « ${texte.slice(debut, (resultat.index ?? 0) + 10).replace(/\s+/g, ' ')} »`);
    }
  }
  return erreurs;
}
