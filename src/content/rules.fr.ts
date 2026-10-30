/**
 * Tous les textes des règles : libellés, titres, détails, corrections, sources.
 * Typographie : apostrophe ’, guillemets « », espace insécable avant « : »,
 * espace fine insécable avant « ; ! ? ».
 */
import type { Plage, Source } from '../checker/types';

/** Espace insécable (avant « : », dans « 23 h 59 », entre nombre et unité). */
const ESP = '\u00A0';
/** Espace fine insécable (avant « ; ! ? »). */
const FINE = '\u202F';

/** Sources officielles, reprises de docs/SPEC.md §10. */
export const SOURCES = {
  S1: {
    libelle: 'Les épreuves du CAPES interne, section lettres',
    url: 'https://www.devenirenseignant.gouv.fr/les-epreuves-du-capes-interne-section-lettres-565',
  },
  S2: {
    libelle: 'Conseils pour l’épreuve de RAEP de certains concours internes',
    url: 'https://www.devenirenseignant.gouv.fr/conseils-pour-l-epreuve-de-reconnaissance-des-acquis-de-l-experience-professionnelle-raep-de-1124',
  },
  S3: {
    libelle: 'Calendrier des concours du second degré, session 2027',
    url: 'https://www.devenirenseignant.gouv.fr/le-calendrier-des-concours-de-recrutement-d-enseignants-du-second-degre-de-la-session-2027-1562',
  },
  S4: {
    libelle: `Note de service, BO n°${ESP}36 de 2026`,
    url: 'https://www.education.gouv.fr/bo/2026/Hebdo36/MENH2622420N',
  },
  S5: {
    libelle: 'Rapport de jury CAPES interne histoire-géographie 2026',
    url: 'https://www.devenirenseignant.gouv.fr/media/20558/download',
  },
  S6: {
    libelle: 'Rapport de jury CAPES interne mathématiques 2026',
    url: 'https://www.devenirenseignant.gouv.fr/media/20992/download',
  },
  S7: {
    libelle: 'Rapport de jury CAPES interne arts plastiques 2026',
    url: 'https://www.devenirenseignant.gouv.fr/media/20876/download',
  },
  S8: {
    libelle: 'Rapport de jury CAPES interne lettres 2026',
    url: 'https://www.devenirenseignant.gouv.fr/media/21286/download',
  },
  S9: {
    libelle: 'Rapport de jury CAPES interne SES 2025',
    url: 'https://ses.ens-lyon.fr/fichiers/enseigner/rapport-de-jury-capes-interne-2025.pdf',
  },
} as const satisfies Record<string, Source>;

// --- Outils de formulation ---------------------------------------------------

const nombre = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

export function cm(valeur: number): string {
  return `${nombre.format(valeur)}${ESP}cm`;
}

export function nPages(n: number): string {
  return `${n}${ESP}page${n > 1 ? 's' : ''}`;
}

/** « page 3 » ou « pages 2 à 4 ». */
export function plageEnTexte(plage: Plage): string {
  return plage.debut === plage.fin ? `page${ESP}${plage.debut}` : `pages ${plage.debut} à ${plage.fin}`;
}

/** « page 3 » ou « pages 3, 5 et 9 ». */
export function listePages(pages: readonly number[]): string {
  if (pages.length === 1) return `page${ESP}${pages[0]}`;
  return `pages ${pages.slice(0, -1).join(', ')} et ${pages[pages.length - 1]}`;
}

function pagesVides(vides: readonly number[]): string {
  if (vides.length === 0) return '';
  return vides.length === 1
    ? ` La ${listePages(vides)} est vide${ESP}: si l’export l’a ajoutée, supprimez-la.`
    : ` Les ${listePages(vides)} sont vides${ESP}: si l’export les a ajoutées, supprimez-les.`;
}

// --- Textes des règles -------------------------------------------------------

export const R00 = {
  libelle: 'PDF lisible',
  bloquant: {
    titre: `Analyse impossible${ESP}: le PDF ne contient aucun texte`,
    detail: (totalPages: number, pagesImages: number) =>
      `Aucune des ${nPages(totalPages)} ne contient de texte sélectionnable` +
      (pagesImages > 0 ? ` (${pagesImages} sur ${totalPages} ne contiennent qu’une image)` : '') +
      `. C’est le cas d’un document scanné ou imprimé en image${FINE}: l’outil ne peut donc mesurer ni la police, ni les marges, ni l’interligne.`,
    correction:
      `Exportez le dossier en PDF depuis votre traitement de texte (Word${ESP}: Fichier > Enregistrer sous > PDF${FINE}; ` +
      `LibreOffice${ESP}: Fichier > Exporter au format PDF), puis vérifiez ce nouveau fichier.`,
  },
  conforme: {
    titre: 'Le PDF contient du texte analysable',
    detail: (pagesAvecTexte: number, totalPages: number) =>
      `Du texte a été trouvé sur ${pagesAvecTexte} des ${nPages(totalPages)}.`,
  },
};

