/**
 * Identité du site, en un seul endroit : nom, adresse, éditeur, hébergeur,
 * inscription par e-mail, pages publiques. Les champs « à compléter » bloquent
 * la mise en ligne (liste dans docs/AVANCEMENT.md).
 */

/** Valeur d'un champ que l'éditeur doit encore fournir. */
export const A_COMPLETER = 'à compléter';

export const SITE = {
  nom: 'Au propre',
  sousTitre: 'Vérifiez votre dossier RAEP avant le dépôt',
  /**
   * Adresse provisoire, à compléter : le domaine définitif n'est pas encore
   * réservé. Les adresses absolues (canonique, partage, sitemap) en ont besoin
   * d'une valide. Sans barre finale.
   */
  url: 'https://au-propre.pages.dev',
  /** Faux tant que `url` est provisoire : le domaine figure alors parmi les champs à compléter. */
  domaineDefinitif: false as boolean,
  /**
   * Logo horizontal sur fond clair (IDENTITE.md). V1 en thème clair : logo-sombre.svg
   * attend le thème sombre. Null : le nom s'affiche en texte.
   */
  logo: { chemin: '/brand/logo-clair.svg', largeur: 285, hauteur: 68 } as { chemin: string; largeur: number; hauteur: number } | null,
  editeur: {
    nom: A_COMPLETER,
    /** Particulier, entreprise individuelle (avec SIRET)… */
    statut: A_COMPLETER,
  },
  /** Adresse e-mail de contact. */
  contact: A_COMPLETER,
  directeurPublication: A_COMPLETER,
  inscription: {
    /**
     * Adresse du formulaire Brevo, ouverte telle quelle dans un nouvel onglet.
     * Vide : l'encart d'inscription et la section correspondante de la
     * politique de confidentialité ne s'affichent pas.
     */
    formulaireUrl: '',
    service: 'Brevo',
    politiqueUrl: 'https://www.brevo.com/fr/legal/privacypolicy/',
  },
  hebergeur: {
    nom: 'Cloudflare, Inc.',
    adresse: '101 Townsend St., San Francisco, CA 94107, États-Unis',
    telephone: '+1 650 319 8930',
    url: 'https://www.cloudflare.com',
    politiqueUrl: 'https://www.cloudflare.com/privacypolicy/',
  },
} as const;

export interface PageDuSite {
  chemin: string;
  titre: string;
  description: string;
}

/** Pages publiques, dans l'ordre du sitemap. La page 404 n'y figure pas. */
export const PAGES_DU_SITE = {
  accueil: {
    chemin: '/',
    titre: `${SITE.nom} – ${SITE.sousTitre}`,
    description:
      'Vérifiez que votre dossier RAEP respecte les règles officielles avant le dépôt du 3\u00A0décembre 2026. CAPES, CAPLP, CAPET, CAER et CPE internes.',
  },
  verifier: {
    chemin: '/verifier/',
    titre: 'Vérifier mon dossier RAEP',
    description:
      'Pages, police, marges, interligne\u00A0: vérifiez votre dossier RAEP d’après les règles officielles. Le fichier reste sur votre ordinateur.',
  },
  regles: {
    chemin: '/regles/',
    titre: 'Les règles officielles du dossier RAEP, session 2027',
    description:
      'Pages, Arial 11, interligne, marges, annexes, couverture, nom du fichier\u00A0: les règles du dossier RAEP 2027 expliquées, avec leurs sources.',
  },
  confidentialite: {
    chemin: '/confidentialite/',
    titre: 'Confidentialité',
    description: 'Votre dossier est analysé dans votre navigateur et n’est jamais envoyé. Ce que le site traite, où, et ce qu’il ne collecte jamais.',
  },
  mentionsLegales: {
    chemin: '/mentions-legales/',
    titre: 'Mentions légales',
    description: `Éditeur, hébergement et conditions d’utilisation de ${SITE.nom}, outil indépendant de vérification du dossier RAEP.`,
  },
} as const satisfies Record<string, PageDuSite>;

/** Titre affiché dans l'onglet : « Titre – Au propre », sauf pour l'accueil qui commence par le nom. */
export function titreDOnglet(titre: string): string {
  return titre.startsWith(SITE.nom) ? titre : `${titre} – ${SITE.nom}`;
}

/** Adresse absolue d'un chemin du site. */
export function urlAbsolue(chemin: string): string {
  return new URL(chemin, `${SITE.url}/`).href;
}

/** Vrai si l'adresse du formulaire d'inscription est renseignée (en https). */
export function inscriptionActive(url: string = SITE.inscription.formulaireUrl): boolean {
  return /^https:\/\/\S+$/.test(url);
}

/** Champs à fournir avant la mise en ligne. */
export function champsACompleter(): string[] {
  const champs = {
    domaine: SITE.domaineDefinitif ? SITE.url : A_COMPLETER,
    'éditeur (nom)': SITE.editeur.nom,
    'éditeur (statut)': SITE.editeur.statut,
    contact: SITE.contact,
    'directeur de la publication': SITE.directeurPublication,
  };
  return Object.entries(champs)
    .filter(([, valeur]) => valeur === A_COMPLETER)
    .map(([nom]) => nom);
}
