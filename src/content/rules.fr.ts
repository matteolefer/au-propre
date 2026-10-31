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
  S10: {
    libelle: 'Les épreuves du concours interne de recrutement de conseillers principaux d’éducation',
    url: 'https://www.education.gouv.fr/les-epreuves-du-concours-interne-de-recrutement-de-conseillers-principaux-d-education-12956',
  },
  S11: {
    libelle: 'Rapport de jury CPE interne 2026',
    url: 'https://www.education.gouv.fr/sites/default/files/document/rapport-du-jury-du-concours-interne-de-recrutement-de-cpe-de-la-session-2026-518831.pdf',
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

export function pt(valeur: number): string {
  return `${nombre.format(valeur)}${ESP}pt`;
}

/** « page 3 », « pages 3, 5 et 9 », « pages 2 à 9 » ou « pages 2 à 4 et 7 ». */
export function listePages(pages: readonly number[]): string {
  const triees = [...new Set(pages)].sort((a, b) => a - b);
  if (triees.length === 1) return `page${ESP}${triees[0]}`;
  const morceaux: string[] = [];
  let i = 0;
  while (i < triees.length) {
    let j = i;
    while (j + 1 < triees.length && triees[j + 1] === (triees[j] ?? 0) + 1) j++;
    // Trois pages consécutives ou plus : « 2 à 4 ».
    if (j - i >= 2) {
      morceaux.push(`${triees[i]} à ${triees[j]}`);
      i = j + 1;
    } else {
      morceaux.push(String(triees[i]));
      i++;
    }
  }
  if (morceaux.length === 1) return `pages ${morceaux[0]}`;
  return `pages ${morceaux.slice(0, -1).join(', ')} et ${morceaux[morceaux.length - 1]}`;
}

function majuscule(texte: string): string {
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

/** Valeurs regroupées avec leurs pages : « 14 pt (pages 2 et 4) ; 12 pt (page 6) ». */
function groupesEnTexte(groupes: readonly { libelle: string; pages: readonly number[] }[]): string {
  return groupes.map((g) => `${g.libelle} (${listePages(g.pages)})`).join(`${FINE}; `);
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
  /** Concours interne de CPE : la page du concours et le rapport du jury 2026 (p. 17 et 19) fixent aussi 2 pages. */
  sourcesCpe: [SOURCES.S10, SOURCES.S11],
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
  /** Concours interne de CPE : la page du concours et le rapport du jury 2026 (p. 17 et 19) fixent aussi 6 pages. */
  sourcesCpe: [SOURCES.S10, SOURCES.S11],
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
  /** Concours interne de CPE : conséquence d'un dépassement selon le rapport du jury 2026 (p. 18). */
  consequenceCpe: ` Pour le CPE, le jury ne prend pas en considération les annexes au-delà de 10${ESP}pages.`,
  sources: [SOURCES.S1, SOURCES.S2],
  /** Concours interne de CPE : le rapport du jury 2026 fixe 10 pages d'annexes au plus (p. 18). */
  sourcesCpe: [SOURCES.S11],
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
  /** Concours interne de CPE : la page du concours et le rapport du jury 2026 (p. 18). */
  sourcesCpe: [SOURCES.S10, SOURCES.S11],
};

/** Une valeur mesurée (police, taille, couleur) et les pages où elle apparaît. */
export interface GroupePages {
  libelle: string;
  pages: number[];
}

const NOUVEL_EXPORT = 'puis exportez de nouveau en PDF.';
const VOLUME_INCHANGE = 'vérifiez que les parties tiennent toujours en 2 et 6 pages,';

export const R05 = {
  libelle: 'Police Arial',
  conforme: {
    titre: 'Le texte est en Arial',
    detail: (police: string) => `Police du corps du texte${ESP}: ${police}.`,
  },
  substitut: {
    titre: (police: string) => `Votre traitement de texte a remplacé Arial par ${police}`,
    detail: (police: string) =>
      `Le corps du texte est en ${police}, une police aux mêmes dimensions qu’Arial, utilisée quand Arial n’est pas installée (souvent avec LibreOffice). La mise en page est identique, mais le PDF n’est pas en Arial.`,
    correction:
      'Installez la police Arial, ou exportez le PDF depuis un ordinateur où elle est installée (Windows et macOS la fournissent), puis vérifiez de nouveau le fichier.',
  },
  erreur: {
    titre: 'Le texte n’est pas en Arial',
    detail: (police: string, pages: readonly number[]) =>
      `Le corps du texte est en ${police} (${listePages(pages)}). La police imposée est Arial${ESP}11.`,
    correction: `Sélectionnez tout le texte (Ctrl + A, ou Cmd + A sur Mac), choisissez la police Arial, ${VOLUME_INCHANGE} ${NOUVEL_EXPORT}`,
  },
  inconnue: {
    titre: 'La police du texte n’a pas pu être identifiée',
    detail: 'Le PDF ne donne pas le nom de la police du corps du texte.',
    correction: `Vérifiez dans votre traitement de texte que tout le texte est en Arial, ${NOUVEL_EXPORT}`,
  },
  autresPolices: {
    titre: 'D’autres polices qu’Arial sont utilisées',
    detail: (groupes: readonly GroupePages[]) => `${groupesEnTexte(groupes)}.`,
    correction: `Passez ces passages en Arial, ${NOUVEL_EXPORT}`,
  },
  sources: [SOURCES.S1, SOURCES.S2],
  /** Concours interne de CPE : la page du concours et le rapport du jury 2026 (p. 18). */
  sourcesCpe: [SOURCES.S10, SOURCES.S11],
};

export const R06 = {
  libelle: `Taille 11${ESP}pt`,
  conforme: {
    titre: 'Le texte est en 11 pt',
    detail: (taille: number) => `Taille du corps du texte${ESP}: ${pt(taille)}.`,
  },
  erreur: {
    titre: (taille: number) => `Le texte est en ${pt(taille)} au lieu de 11 pt`,
    detail: (taille: number) =>
      `La taille majoritaire du texte des parties 1 et 2 est de ${pt(taille)}. La taille imposée est 11${ESP}pt.`,
    correction: `Sélectionnez tout le texte et choisissez la taille 11, ${VOLUME_INCHANGE} ${NOUVEL_EXPORT}`,
  },
  plusGrand: {
    titre: 'Des lignes sont plus grandes que le texte',
    detail: (groupes: readonly GroupePages[]) => `Lignes en ${groupesEnTexte(groupes)}. Ce sont en général des titres.`,
    correction: `Les jurys recommandent d’unifier la taille du texte${ESP}: écrivez les titres en 11${ESP}pt et distinguez-les par le gras.`,
  },
  plusPetit: {
    titre: 'Du texte est plus petit que 11 pt',
    detail: (groupes: readonly GroupePages[]) => `Lignes en ${groupesEnTexte(groupes)}.`,
    correction: `Remettez ces passages en 11${ESP}pt, notes comprises${ESP}: la règle « Arial 11 » ne prévoit pas de taille réduite.`,
  },
  sources: [SOURCES.S1, SOURCES.S2, SOURCES.S8],
  /** Concours interne de CPE : la page du concours et le rapport du jury 2026 (p. 18) ; S8 pour les titres. */
  sourcesCpe: [SOURCES.S10, SOURCES.S11, SOURCES.S8],
};

export const R07 = {
  libelle: 'Interligne simple',
  conforme: {
    titre: 'L’interligne est simple',
    detail: (rapport: number) =>
      `L’écart entre les lignes d’un même paragraphe vaut ${nombre.format(rapport)} fois la taille de la police, ce qui correspond à un interligne simple. Mesure approximative.`,
  },
  avertissement: {
    titre: 'L’interligne semble plus grand que « simple »',
    detail: (rapport: number) =>
      `L’écart entre les lignes d’un même paragraphe vaut ${nombre.format(rapport)} fois la taille de la police, plus qu’un interligne simple. Mesure approximative, à vérifier dans votre document.`,
    correction: `Sélectionnez tout le texte et réglez l’interligne sur « Simple » dans la fenêtre Paragraphe, ${VOLUME_INCHANGE} ${NOUVEL_EXPORT}`,
  },
  nonMesurable: {
    titre: 'Interligne non mesurable',
    detail:
      'Les parties 1 et 2 contiennent trop peu de lignes de paragraphe pour mesurer l’interligne. Vérifiez dans votre document qu’il est réglé sur « Simple ».',
  },
  sources: [SOURCES.S1, SOURCES.S2],
  /** Concours interne de CPE : la page du concours et le rapport du jury 2026 (p. 18). */
  sourcesCpe: [SOURCES.S10, SOURCES.S11],
};

export const R08 = {
  libelle: `Marges gauche et droite de 2,5${ESP}cm`,
  conforme: {
    titre: 'Les marges gauche et droite font au moins 2,5 cm',
    detail: (gauche: number, droite: number) =>
      `Plus petites marges mesurées${ESP}: ${cm(gauche)} à gauche, ${cm(droite)} à droite (tolérance de 2${ESP}points).`,
  },
  erreur: {
    titre: 'Les marges gauche ou droite sont inférieures à 2,5 cm',
    detail: (groupes: readonly GroupePages[]) => `${majuscule(groupesEnTexte(groupes))}. Le minimum est de 2,5${ESP}cm.`,
    correction: `Dans Mise en page > Marges, réglez les marges gauche et droite sur 2,5${ESP}cm et vérifiez qu’aucun tableau ne déborde dans la marge. Ensuite, ${VOLUME_INCHANGE} ${NOUVEL_EXPORT}`,
  },
  sources: [SOURCES.S1, SOURCES.S2],
  /** Concours interne de CPE : la page du concours et le rapport du jury 2026 (p. 18). */
  sourcesCpe: [SOURCES.S10, SOURCES.S11],
};

export const R09 = {
  libelle: `En-tête et pied de page à 1,25${ESP}cm du bord`,
  conforme: {
    titre: 'Le texte est à au moins 1,25 cm des bords haut et bas',
    detail: (haut: number, bas: number) =>
      `Texte le plus proche des bords${ESP}: ${cm(haut)} du bord haut, ${cm(bas)} du bord bas.`,
  },
  erreur: {
    titre: 'Du texte est à moins de 1,25 cm du bord haut ou bas',
    detail: (groupes: readonly GroupePages[]) => `${majuscule(groupesEnTexte(groupes))}. La distance minimale est de 1,25${ESP}cm.`,
    correction:
      `Dans Word${ESP}: Mise en page > Marges > Marges personnalisées, onglet Disposition, « À partir du bord »${ESP}: 1,25${ESP}cm pour l’en-tête et le pied de page. ` +
      `Dans LibreOffice${ESP}: ajustez la marge et l’espacement de l’en-tête ou du pied de page dans Format > Style de page. Ensuite, ${NOUVEL_EXPORT}`,
  },
  sources: [SOURCES.S1, SOURCES.S2],
  /** Concours interne de CPE : la page du concours et le rapport du jury 2026 (p. 18). */
  sourcesCpe: [SOURCES.S10, SOURCES.S11],
};

export const R10 = {
  libelle: 'Pas de retrait en début de paragraphe',
  conforme: {
    titre: 'Les paragraphes commencent sans retrait',
    detail: 'Aucun retrait de première ligne n’a été détecté dans les parties 1 et 2.',
  },
  avertissement: {
    titre: 'Des paragraphes commencent par un retrait',
    detail: (nombreParagraphes: number, pages: readonly number[]) =>
      `${nombreParagraphes} paragraphes commencent en retrait par rapport à leurs lignes suivantes (${listePages(pages)}). Mesure approximative.`,
    correction: `Sélectionnez tout le texte et réglez le retrait de première ligne sur « aucun » (0${ESP}cm) dans la fenêtre Paragraphe, ${NOUVEL_EXPORT}`,
  },
  sources: [SOURCES.S1, SOURCES.S2],
  /** Concours interne de CPE : la page du concours et le rapport du jury 2026 (p. 18). */
  sourcesCpe: [SOURCES.S10, SOURCES.S11],
};

export const R12 = {
  libelle: 'Pagination',
  conforme: {
    titre: 'Les pages sont numérotées',
    detail: (pagesNumerotees: number, total: number) =>
      `Un numéro de page a été trouvé sur ${pagesNumerotees} des ${nPages(total)} des parties 1 et 2.`,
  },
  avertissement: {
    titre: 'Aucun numéro de page n’a été trouvé',
    detail: 'Aucune page des parties 1 et 2 ne porte de numéro en haut ou en bas de page.',
    correction: `Insérez la pagination (Insertion > Numéro de page), ${NOUVEL_EXPORT} Vérifiez ensuite les numéros dans le PDF obtenu.`,
  },
  /** Concours interne de CPE : ni la page du concours ni le rapport du jury 2026 n'en parlent. */
  mentionCpe: ` Pour le CPE, cette recommandation vient du jury d’un autre concours (CAPES interne de lettres)${ESP}: elle est donnée comme bonne pratique.`,
  sources: [SOURCES.S8],
};

export const R13 = {
  libelle: 'Texte en noir',
  conforme: {
    titre: 'Le texte est en noir',
    detail: 'Aucun texte en couleur dans les parties 1 et 2.',
  },
  avertissement: {
    titre: 'Du texte est en couleur',
    detail: (groupes: readonly GroupePages[]) => `Couleur ${groupesEnTexte(groupes)}.`,
    correction: `Passez ces passages en noir (couleur de police « Automatique » ou « Noir »), ${NOUVEL_EXPORT}`,
  },
  /** Concours interne de CPE : ni la page du concours ni le rapport du jury 2026 n'en parlent. */
  mentionCpe: ` Pour le CPE, cette recommandation vient du jury d’un autre concours (CAPES interne d’arts plastiques)${ESP}: elle est donnée comme bonne pratique.`,
  nonVerifiable: {
    titre: 'La couleur du texte n’a pas pu être vérifiée',
    detail:
      'Le PDF ne permet pas de lire la couleur du texte des parties 1 et 2. Vérifiez dans votre document que le texte est en noir.',
  },
  sources: [SOURCES.S7],
};

/** Commun aux règles de mise en page quand les parties 1 et 2 ne contiennent aucun texte. */
export const SANS_TEXTE = {
  titre: `Contrôle impossible${ESP}: les parties 1 et 2 ne contiennent pas de texte`,
  detail: `Aucun texte sélectionnable n’a été trouvé dans les pages des parties 1 et 2 (pages scannées${FINE}?). Ce contrôle ne peut pas être fait.`,
};

// --- Règles de contenu (étape 3) ---------------------------------------------

const COUVERTURE_A_PLACER = (session: number) =>
  `Placez en page 1 le formulaire de couverture de la session ${session} téléchargé dans votre espace Cyclades, puis exportez de nouveau en PDF.`;

export const R01 = {
  libelle: 'Page de couverture',
  detectee: {
    titre: 'Couverture détectée',
    detail: (session: number) =>
      `Couverture détectée${ESP}: vérifiez dans la checklist qu’il s’agit du formulaire ${session} téléchargé dans Cyclades.`,
  },
  sansTexte: {
    titre: 'La page 1 ne contient pas de texte',
    detail:
      'La page 1 est une image (couverture imprimée puis scannée, par exemple). L’outil ne peut pas la lire.',
    correction: (session: number) =>
      `Vérifiez qu’il s’agit bien du formulaire de couverture de la session ${session} téléchargé dans votre espace Cyclades, rempli et signé.`,
  },
  absente: {
    titre: 'La couverture semble absente',
    detail: `La page 1 commence par « Première partie »${ESP}: la page de couverture devrait la précéder.`,
    correction: COUVERTURE_A_PLACER,
  },
  sansMotCle: {
    titre: 'La page 1 ne ressemble pas à la couverture',
    detail:
      'Aucun des mots attendus sur le formulaire de couverture (concours, session, nom, prénom, attestation sur l’honneur, signature…) n’a été trouvé en page 1.',
    correction: COUVERTURE_A_PLACER,
  },
  autreSession: {
    titre: (session: number) => `La couverture mentionne une autre session que ${session}`,
    detail: (annees: readonly number[]) =>
      `La page 1 mentionne la session ${annees.join(', ')}. Une couverture d’une autre année rend le dossier hors norme.`,
    correction: (session: number) =>
      `Téléchargez le formulaire de couverture de la session ${session} dans votre espace Cyclades et remplacez la page 1.`,
  },
  sources: [SOURCES.S2, SOURCES.S3, SOURCES.S5],
};

export const R14 = {
  libelle: 'Pas de sommaire',
  conforme: { titre: 'Pas de sommaire', detail: 'Aucun sommaire ni table des matières n’a été trouvé.' },
  avertissement: {
    titre: 'Le dossier semble contenir un sommaire',
    detail: (pages: readonly number[]) =>
      `Un sommaire ou une table des matières a été repéré (${listePages(pages)}).`,
    correction: `Supprimez le sommaire${ESP}: les jurys ne l’attendent pas et il occupe une place comptée dans les 8${ESP}pages.`,
  },
  sources: [SOURCES.S5, SOURCES.S7],
};

export const R15 = {
  libelle: 'Pas de CV',
  conforme: { titre: 'Pas de CV', detail: 'Aucun curriculum vitae n’a été trouvé.' },
  avertissement: {
    titre: 'Le dossier semble contenir un CV',
    detail: (pages: readonly number[]) => `Un titre « CV » ou « Curriculum vitae » a été trouvé (${listePages(pages)}).`,
    correction:
      'Retirez le CV et présentez votre parcours de façon rédigée dans la première partie, en montrant les compétences construites.',
  },
  mention: {
    titre: 'Un curriculum vitae est mentionné',
    detail: 'Citer un curriculum vitae dans le texte est possible. En revanche, les jurys demandent de ne pas joindre de CV au dossier.',
  },
  sources: [SOURCES.S5, SOURCES.S7],
  /** Concours interne de CPE : le rapport du jury 2026 proscrit aussi le CV en annexe (p. 20). */
  sourcesCpe: [SOURCES.S5, SOURCES.S7, SOURCES.S11],
};

export const R16 = {
  libelle: 'Pas de lettre de recommandation ni de rapport d’inspection',
  conforme: {
    titre: 'Pas de lettre de recommandation ni de rapport d’inspection',
    detail: 'Aucune lettre de recommandation, aucun rapport d’inspection ou de visite-conseil n’a été trouvé.',
  },
  erreur: {
    titre: 'Le dossier semble contenir un document interdit',
    detail: (groupes: readonly GroupePages[]) =>
      `Document probablement joint${ESP}: ${groupesEnTexte(groupes)}. Une lettre de recommandation ou un rapport d’inspection ou de visite-conseil joint écarte le dossier.`,
    correction:
      'Retirez ce document du dossier. Vous pouvez évoquer une visite ou une inspection dans votre texte, sans joindre le rapport.',
  },
  mention: {
    titre: 'Une visite ou une inspection est mentionnée',
    detail:
      'Mentionner une visite ou une inspection est possible. En revanche, joindre un rapport d’inspection, de visite-conseil ou une lettre de recommandation écarte le dossier.',
  },
  sources: [SOURCES.S9],
  /** Concours interne de CPE : le rapport du jury 2026 exclut aussi toute recommandation (p. 18 et 20). */
  sourcesCpe: [SOURCES.S9, SOURCES.S11],
};

export const R17 = {
  libelle: 'Liens et QR codes non lus',
  conforme: {
    titre: 'Pas de lien ni d’adresse web',
    detail: `Aucun lien ni adresse web n’a été trouvé. Les QR codes ne peuvent pas être détectés automatiquement${ESP}: vérifiez qu’il n’y en a pas.`,
  },
  avertissement: {
    titre: 'Le dossier contient des liens ou des adresses web',
    detail: (groupes: readonly GroupePages[]) =>
      `Adresses et liens trouvés${ESP}: ${groupesEnTexte(groupes)}. Le jury ne consulte ni les liens ni les QR codes.`,
    correction: `Mettez dans le dossier ou en annexe ce qui doit être lu${ESP}: un document accessible seulement par un lien ou un QR code ne sera pas consulté.`,
  },
  sources: [SOURCES.S6],
};

export const R18 = {
  libelle: 'HGGSP en histoire-géographie',
  conforme: { titre: 'Pas de mention de l’HGGSP', detail: 'La partie 2 et les annexes ne mentionnent pas l’HGGSP.' },
  avertissement: {
    titre: 'Le dossier mentionne l’HGGSP',
    detail: (pages: readonly number[]) =>
      `L’HGGSP est mentionnée dans la partie 2 ou les annexes (${listePages(pages)}). En histoire-géographie, un dossier qui porte sur l’enseignement de spécialité HGGSP est irrecevable.`,
    correction: 'Vérifiez que la séquence analysée relève bien de l’histoire-géographie, discipline choisie à l’inscription.',
  },
  sources: [SOURCES.S5],
};

export const R19 = {
  libelle: 'Nom du fichier',
  conforme: {
    titre: 'Le fichier est nommé aux nom et prénom',
    detail: (nom: string) => `Le fichier s’appelle « ${nom} ».`,
  },
  avertissement: {
    titre: 'Le nom du fichier ne suit pas la forme NOM_Prénom.pdf',
    detail: (nom: string) =>
      `Le fichier s’appelle « ${nom} ». La note de service demande un PDF nommé aux nom et prénom du candidat, par exemple DUPONT_Marie.pdf.`,
    correction: 'Renommez le fichier sous la forme NOM_Prénom.pdf avant de le déposer dans Cyclades.',
  },
  sources: [SOURCES.S4],
};

/** Libellé court de chaque règle, affiché dans le rapport à côté de son identifiant. */
export const LIBELLES_REGLES: Readonly<Record<string, string>> = {
  R00: R00.libelle,
  R01: R01.libelle,
  R02: R02.libelle,
  R03: R03.libelle,
  R04: R04.libelle,
  R05: R05.libelle,
  R06: R06.libelle,
  R07: R07.libelle,
  R08: R08.libelle,
  R09: R09.libelle,
  R10: R10.libelle,
  R11: R11.libelle,
  R12: R12.libelle,
  R13: R13.libelle,
  R14: R14.libelle,
  R15: R15.libelle,
  R16: R16.libelle,
  R17: R17.libelle,
  R18: R18.libelle,
  R19: R19.libelle,
};

// --- Page « Les règles officielles du RAEP » --------------------------------

/** Explication d'une règle pour le public, d'après la synthèse des textes officiels (docs/). */
export interface Explication {
  /** Ce que disent les textes ou les jurys, en clair. */
  regle: string;
  /** Ce que vérifie l'outil, et quand il signale une erreur ou un avertissement. */
  controle: string;
  /** Comment respecter la règle. */
  conseil: string;
}

const TOLERANCE = `avec une tolérance de 2${ESP}points (moins d’un millimètre)`;

export const EXPLICATIONS = {
  R01: {
    regle: `Le dossier commence par le formulaire de couverture téléchargé dans votre espace Cyclades, de l’année de la session. Une couverture absente ou d’une autre année rend le dossier hors norme.`,
    controle: `L’outil cherche en page${ESP}1 les mots du formulaire (concours, session, nom, signature…) et l’année de la session. Il ne peut pas certifier qu’il s’agit du bon formulaire${ESP}: il vous demande de le confirmer dans la checklist. Avertissement si la page${ESP}1 ne ressemble pas à une couverture ou mentionne une autre session.`,
    conseil: `Téléchargez le formulaire de la session 2027 dans votre espace Cyclades, remplissez-le, signez-le et placez-le en page${ESP}1.`,
  },
  R02: {
    regle: `La première partie, consacrée à votre parcours et aux responsabilités qui vous ont été confiées, tient en 2${ESP}pages au plus.`,
    controle: `L’outil compte les pages de la partie${ESP}1 d’après le découpage que vous confirmez. Erreur au-delà de 2${ESP}pages.`,
    conseil: 'Resserrez le propos, sans réduire la police, la taille ni les marges, qui sont elles aussi contrôlées.',
  },
  R03: {
    regle: `La seconde partie, l’analyse d’une expérience que vous avez menée, tient en 6${ESP}pages au plus.`,
    controle: `L’outil compte les pages de la partie${ESP}2 d’après le découpage que vous confirmez. Erreur au-delà de 6${ESP}pages.`,
    conseil: 'Resserrez l’analyse, sans réduire la police, la taille ni les marges, qui sont elles aussi contrôlées.',
  },
  R04: {
    regle: `Les annexes sont facultatives${ESP}: un ou deux exemples de documents ou de travaux liés à la situation décrite, 10${ESP}pages au plus pour l’ensemble.`,
    controle: `Erreur au-delà de 10${ESP}pages d’annexes. L’outil ne juge pas leur choix${ESP}: c’est un point de la checklist.`,
    conseil: 'Gardez un ou deux documents en lien direct avec la situation analysée.',
  },
  R05: {
    regle: 'Le dossier est écrit en Arial.',
    controle: `L’outil lit le nom des polices dans le PDF. Erreur si le texte des parties${ESP}1 et 2 est surtout dans une autre police. Avertissement si votre traitement de texte a remplacé Arial par une police aux mêmes dimensions (Liberation Sans, Arimo), ou si d’autres polices apparaissent.`,
    conseil: 'Choisissez Arial pour tout le texte, et exportez le PDF depuis un ordinateur où Arial est installée (Windows et macOS la fournissent).',
  },
  R06: {
    regle: `Le texte est en 11${ESP}points. Le jury de lettres recommande aussi d’écrire les titres à la même taille.`,
    controle: `Erreur si la taille principale du texte sort de l’intervalle de 10,5 à 11,5${ESP}points. Avertissement pour les lignes d’une autre taille${ESP}: titres plus grands, notes ou passages réduits.`,
    conseil: `Écrivez tout en 11${ESP}points, titres et notes compris, et distinguez les titres par le gras.`,
  },
  R07: {
    regle: 'L’interligne est simple.',
    controle: `L’outil mesure l’écart entre les lignes d’un même paragraphe. Au-delà de 1,35${ESP}fois la taille de la police, il donne un avertissement${ESP}: la mesure est approximative.`,
    conseil: 'Réglez l’interligne sur « Simple » dans la fenêtre Paragraphe.',
  },
  R08: {
    regle: `Les marges gauche et droite mesurent 2,5${ESP}cm.`,
    controle: `Erreur si du texte des parties${ESP}1 et 2 est à moins de 2,5${ESP}cm du bord gauche ou droit, ${TOLERANCE}.`,
    conseil: `Réglez les marges gauche et droite sur 2,5${ESP}cm et vérifiez qu’aucun tableau ne déborde dans la marge.`,
  },
  R09: {
    regle: `L’en-tête et le pied de page sont à 1,25${ESP}cm du bord. Les marges haute et basse, elles, ne sont pas fixées.`,
    controle: `Erreur si du texte, numéro de page compris, est à moins de 1,25${ESP}cm du bord haut ou bas, ${TOLERANCE}.`,
    conseil: `Dans Word, réglez « À partir du bord » sur 1,25${ESP}cm pour l’en-tête et le pied de page (Mise en page > Marges > Marges personnalisées, onglet Disposition).`,
  },
  R10: {
    regle: 'Les paragraphes commencent sans retrait.',
    controle: `Avertissement si plusieurs paragraphes commencent plus à droite que leurs lignes suivantes, de plus de 5${ESP}points. Mesure approximative.`,
    conseil: `Réglez le retrait de première ligne sur 0${ESP}cm dans la fenêtre Paragraphe.`,
  },
  R11: {
    regle: `Le format est A4${ESP}: 21 × 29,7${ESP}cm.`,
    controle: `Erreur si une page des parties${ESP}1 ou 2 n’est pas au format A4, en portrait ou en paysage, ${TOLERANCE}. Avertissement pour la couverture et les annexes.`,
    conseil: 'Choisissez le format A4 dans la mise en page, puis vérifiez-le dans la fenêtre d’export PDF.',
  },
  R12: {
    regle: `Numérotez les pages${ESP}: le jury du CAPES interne de lettres le rappelle dans son rapport 2026.`,
    controle: `Avertissement si aucun numéro n’est trouvé en haut ou en bas des pages des parties${ESP}1 et 2. L’outil reconnaît les numéros en chiffres (« 3 », « Page 3 », « 3/11 »…).`,
    conseil: 'Insérez la pagination avant l’export, puis vérifiez les numéros dans le PDF obtenu.',
  },
  R13: {
    regle: `Écrivez le texte en noir${ESP}: le jury du CAPES interne d’arts plastiques relève dans son rapport 2026 que les couleurs excessives gênent la lecture.`,
    controle: `Avertissement si du texte des parties${ESP}1 et 2 est en couleur. Le gris n’est pas compté comme une couleur.`,
    conseil: 'Choisissez la couleur de police « Automatique » ou « Noir ».',
  },
  R14: {
    regle: `Les jurys jugent le sommaire inutile${ESP}: il prend de la place dans des pages comptées.`,
    controle: 'Avertissement si l’outil trouve un titre « Sommaire » ou « Table des matières », ou une liste de titres suivis de numéros de page. Le mot cité dans une phrase est ignoré.',
    conseil: 'Supprimez le sommaire.',
  },
  R15: {
    regle: 'Le parcours se présente de façon rédigée dans la première partie. Les jurys demandent de ne pas joindre de CV.',
    controle: 'Avertissement si « CV » ou « Curriculum vitae » apparaît comme titre. Simple information s’il est cité dans une phrase.',
    conseil: 'Présentez votre parcours en montrant les compétences construites, plutôt qu’une liste de postes.',
  },
  R16: {
    regle: `Joindre une lettre de recommandation ou un rapport d’inspection ou de visite-conseil écarte le dossier. Les mentionner dans le texte reste possible.`,
    controle: `Erreur si l’une de ces expressions est un titre, figure dans les annexes ou ouvre un bloc de texte. Simple information si elle est citée dans une phrase des parties${ESP}1 et 2. Un document scanné, en image, n’est pas lu${ESP}: c’est un point de la checklist.`,
    conseil: 'Retirez ce document. Vous pouvez évoquer la visite ou l’inspection dans votre texte.',
  },
  R17: {
    regle: `Le jury ne consulte ni les liens ni les QR codes${ESP}: ce qui doit être lu figure dans le dossier.`,
    controle: `Avertissement si une adresse web ou un lien cliquable est trouvé. Les QR codes ne sont pas détectés${ESP}: vérifiez-les vous-même.`,
    conseil: 'Mettez dans le dossier ou en annexe ce qui doit être lu.',
  },
  R18: {
    regle: 'En histoire-géographie, un dossier qui porte sur l’enseignement de spécialité HGGSP est irrecevable.',
    controle: `Si vous avez choisi l’histoire-géographie, avertissement quand «${ESP}HGGSP${ESP}» apparaît dans la partie${ESP}2 ou les annexes. Une mention dans le parcours (partie${ESP}1) est ignorée.`,
    conseil: 'Analysez une séquence d’histoire-géographie, la discipline de votre inscription.',
  },
  R19: {
    regle: 'Le dossier se dépose en PDF, nommé à vos nom et prénom.',
    controle: 'Avertissement si le nom du fichier ne ressemble pas à NOM_Prénom.pdf, la forme que l’outil propose.',
    conseil: 'Renommez le fichier, par exemple DUPONT_Marie.pdf, avant de le déposer dans Cyclades.',
  },
} as const satisfies Record<string, Explication>;

export type IdRegleExpliquee = keyof typeof EXPLICATIONS;

/** Textes de chaque règle utiles à la page publique : libellé, sources, sources du CPE. */
export const TEXTES_REGLES = {
  R01, R02, R03, R04, R05, R06, R07, R08, R09, R10, R11, R12, R13, R14, R15, R16, R17, R18, R19,
} as const satisfies Record<IdRegleExpliquee, { libelle: string; sources: readonly Source[] }>;

/** Groupes de la page « Les règles officielles du RAEP », dans l'ordre d'affichage. */
export const GROUPES_REGLES: readonly { id: string; titre: string; intro: string; regles: readonly IdRegleExpliquee[] }[] = [
  {
    id: 'volume',
    titre: 'Nombre de pages',
    intro: `Les deux parties comptent 8${ESP}pages au plus${ESP}: 2 pour la première, 6 pour la seconde. Les annexes ont leur propre limite.`,
    regles: ['R02', 'R03', 'R04'],
  },
  {
    id: 'presentation',
    titre: 'Présentation',
    intro: 'Les textes officiels fixent la présentation de chaque partie.',
    regles: ['R05', 'R06', 'R07', 'R08', 'R09', 'R10', 'R11'],
  },
  {
    id: 'recommandations',
    titre: 'Recommandations des jurys',
    intro: `Ces points viennent des rapports de jury, pas des textes officiels${ESP}: l’outil les signale en avertissement.`,
    regles: ['R12', 'R13'],
  },
  {
    id: 'contenu',
    titre: 'Ce que le dossier ne doit pas contenir',
    intro: 'Les jurys relèvent chaque année les mêmes ajouts, inutiles ou éliminatoires.',
    regles: ['R14', 'R15', 'R16', 'R17', 'R18'],
  },
  {
    id: 'couverture-fichier',
    titre: 'Couverture et fichier',
    intro: '',
    regles: ['R01', 'R19'],
  },
];