export const R02 = {
  libelle: `Partie 1${ESP}: 2 pages maximum`,
  erreur: {
    titre: 'La partie 1 dépasse 2 pages',
    detail: (plage: Plage, n: number, vides: readonly number[]) =>
      `La partie 1 occupe ${nPages(n)} (${plageEnTexte(plage)}). Le maximum est de 2 pages.${pagesVides(vides)}`,
    correction:
      'Ramenez la partie 1 à 2 pages en resserrant le propos, sans réduire la police, la taille ni les marges, qui sont elles aussi contrôlées.',
  },
  conforme: {
    titre: 'La partie 1 tient en 2 pages maximum',
    detail: (plage: Plage, n: number) => `La partie 1 occupe ${nPages(n)} (${plageEnTexte(plage)}).`,
  },
  sources: [SOURCES.S1, SOURCES.S2],
};

export const R03 = {
  libelle: `Partie 2${ESP}: 6 pages maximum`,
  erreur: {
    titre: 'La partie 2 dépasse 6 pages',
    detail: (plage: Plage, n: number, vides: readonly number[]) =>
      `La partie 2 occupe ${nPages(n)} (${plageEnTexte(plage)}). Le maximum est de 6 pages.${pagesVides(vides)}`,
    correction:
      'Ramenez la partie 2 à 6 pages en resserrant l’analyse, sans réduire la police, la taille ni les marges, qui sont elles aussi contrôlées.',
  },
  conforme: {
    titre: 'La partie 2 tient en 6 pages maximum',
    detail: (plage: Plage, n: number) => `La partie 2 occupe ${nPages(n)} (${plageEnTexte(plage)}).`,
  },
  sources: [SOURCES.S1, SOURCES.S2],
};

export const R04 = {
  libelle: `Annexes${ESP}: 10 pages maximum`,
  erreur: {
    titre: 'Les annexes dépassent 10 pages',
    detail: (plage: Plage, n: number, vides: readonly number[]) =>
      `Les annexes occupent ${nPages(n)} (${plageEnTexte(plage)}). Le maximum est de 10 pages pour l’ensemble des annexes.${pagesVides(vides)}`,
    correction:
      'Ne gardez qu’un ou deux exemples de documents ou de travaux liés à la situation décrite, dans la limite de 10 pages au total.',
  },
  conforme: {
    titre: 'Les annexes tiennent en 10 pages maximum',
    detail: (plage: Plage, n: number) => `Les annexes occupent ${nPages(n)} (${plageEnTexte(plage)}).`,
  },
  absentes: {
    titre: 'Aucune annexe',
    detail: 'Le découpage ne comporte pas d’annexes. Elles sont facultatives.',
  },
  sources: [SOURCES.S1, SOURCES.S2],
};

/** Taille mesurée d’un groupe de pages, en centimètres. */
export interface FormatMesure {
  largeurCm: number;
  hauteurCm: number;
  pages: number[];
}

function formatsEnTexte(formats: readonly FormatMesure[]): string {
  return formats
    .map((f) => `${listePages(f.pages)}${ESP}: ${nombre.format(f.largeurCm)} × ${cm(f.hauteurCm)}`)
    .join(`${FINE}; `);
}

const FORMAT_ATTENDU = `Le format attendu est 21 × 29,7${ESP}cm (A4), en portrait ou en paysage.`;

export const R11 = {
  libelle: 'Format A4',
  erreur: {
    titre: 'Des pages des parties 1 ou 2 ne sont pas au format A4',
    detail: (formats: readonly FormatMesure[]) => `${formatsEnTexte(formats)}. ${FORMAT_ATTENDU}`,
    correction:
      'Dans votre traitement de texte, choisissez le format de papier A4 (Mise en page > Taille > A4), puis exportez de nouveau en PDF en vérifiant le format dans la fenêtre d’export.',
  },
  avertissement: {
    titre: 'La couverture ou des annexes ne sont pas au format A4',
    detail: (formats: readonly FormatMesure[]) => `${formatsEnTexte(formats)}. ${FORMAT_ATTENDU}`,
    correction:
      'Si une annexe est un document scanné dans un autre format, ramenez-la au format A4 avant de l’insérer, par exemple en l’imprimant en PDF sur du papier A4.',
  },
  conforme: {
    titre: 'Toutes les pages sont au format A4',
    detail: (n: number) =>
      `Les ${nPages(n)} mesurent 21 × 29,7${ESP}cm, avec une tolérance de 2${ESP}points (moins d’un millimètre).`,
  },
  sources: [SOURCES.S1, SOURCES.S2],
};
