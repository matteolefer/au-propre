/**
 * Identité du site, en un seul endroit : nom, adresse, éditeur, hébergeur,
 * contact, statistiques, inscription par e-mail, pages publiques. Aucun nom de
 * personne : l'éditeur garde l'anonymat (mentions légales).
 */

/** Valeur d'un champ que l'éditeur doit encore fournir. */
export const A_COMPLETER = 'à compléter';

const POLITIQUE_CLOUDFLARE = 'https://www.cloudflare.com/policies/privacy/';

export const SITE = {
  nom: 'Au propre',
  sousTitre: 'Vérifiez votre dossier RAEP avant le dépôt',
  /** Adresse du site, sans barre finale. www redirige vers elle. */
  url: 'https://au-propre.fr',
  /** Vrai : le domaine est réservé et en service. Faux, il figurerait parmi les champs à compléter. */
  domaineDefinitif: true as boolean,
  /**
   * Logo horizontal sur fond clair (IDENTITE.md). V1 en thème clair : logo-sombre.svg
   * attend le thème sombre. Null : le nom s'affiche en texte.
   */
  logo: { chemin: '/brand/logo-clair.svg', largeur: 285, hauteur: 68 } as { chemin: string; largeur: number; hauteur: number } | null,
  editeur: {
    statut: 'Particulier, à titre non professionnel',
    /**
     * L'éditeur garde l'anonymat : son identité est connue de l'hébergeur et
     * n'est publiée nulle part. Texte vérifié sur Légifrance le 1er novembre 2026
     * (article créé par la loi n° 2024-449 du 21 mai 2024, art. 48).
     */
    anonymat: {
      libelle: 'article 1-1, II de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique (LCEN)',
      url: 'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000801164',
    },
  },
  /** Adresse e-mail de contact, relayée par le routage d'e-mails de Cloudflare. */
  contact: 'contact@au-propre.fr',
  /** Traitement des e-mails reçus sur l'adresse de contact (politique de confidentialité). */
  messagerie: {
    boite: 'Gmail',
    boiteSociete: 'Google',
    boitePolitiqueUrl: 'https://policies.google.com/privacy?hl=fr',
    conservation: 'Le temps de vous répondre, puis 12 mois au plus après le dernier échange.',
  },
  /**
   * Mesure d'audience sans cookie, sur toutes les pages sauf le vérificateur.
   * `jeton` : jeton public de la balise (Web Analytics › Manage site › JS Snippet),
   * visible dans le HTML. Vide : aucune balise n'est ajoutée.
   */
  statistiques: {
    service: 'Cloudflare Web Analytics',
    jeton: '42a7dd94deb04527989900a0eb42748f',
    script: 'https://static.cloudflareinsights.com/beacon.min.js',
    /** Page de Cloudflare qui décrit la mesure sans cookie ni stockage dans le navigateur. */
    sourceUrl: 'https://www.cloudflare.com/web-analytics/',
  },
  inscription: {
    /**
     * Adresse du formulaire Brevo, ouverte telle quelle dans un nouvel onglet.
     * Vide : l'encart d'inscription et la section correspondante de la
     * politique de confidentialité ne s'affichent pas.
     */
    formulaireUrl:
      'https://c2547e2f.sibforms.com/serve/MUIFAG7uOMqnIlNWeWHh5-mtsRkyGbkQHjYNcosuFD7D_VUu_-KWHS5OCBbyVjVJvHoc9LD4uX-JEWbClW39zMN0RnRsUnzQ_qOliJz5eGNZR9HJGMRRYAOStVaiJLUwT7rFQXzVcMtwQdR_xaHPNygcxM_B3fwYvGrqe4PyACNa7t7WhYxQsDYBvo3n_7ZPuWQfTzB7_1NfkTDx8g==',
    service: 'Brevo',
    politiqueUrl: 'https://www.brevo.com/fr/legal/privacypolicy/',
    /**
     * Durée de conservation des adresses : jusqu'à la désinscription, et au plus
     * 3 ans après le dernier contact émanant de la personne (référentiel relu le
     * 11 novembre 2026, partie sur les durées de conservation).
     */
    conservationSource: {
      libelle: 'référentiel de la CNIL sur la gestion des activités commerciales',
      url: 'https://www.cnil.fr/sites/cnil/files/atoms/files/referentiel_traitements-donnees-caractere-personnel_gestion-activites-commerciales.pdf',
    },
  },
  /**
   * Raison sociale, adresse et téléphone repris de la politique de
   * confidentialité de Cloudflare (version du 4 novembre 2025, relue le
   * 1er novembre 2026).
   */
  hebergeur: {
    nom: 'Cloudflare, Inc.',
    adresse: '101 Townsend St., San Francisco, CA 94107, États-Unis',
    telephone: '+1 (650) 319-8930',
    url: 'https://www.cloudflare.com',
    politiqueUrl: POLITIQUE_CLOUDFLARE,
    source: {
      libelle: 'politique de confidentialité de Cloudflare, en vigueur depuis le 4 novembre 2025',
      url: POLITIQUE_CLOUDFLARE,
    },
  },
} as const;

export interface PageDuSite {
  chemin: string;
  titre: string;
  description: string;
  /** Faux : page en `noindex`, absente du sitemap. Vrai par défaut. */
  indexer?: false;
}

/** Pages publiques, dans l'ordre du sitemap (pages indexées seulement). La page 404 n'y figure pas. */
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
    indexer: false,
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

/**
 * Contenu de robots.txt : tout le site, et l'adresse du plan du site. Les mentions
 * légales ne sont pas bloquées : un robot doit pouvoir y lire le `noindex`. Les tests
 * de production vérifient que Cloudflare sert ce texte tel quel.
 */
export function texteRobots(): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${urlAbsolue('/sitemap.xml')}\n`;
}

/** Faux pour une page en `noindex` (mentions légales) : ni adresse canonique, ni sitemap. */
export function estIndexee(page: PageDuSite): boolean {
  return page.indexer !== false;
}

/** Vrai si l'adresse du formulaire d'inscription est renseignée (en https). */
export function inscriptionActive(url: string = SITE.inscription.formulaireUrl): boolean {
  return /^https:\/\/\S+$/.test(url);
}

/** Vrai si le jeton de la balise de statistiques est renseigné. */
export function statistiquesActives(jeton: string = SITE.statistiques.jeton): boolean {
  return /^[0-9a-f]{32}$/.test(jeton);
}

/** Champs encore à fournir : la liste doit être vide pour la mise en ligne. */
export function champsACompleter(): string[] {
  const champs: Record<string, string> = {
    domaine: SITE.domaineDefinitif ? SITE.url : A_COMPLETER,
    'éditeur (statut)': SITE.editeur.statut,
    contact: SITE.contact,
  };
  return Object.entries(champs)
    .filter(([, valeur]) => valeur === A_COMPLETER)
    .map(([nom]) => nom);
}
