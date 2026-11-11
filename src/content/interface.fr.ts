/**
 * Textes de l'interface du vérificateur : étapes, boutons, états, messages.
 * Typographie : apostrophe ’, guillemets « », espace insécable avant « : »,
 * espace fine insécable avant « ; ! ? ».
 */
import { OCTETS_PAR_MO, TAILLE_FICHIER_MAX_OCTETS } from '../checker/measure';
import type { RaisonEchec } from '../checker/protocole';
import type { CleGroupe } from '../checker/report';
import type { ErreurDecoupage, Section } from '../checker/split';
import type { Gravite, Plage } from '../checker/types';
import { nPages, plageEnTexte } from './rules.fr';
import { rappelEnvoye, SESSION } from './session';

const ESP = ' ';
const FINE = ' ';

const unChiffre = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

/** « 84 ko », « 1,2 Mo ». */
export function poidsFichier(octets: number): string {
  if (octets < OCTETS_PAR_MO) return `${Math.max(1, Math.round(octets / 1024))}${ESP}ko`;
  return `${unChiffre.format(octets / OCTETS_PAR_MO)}${ESP}Mo`;
}

/** « 30 octobre 2026 à 14 h 05 ». */
export function dateEtHeure(date: Date): string {
  const jour = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  const heures = String(date.getHours());
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${jour} à ${heures}${ESP}h${ESP}${minutes}`;
}

const EXPORT_PDF = `Word${ESP}: Fichier > Enregistrer sous > PDF${FINE}; LibreOffice${ESP}: Fichier > Exporter au format PDF`;

export const ETAPES = {
  libelle: 'Étapes de la vérification',
  noms: ['Votre dossier', 'Découpage', 'Rapport'],
  etat: (numero: number, total: number) => `Étape ${numero} sur ${total}`,
} as const;

export const PARAMETRES = {
  titre: 'Votre dossier',
  concours: { libelle: 'Concours', choisir: 'Choisissez votre concours', manquant: 'Choisissez votre concours.' },
  discipline: {
    libelle: 'Discipline choisie à l’inscription',
    choisir: 'Choisissez votre discipline',
    manquant: 'Choisissez votre discipline.',
    aide: 'Elle sert à certains contrôles, par exemple l’HGGSP en histoire-géographie.',
    source: 'Liste officielle des sections ouvertes en 2027',
  },
  fichier: {
    libelle: 'Votre dossier en PDF',
    glisser: 'Glissez votre PDF ici',
    ou: 'ou',
    choisir: 'Choisir un fichier PDF',
    changer: 'Choisir un autre fichier',
    manquant: 'Choisissez le PDF de votre dossier.',
    confidentialite: 'Votre fichier est analysé dans votre navigateur et n’est envoyé nulle part.',
  },
  lourd:
    `Votre fichier est lourd. Aucune limite officielle n’est publiée pour le RAEP, mais vérifiez que Cyclades l’accepte bien avant la date limite${FINE}; ` +
    'compresser les images des annexes réduit la taille.',
  bouton: 'Lire mon dossier',
} as const;

export interface TexteEchec {
  titre: string;
  detail: string;
  correction: string;
}

const LIMITE_OUTIL = poidsFichier(TAILLE_FICHIER_MAX_OCTETS);

/** Échecs au choix du fichier ou à la lecture. */
export const ECHECS = {
  pasPdf: (nom: string): TexteEchec => ({
    titre: 'Ce fichier n’est pas un PDF',
    detail: `«${ESP}${nom}${ESP}» n’est pas un fichier PDF.`,
    correction: 'Choisissez le fichier PDF de votre dossier, celui que vous déposerez dans Cyclades.',
  }),
  traitementDeTexte: (nom: string): TexteEchec => ({
    titre: 'Ce fichier n’est pas encore un PDF',
    detail: `«${ESP}${nom}${ESP}» est un document de traitement de texte. Le dossier se dépose en PDF.`,
    correction: `Exportez-le en PDF (${EXPORT_PDF}), puis choisissez le fichier PDF obtenu.`,
  }),
  tropLourd: (octets: number): TexteEchec => ({
    titre: 'Le fichier est trop lourd pour l’outil',
    detail:
      `Le fichier fait ${poidsFichier(octets)}. L’outil analyse les fichiers jusqu’à ${LIMITE_OUTIL}${ESP}: ` +
      'c’est une limite de l’outil, pour ne pas bloquer votre ordinateur, pas une règle officielle.',
    correction:
      'Réduisez le poids du PDF en compressant les images des annexes avant l’export (LibreOffice propose de réduire la résolution des images dans la fenêtre d’export PDF), puis choisissez le nouveau fichier.',
  }),
  plusieurs: (): TexteEchec => ({
    titre: 'Déposez un seul fichier',
    detail: 'Plusieurs fichiers ont été déposés. Le dossier se dépose en un seul PDF, annexes comprises.',
    correction: 'Choisissez le PDF unique de votre dossier.',
  }),
  lecture: {
    'pdf-invalide': {
      titre: 'Le fichier n’a pas pu être lu comme un PDF',
      detail: 'Le fichier est endommagé, ou ce n’est pas un vrai PDF (un document renommé en .pdf, par exemple).',
      correction: `Exportez de nouveau le dossier en PDF depuis votre traitement de texte (${EXPORT_PDF}), puis choisissez ce nouveau fichier.`,
    },
    'mot-de-passe': {
      titre: 'Le PDF est protégé par un mot de passe',
      detail: `Ce PDF demande un mot de passe à l’ouverture${ESP}: l’outil ne peut pas le lire.`,
      correction:
        `Exportez de nouveau le dossier en PDF sans mot de passe (Word sous Windows${ESP}: Fichier > Enregistrer sous > PDF > Options, ` +
        `décochez «${ESP}Chiffrer le document avec un mot de passe${ESP}»${FINE}; LibreOffice${ESP}: Fichier > Exporter au format PDF, onglet Sécurité, sans mot de passe), ` +
        'puis choisissez ce nouveau fichier. Déposez aussi cette version dans Cyclades, pour que le jury puisse l’ouvrir.',
    },
    inconnue: {
      titre: 'La lecture du PDF a échoué',
      detail: 'Une erreur inattendue s’est produite pendant la lecture du fichier dans votre navigateur.',
      correction:
        'Rechargez la page et choisissez de nouveau le fichier. Si l’erreur se reproduit, exportez de nouveau le PDF depuis votre traitement de texte, ou essayez un autre navigateur.',
    },
  } satisfies Record<RaisonEchec, TexteEchec>,
  correction: 'Comment corriger',
} as const;

export const LECTURE = {
  titre: 'Lecture du dossier',
  ouverture: 'Ouverture du fichier…',
  etat: (etape: 'lecture' | 'miniatures', page: number, total: number) =>
    etape === 'lecture' ? `Lecture de la page ${page} sur ${total}` : `Préparation des aperçus${ESP}: page ${page} sur ${total}`,
  note: 'La lecture se fait dans votre navigateur, sans envoi du fichier.',
  annuler: 'Annuler',
} as const;

export const IMPOSSIBLE = {
  autreFichier: 'Choisir un autre fichier',
} as const;

export const NOMS_SECTIONS: Record<Section, string> = {
  couverture: 'Couverture',
  partie1: 'Partie 1',
  partie2: 'Partie 2',
  annexes: 'Annexes',
};

export const DECOUPAGE = {
  titre: 'Vérifiez le découpage',
  intro:
    'L’outil a repéré les parties d’après leurs titres. Vérifiez la page où commence chacune, corrigez-la si besoin, puis lancez la vérification. Rien n’est vérifié avant votre confirmation.',
  supposes:
    `Certains titres n’ont pas été trouvés${ESP}: les pages marquées «${ESP}à vérifier${ESP}» suivent la structure habituelle d’un dossier (couverture, 2${ESP}pages, 6${ESP}pages, puis les annexes). Corrigez-les si besoin.`,
  champs: {
    partie1: 'La partie 1 commence page',
    partie2: 'La partie 2 commence page',
    annexes: 'Les annexes commencent page',
  },
  sansAnnexes: 'Pas d’annexes',
  origine: {
    detecte: 'Trouvée d’après le titre',
    suppose: `À vérifier${ESP}: titre non trouvé`,
  },
  page: (numero: number) => `Page ${numero}`,
  resumeTitre: 'Découpage retenu',
  resume: (section: Section, plage: Plage) => {
    const n = plage.fin - plage.debut + 1;
    return `${NOMS_SECTIONS[section]}${ESP}: ${plageEnTexte(plage)}${section === 'couverture' ? '' : ` (${nPages(n)})`}`;
  },
  aucuneCouverture: `Couverture${ESP}: aucune (la partie 1 commence page 1)`,
  aucuneAnnexe: `Annexes${ESP}: aucune`,
  erreurs: {
    'hors-document': (total: number) => `Choisissez une page entre 1 et ${total}.`,
    'partie2-avant-partie1': () => 'La partie 2 doit commencer après la partie 1.',
    'annexes-avant-partie2': () => 'Les annexes doivent commencer après la partie 2.',
  } satisfies Record<ErreurDecoupage['code'], (total: number) => string>,
  apercus: 'Aperçu des pages',
  apercusAide: 'Les pages sont rangées selon le découpage choisi.',
  sansTexte: 'Page sans texte',
  confirmer: 'Confirmer le découpage et vérifier',
  autreFichier: 'Choisir un autre fichier',
} as const;

export const NOMS_GRAVITES: Record<Exclude<Gravite, 'bloquant'>, string> = {
  erreur: 'À corriger',
  avertissement: 'À vérifier',
  conforme: 'Conforme',
  info: 'Information',
};

export const RAPPORT = {
  titre: 'Rapport de vérification',
  meta: {
    fichier: 'Fichier',
    pages: (n: number) => nPages(n),
    concours: 'Concours',
    discipline: 'Discipline',
    date: 'Vérifié le',
  },
  confidentialite: 'Votre fichier n’a pas quitté votre ordinateur.',
  resume: {
    titre: 'Résumé',
    /** Libellé qui suit le nombre : « 2 points à corriger ». */
    compteurs: {
      aCorriger: (n: number) => (n > 1 ? 'points à corriger' : 'point à corriger'),
      aVerifier: (n: number) => (n > 1 ? 'points à vérifier' : 'point à vérifier'),
      conforme: (n: number) => (n > 1 ? 'contrôles conformes' : 'contrôle conforme'),
    },
    sansErreur: `Les contrôles automatiques n’ont trouvé aucun point à corriger. Vérifiez aussi les points signalés «${ESP}à vérifier${ESP}» et la checklist avant de déposer.`,
    avecErreurs: (n: number) =>
      `${n > 1 ? `${n}${ESP}points ne respectent pas` : `1${ESP}point ne respecte pas`} une règle officielle. Corrigez-${n > 1 ? 'les' : 'le'}, exportez de nouveau le PDF et vérifiez le nouveau fichier.`,
    portee: 'Ce rapport porte sur la présentation du dossier, pas sur son contenu ni sur sa note.',
  },
  groupes: {
    aCorriger: {
      titre: 'À corriger',
      intro: 'Ces points ne respectent pas une règle officielle de présentation.',
      vide: 'Aucun point à corriger.',
    },
    aVerifier: {
      titre: 'À vérifier',
      intro: `La mesure est approximative ou la règle laisse une marge${ESP}: vérifiez ces points dans votre document.`,
      vide: 'Aucun point à vérifier.',
    },
    conforme: { titre: 'Conforme', intro: '', vide: 'Aucun contrôle conforme.' },
    informations: { titre: 'Informations', intro: 'Ce que l’outil a relevé sans pouvoir conclure.', vide: '' },
  } satisfies Record<CleGroupe, { titre: string; intro: string; vide: string }>,
  controle: {
    regle: 'Règle',
    mesure: 'Ce qui a été mesuré',
    pages: 'Pages concernées',
    correction: 'Comment corriger',
    source: 'Source',
    sources: 'Sources',
    nouvelOnglet: '(nouvel onglet)',
    apercu: 'Aperçu',
    apercuImage: (page: number) => `Aperçu de la page ${page}`,
    apercuLegende: (page: number) => `Page ${page}${ESP}: zone en faute surlignée.`,
  },
  checklist: {
    titre: 'À vérifier vous-même',
    intro: `L’outil ne peut pas contrôler ces points. Cochez-les au fur et à mesure${FINE}; rien n’est enregistré.`,
    compteur: (coches: number, total: number) =>
      `${coches} point${coches > 1 ? 's' : ''} coché${coches > 1 ? 's' : ''} sur ${total}`,
  },
  /** Imprimé seulement : l'adresse de chaque source, une seule fois, à la fin du rapport. */
  sourcesCitees: {
    titre: 'Sources citées',
    intro: 'Adresses des textes officiels cités dans ce rapport.',
  },
  actions: {
    imprimer: 'Imprimer le rapport',
    modifier: 'Modifier le découpage',
    autreFichier: 'Vérifier un autre fichier',
  },
} as const;

/** Textes de l'encart d'inscription pour l'une de ses deux périodes. */
export interface TextesInscription {
  titre: string;
  texte: string;
  /** Liste proposée en plus, cochée ou non dans le formulaire. */
  option: string | null;
  bouton: string;
  note: (service: string) => string;
}

/**
 * Inscription facultative par e-mail, affichée si l'adresse du formulaire est renseignée :
 * encart juste après le rapport, version compacte sur la page des règles. Jusqu'à l'envoi
 * du rappel (SESSION.rappel), le formulaire Brevo propose deux listes à cocher : le rappel
 * avant la clôture et les nouveautés. Ensuite, seulement les nouveautés.
 */
export const INSCRIPTION = {
  avantRappel: {
    titre: 'Recevez un rappel avant la clôture',
    texte: `Le dépôt dans Cyclades ferme le ${SESSION.cloture.date} à ${SESSION.cloture.heure}. Nous vous envoyons un e-mail de rappel avant cette date.`,
    option: `En option${ESP}: les nouveautés d’Au propre, dont un guide pour préparer l’oral, envoyé en janvier.`,
    bouton: 'M’inscrire au rappel',
    note: (service: string) =>
      `Le formulaire, hébergé par ${service}, vous laisse cocher le rappel, les nouveautés ou les deux, puis vous demande de confirmer votre adresse. Désinscription en un clic dans chaque e-mail.`,
  },
  apresRappel: {
    titre: 'Recevez les nouveautés d’Au propre',
    texte: 'Dont un guide pour préparer l’oral, envoyé en janvier.',
    option: null,
    bouton: 'M’inscrire',
    note: (service: string) =>
      `Le formulaire, hébergé par ${service}, vous demande de confirmer votre adresse. Désinscription en un clic dans chaque e-mail.`,
  },
  nouvelOnglet: '(nouvel onglet)',
  independance: 'Votre e-mail n’est jamais lié à votre dossier.',
  confidentialite: 'Politique de confidentialité',
} as const;

/** Textes de l'encart à un instant donné : le rappel n'est plus proposé une fois envoyé. */
export function textesInscription(maintenant: Date = new Date()): TextesInscription {
  return rappelEnvoye(maintenant) ? INSCRIPTION.apresRappel : INSCRIPTION.avantRappel;
}
