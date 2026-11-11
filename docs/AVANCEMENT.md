# Avancement — Au propre

Mis à jour le 11 novembre 2026. Objectif : V1 en ligne sous 48 heures (prévue vers le 10 novembre 2026), dépôt des dossiers au plus tard le 3 décembre 2026 à 23 h 59.

**Où en est le projet** : les 20 règles (R00 à R19), le vérificateur complet, les pages du site et l'identité Au propre sont faits. Toutes les pages suivent l'échelle de l'accueil (validé le 31 octobre). Version `v0.9.0` étiquetée sur GitHub. L'étape 6, la mise en ligne sur https://au-propre.fr, est codée, avec les derniers changements demandés avant le lancement (11 novembre). Le jeton, les secrets GitHub et le profil Cloudflare sont faits ; le code est poussé sur `main`. Restent le domaine personnalisé, les redirections et les vérifications en ligne : voir la checklist `docs/LANCEMENT.md`.

**Tests** : 531 tests Vitest, 221 tests Playwright (4 ignorés exprès en mobile), tous au vert en local. En CI, WebKit s'y ajoute. 12 tests de production (`npm run test:prod`, Chromium et Firefox), à lancer une fois le domaine rattaché.

## Étape 1 : terminée

Socle technique, extraction du PDF et cinq premières règles. Pas encore d'interface : la page d'accueil est provisoire.

**Projet**

- Astro 7 (site statique) avec un îlot React 19 prévu pour le vérificateur, TypeScript 6 en mode `strictest`, Vitest 5.
- Dépôt Git : https://github.com/matteolefer/au-propre (privé), branche `main`.
- Commandes : `npm test`, `npm run test:e2e` (Playwright, construit et sert le site), `npm run check` (types), `npm run build`, `npm run dev`.

**Variables CSS** (`src/styles/tokens.css`)

- Tokens de `DESIGN.md` : neutres, accent bleu, échelle typographique, espacements, rayons.
- Tokens sémantiques à utiliser dans les composants : `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-accent*`, `--color-erreur*`, `--color-avertissement*`, `--color-conforme*`, `--focus-ring`.
- `prefers-reduced-motion` respecté. Pied de page obligatoire dans `src/layouts/Base.astro`.

**Extraction** (`src/checker/extract.ts`)

- pdf.js lit le PDF dans un Web Worker (`extract.worker.ts`) ; la page appelle `extraireDansWorker(fichier)` (`extraction.ts`).
- Modèle produit : pages (taille, rotation), blocs de texte (police, taille, position, couleur), liens, images. Mesures en points, origine en haut à gauche.
- Aucune requête réseau : le PDF reste dans le navigateur.
- Erreurs gérées : PDF protégé par mot de passe, fichier qui n'est pas un PDF.
- Vérifiée dans Chrome : fixture 01 analysée en moins de 200 ms ; scan 05 reconnu (11 pages, 11 images, aucun texte) ; faux PDF refusé.

**Règles** (`src/checker/rules/`, textes et sources dans `src/content/rules.fr.ts`)

| Règle | Contrôle | Résultat sur les fixtures |
| --- | --- | --- |
| R00 | PDF lisible (couche texte) | 05 : bloquant ; 01 à 04 : conforme |
| R02 | Partie 1 : 2 pages maximum | 02 : erreur (pages 2 à 4) ; 01, 03, 04 : conforme |
| R03 | Partie 2 : 6 pages maximum | Conforme ; erreur testée sur un document synthétique de 7 pages |
| R04 | Annexes : 10 pages maximum | Conforme ; erreur testée sur 11 pages synthétiques |
| R11 | Format A4 | Conforme ; erreur, avertissement et tolérance testés sur documents synthétiques |

**Tests** : 74 tests Vitest. L'extraction est confrontée aux mesures du script de référence `outils/mesurer_pdf.py` : marges 2,50 / 2,48 cm (01) et 2,00 / 1,97 cm (04), police, taille 11 pt, couleur noire, titres des parties sur les bonnes pages.

## Étape 2 : terminée

Règles de présentation matérielle R05 à R10, R12 et R13, testées sur les fixtures LibreOffice et Word.

**Modules communs**

- `src/checker/polices.ts` : classement d'un nom de police en `arial` (Arial, ArialMT et leurs variantes grasses et italiques), `substitut` (Liberation Sans, Arimo), `symbole` (polices de puces), `inconnue` ou `autre`. Arial Narrow, Arial Black et Arial Unicode sont d'autres polices.
- `src/checker/texte.ts` : pages des parties, valeurs majoritaires pondérées par le nombre de caractères, regroupement des blocs en lignes (les exposants restent sur leur ligne).
- `src/checker/measure.ts` : seuils de SPEC, et seuils de calibration non officiels, commentés comme tels.

**Règles**

| Règle | Contrôle | Gravité | Résultat sur les fixtures |
| --- | --- | --- | --- |
| R05 | Police Arial (police majoritaire) ; autres polices utilisées | erreur, avertissement | 01, 02, 04 LibreOffice : avertissement (Liberation Sans) ; 03 : erreur (Carlito, Calibri) ; 01 Word : conforme |
| R06 | Taille du corps dans [10,5 ; 11,5] pt ; lignes d'une autre taille | erreur, avertissement | Conforme (11 pt ; 11,04 pt dans les exports Word) |
| R07 | Interligne simple : écart médian entre lignes d'un paragraphe ≤ 1,35 fois la taille | avertissement | Conforme : 1,09 (LibreOffice), 1,16 (Word Arial), 1,22 (Word Calibri) |
| R08 | Marges gauche et droite ≥ 2,5 cm − 2 pt | erreur | 04 : erreur (2 cm et 1,97 cm) ; autres : conforme (2,50 et 2,48 ou 2,49 cm) |
| R09 | Texte à ≥ 1,25 cm − 2 pt des bords haut et bas | erreur | Conforme (pied de page à 1,25 ou 1,26 cm) |
| R10 | Pas de retrait de première ligne récurrent (> 5 pt, au moins 2 paragraphes) | avertissement | Conforme |
| R12 | Numéro de page en haut ou en bas des pages des parties | avertissement | Conforme (8 pages sur 8) |
| R13 | Texte en couleur (écart RVB ≥ 40) | avertissement | Conforme (noir) |

Quand les parties ne contiennent aucun texte, ces règles renvoient « contrôle impossible » (info) au lieu de conclure.

**Tests** : 243 tests Vitest (3 ignorés : exports Word absents). `tests/fixtures-attendues.test.ts` vérifie le tableau du README : chaque fixture déclenche les règles attendues, et seulement elles. Les cas d'erreur sans fixture (titres en 14 pt, interligne 1,5, retraits, pied de page à 1 cm, texte rouge, absence de numéro…) sont testés sur un dossier synthétique conforme modifié une chose à la fois.

## Étape 3 : terminée

Règles de contenu R14 à R19 et couverture R01. Les 19 règles de SPEC sont désormais implémentées (R00 à R19).

**Socle**

- `ParametresDossier` (`types.ts`) : discipline et nom du fichier fournis par le candidat. Le registre appelle chaque règle avec `(document, decoupage, parametres)`.
- `src/checker/recherche.ts` : texte normalisé (sans accents ni majuscules) de chaque page, recherche d'expressions même coupées en fin de ligne, détection des titres (ligne courte en début de paragraphe, sans point final) et des débuts de paragraphe.
- `measure.ts` : `SESSION_ATTENDUE = 2027` (à changer pour la session 2028), et trois seuils de calibration : `LONGUEUR_TITRE_MAX` (60 caractères), `LIGNES_SOMMAIRE_MIN` (3), `MOTS_CLES_COUVERTURE_MIN` (1).

**Règles**

| Règle | Contrôle | Gravité | Résultat sur les fixtures |
| --- | --- | --- | --- |
| R01 | Couverture : page 1 sans texte, commençant par « Première partie », sans mot-clé de couverture ou d'une autre session → avertissement ; sinon info « à confirmer dans la checklist » | avertissement, info | Info (couverture fictive détectée) |
| R14 | Sommaire : titre « Sommaire » ou « Table des matières », ou lignes terminées par un numéro de page croissant | avertissement | Conforme |
| R15 | CV : « CV » ou « Curriculum vitae » en titre → avertissement ; cité dans une phrase → info | avertissement, info | Conforme |
| R16 | Lettre de recommandation, rapport d'inspection, visite-conseil : en titre, en annexe ou en tête de bloc → erreur ; cité dans le texte des parties 1 et 2 → info | erreur, info | Conforme |
| R17 | Adresses web dans le texte et liens cliquables vers le web | avertissement | Conforme |
| R18 | HGGSP dans la partie 2 ou les annexes, si la discipline est l'histoire-géographie | avertissement | Conforme (discipline histoire-géographie simulée) |
| R19 | Nom du fichier de la forme `NOM_Prénom.pdf` | avertissement | Avertissement pour les noms des fixtures (`01_conforme.pdf`…), comme attendu |

R14 à R17 portent sur toutes les pages sauf la couverture, annexes comprises ; R18 sur la partie 2 et les annexes. R18 et R19 ne s'appliquent pas quand la discipline ou le nom du fichier sont inconnus.

**Tests** : 359 tests Vitest, aucun ignoré. Les quatre exports Word sont désormais présents : le tableau du README est vérifié en entier sur les deux séries. Les cas d'alerte de R14 à R19 et de R01 sont testés sur des pages synthétiques (titres, sommaire à points de suite ou à tabulation, CV en annexe, rapport d'inspection en titre ou cité dans une phrase, adresses web, e-mail ignoré, couverture 2026, page 1 scannée…).

## Étape 4 : terminée

L'interface complète du vérificateur, sur la page `/verifier/` : paramètres, découpage confirmé par le candidat, rapport imprimable. Parcours de SPEC §4 (points 2 à 4).

**Parcours**

- **Paramètres** (`Parametres.tsx`, `DepotFichier.tsx`) : concours, puis discipline (liste officielle des sections 2027, `src/content/concours.fr.ts`, sans discipline pour le CPE), PDF par glisser-déposer ou sélection. Le vrai champ fichier, caché, reste utilisable au clavier. Mention « Votre fichier est analysé dans votre navigateur et n'est envoyé nulle part. » Avant toute lecture, l'outil refuse un document Word ou LibreOffice (en expliquant comment l'exporter), un fichier qui n'est pas un PDF, plusieurs fichiers, ou un fichier de plus de 50 Mo. Au-delà de 10 Mo, il affiche l'information sur le poids.
- **Lecture** : barre de progression page par page, annulation possible.
- **Échecs** : PDF invalide, protégé par mot de passe, erreur inattendue. Chaque message dit ce qui ne va pas et comment corriger. Le concours et la discipline sont conservés.
- **Scan** : textes de R00, en style neutre et non en erreur, puisque le dossier n'enfreint aucune règle. Pas de découpage.
- **Découpage** (`src/checker/split.ts`, `Decoupage.tsx`) : pages de début proposées d'après les titres (« Première partie », « 1re partie », « Partie 1 », « I. … », « Seconde/Deuxième partie », « Annexe(s) », « Annexe n° 1 »…). Les lignes de sommaire sont ignorées. Le titre d'une annexe doit figurer dans les 3 premières lignes d'une page. Un titre introuvable est remplacé par la structure courante (couverture, 2 pages, 6 pages, annexes) et marqué « À vérifier ». Trois listes de pages, un résumé, et un aperçu de chaque page rangé sous sa section. Une saisie invalide est signalée et bloque la vérification. Rien n'est analysé avant « Confirmer le découpage et vérifier ».
- **Rapport** (`src/checker/report.ts`, `Rapport.tsx`, `Controle.tsx`, `Checklist.tsx`) :
  - en-tête (fichier, pages, poids, concours, discipline, date) ;
  - résumé chiffré, sans promesse de résultat ;
  - groupes « À corriger », « À vérifier », « Conforme », puis « Informations » à part ;
  - pour chaque contrôle : mesure, pages concernées, correction, sources en lien (nouvel onglet, pour ne pas perdre le rapport) ;
  - checklist à cocher (SPEC §6), avec le point sur les annexes en image et leurs numéros de page ;
  - « Modifier le découpage » efface le rapport.
- **Impression** (`src/styles/impression.css`) : seul le rapport s'imprime. Les adresses des sources sont listées une seule fois à la fin (« Sources citées ») au lieu d'être répétées sous chaque contrôle.

**Worker**

- `src/checker/protocole.ts` : messages entre la page et le Worker, sans pdf.js, pour que la page n'embarque pas pdf.js. Les gardes ignorent le message « ready » de pdf.js.
- Le Worker envoie la progression, puis la réponse avec un aperçu PNG de chaque page, dessiné avec OffscreenCanvas (`src/checker/miniatures.ts`). Sans OffscreenCanvas, la page affiche la première ligne de chaque page à la place de l'aperçu.
- pdf.js n'est que dans le bundle du Worker (1,6 Mo, chargé au moment de la lecture). La page charge l'îlot (78 Ko) et React.

**Règles et contenus**

- `ParametresDossier.concours` ; pour le CPE, R02 et R03 citent S10, R04 passe en avertissement avec « Limite de 10 pages d'annexes non confirmée pour le CPE. »
- `measure.ts` : `TAILLE_FICHIER_MAX_OCTETS` (50 Mo) et `TAILLE_FICHIER_LOURD_OCTETS` (10 Mo), limites de l'outil et non officielles.
- Textes de l'interface dans `src/content/interface.fr.ts`, checklist dans `checklist.fr.ts`, libellés des règles dans `LIBELLES_REGLES` (`rules.fr.ts`).
- SPEC mise à jour : S10, CPE (R02 à R04), poids du fichier (§4), point « annexes en image » (§6).

**Tests**

- 418 tests Vitest : découpage (fixtures, variantes de titres, sommaire, citation dans une phrase, annexes listées en bas de page, document sans titre), rapport, contenus, protocole du Worker, contrastes (nouveaux tokens d'information et bordures de champ à 3:1).
- 75 tests Playwright (`npm run test:e2e`), sur Chromium, Firefox et mobile (Pixel 7). 73 passent, 2 sont ignorés exprès en mobile (glisser-déposer, parcours clavier). Ils couvrent :
  - le parcours sur les 8 fixtures (découpage proposé, aperçus, rapport attendu) ;
  - le glisser-déposer, la correction et l'invalidité du découpage, le CPE, le clavier et le focus, l'absence de défilement horizontal ;
  - le scan, le faux PDF, le document Word, les seuils de 50 et 10 Mo, l'annulation ;
  - le message « ready » ;
  - aucune requête autre qu'un GET local sans corps ;
  - l'impression.
- Durée de lecture mesurée, aperçus compris : environ 1 s pour 11 à 12 pages (Chromium et Firefox, 4 tests en parallèle).
- Captures relues en 1280 et 390 px (script hors dépôt). Défauts corrigés :
  - bordure rouge de la zone de dépôt écrasée ;
  - scan affiché comme une erreur ;
  - détails des contrôles trop hauts (passés en deux colonnes) ;
  - sources des contrôles conformes mal alignées ;
  - double ponctuation « PDF.), » ;
  - adresses répétées à l'impression ;
  - discipline signalée manquante alors que sa liste était désactivée ;
  - choix perdus avant l'hydratation de l'îlot (champs désormais actifs seulement après l'hydratation).

## Étape 5 : terminée

Pages de contenu, référencement, inscription facultative, sources du CPE, PDF protégés. Le produit s'appelle désormais **Au propre** (sous-titre « Vérifiez votre dossier RAEP avant le dépôt ») ; l'ancien nom n'apparaît plus nulle part (le dépôt GitHub a depuis été renommé `au-propre`).

**Identité** (`src/content/site.ts`, seule source de vérité)

- Nom, sous-titre, domaine `https://au-propre.fr` (repris par `astro.config.mjs` pour `site`), logo (voir « Identité visuelle »), éditeur, contact, directeur de la publication, hébergeur (Cloudflare, Inc., adresse vérifiée sur sa politique de confidentialité), formulaire d'inscription, titres et descriptions des pages.
- `champsACompleter()` liste les champs « à compléter », affichés surlignés sur les pages tant qu'ils ne sont pas fournis.

**Pages** (`src/pages/`, styles dans `src/styles/pages.css`)

- **Gabarit** (`Base.astro`) : lien « Aller au contenu », nom ou logo, navigation (« Les règles », « Vérifier mon dossier », page courante signalée), pied de page avec la phrase d'indépendance et les liens vers les règles, la confidentialité et les mentions légales.
- **Accueil** :
  - titre de CLAUDE.md, pour qui, bouton « Vérifier mon dossier », « Gratuit, sans compte. Votre fichier reste sur votre ordinateur. » ;
  - échéance (S3) et faits sourcés : 96 dossiers hors norme en histoire-géographie (S5), 158 au CPE (S11, p. 19) ;
  - « Comment ça marche » en trois étapes ;
  - un vrai contrôle R02 rendu au build par le composant du rapport ;
  - ce que l'outil vérifie, ce qu'il ne fait pas, confidentialité.
  - Aucun script chargé.
- **« Les règles officielles du RAEP »** (`/regles/`) :
  - tableau « En bref », sommaire ;
  - les 19 règles par groupe, chacune avec énoncé, ce que vérifie l'outil, comment faire, sources, et précision pour le CPE (R04, R12, R13) ;
  - la checklist, les particularités du CPE, toutes les sources (mention Etalab 2.0).
  - Textes : `EXPLICATIONS` et `GROUPES_REGLES` dans `rules.fr.ts`, rédigés d'après la synthèse officielle de `docs/` ; règle officielle et recommandation de jury toujours distinguées.
- **Confidentialité** : votre dossier, ce qui n'est jamais collecté, hébergement Cloudflare, inscription par e-mail (section affichée seulement si le formulaire est renseigné), vos droits (CNIL).
- **Mentions légales** : éditeur (à compléter), hébergeur, indépendance, portée du rapport, contenus Etalab 2.0, licences de pdf.js et React.
- **404** : explication et trois liens, `noindex`.

**Référencement**

- Titre (« Titre – Au propre ») et description (≤ 160 caractères) par page, adresse canonique, balises Open Graph (image 1200 × 630), `twitter:card`, `theme-color`.
- `sitemap.xml` et `robots.txt` générés au build, sans dépendance.
- Favicon, icône Apple et image de partage provisoires, dessinés par un script ; remplacés le jour même par le kit d'identité (voir « Identité visuelle »).

**Inscription facultative** (`Inscription.tsx`, textes `INSCRIPTION` dans `interface.fr.ts`)

- Sous la checklist du rapport : « Être prévenu quand la relecture critique sera disponible », bouton « M'inscrire par e-mail », « Votre e-mail n'est jamais lié à votre dossier. »
- Le bouton ouvre le formulaire Brevo tel quel, dans un nouvel onglet, avec `rel="noopener noreferrer"`. Aucun champ ni script tiers sur le site.
- Masqué, ainsi que sa section de la politique de confidentialité, tant que `SITE.inscription.formulaireUrl` est vide. Pas imprimé.

**Concours de CPE**

- S11, le rapport de jury CPE interne 2026, a été lu (p. 17 à 20). Il confirme :
  - 2 et 6 pages ;
  - Arial 11, interligne simple, A4, marges de 2,5 cm, 1,25 cm du bord, sans retrait ;
  - 10 pages d'annexes au plus (« au-delà, le jury ne les prendra pas en considération ») ;
  - le refus du CV en annexe et de toute recommandation.
- Sources citées pour le CPE (`sourcesCpe` dans `rules.fr.ts`, choisies par `sourcesDe()` dans `rules/commun.ts`) :

  | Règles | Sources |
  | --- | --- |
  | R02, R03, R05, R07 à R11 | S10 et S11 |
  | R04 | S11 |
  | R06 | S10, S11 et S8 |
  | R15, R16 | S11 en plus |

- R04 au CPE redevient une erreur ; le détail donne la conséquence fixée par le jury.
- R12 et R13 au CPE restent des avertissements avec S8 et S7 ; le détail précise que la recommandation vient du jury d'un autre concours et qu'elle est donnée comme bonne pratique.

**PDF protégés**

- `06_protege.pdf` (mot de passe d'ouverture) et `07_restrictions.pdf` (copie interdite, ouverture libre), créés par `outils/proteger_pdf.py` (pypdf, RC4 128 bits).
- Nouveau message : « Ce PDF demande un mot de passe à l'ouverture : l'outil ne peut pas le lire. » La correction explique comment exporter sans mot de passe (Word sous Windows, LibreOffice) et rappelle de déposer cette version dans Cyclades.
- 07 donne exactement le même modèle que 01_conforme_word.

**Tests**

- **Vitest : 492 tests**
  - sources du CPE (`tests/rules/cpe.test.ts`), R04 au CPE ;
  - extraction de 06 et 07 ;
  - identité du site, explications des 19 règles et typographie ;
  - encart d'inscription (`renderToStaticMarkup`).
  - `tests/helpers/typographie.ts` vérifie l'apostrophe, les guillemets, l'espace insécable avant « : ; ! ? » et dans les heures.
- **Playwright : 129 tests** (126 passent, 3 ignorés exprès en mobile), `tests/e2e/pages.spec.ts` :
  - pour chaque page : titre, description, canonique, Open Graph, un seul h1, pied de page, pas de défilement horizontal, typographie du texte affiché ;
  - titres distincts ; bouton de l'accueil ; navigation ; lien d'évitement ;
  - ancres des 19 règles ; 404 en `noindex` ; sitemap et robots.txt ; images ; mentions légales ; encart d'inscription absent ;
  - pages de contenu sans requête vers un autre site ni script ;
  - message du PDF protégé ; sources du CPE dans le rapport.

**Captures relues** (1280 et 390 px, script hors dépôt ; encart vu sur une construction temporaire avec une fausse adresse). Défauts corrigés :

- extrait du rapport décalé par la marge par défaut de `figure` ;
- listes trop indentées ;
- 17 liens soulignés dans « Ce que l'outil vérifie » (remplacés par une liste simple et un seul lien) ;
- sources du CPE répétées sous 9 règles (regroupées dans la section CPE) ;
- panneaux deux fois plus larges que leur texte (colonne de document de 48 rem) ;
- espaces perdues avant les liens (« selonsa politique ») ;
- titre de l'image de partage avec un mot orphelin ;
- mentions légales en une seule colonne trop longue (passées sur deux colonnes) ;
- espaces ordinaires entre nombre et unité dans trois libellés.

**Autres**

- Boutons et texte masqué (`.v-bouton`, `.v-visuellement-cache`) déplacés dans `base.css` pour servir à toutes les pages.
- Token `--text-heading-md` (24 px, taille de DESIGN.md) pour les titres de section.

## Identité visuelle : terminée

Kit d'IDENTITE.md intégré. Le site reste en thème clair en V1.

**Fichiers**

- `IDENTITE.md` à la racine.
- `public/brand/` : logos clair, sombre et empilés, icônes.
- `public/` : `favicon.svg` (suit le thème du navigateur), `favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `site.webmanifest`, `og-image.png`.
- Supprimés : les images provisoires (`og.png`, `favicon-32.png`) et `outils/generer-images.mjs`.

**CLAUDE.md**

- Section « Identité » d'IDENTITE.md, avec la ligne « V1 en thème clair ».
- `IDENTITE.md` ajouté aux documents à lire.
- L'accent de la marque remplace le bleu de DESIGN.md.

**En-tête et `<head>`** (`Base.astro`, `site.ts`)

- `logo-clair.svg` dans l'en-tête, 32 px de haut (134 px de large, au-dessus du minimum de 120 px). Sur mobile, la navigation passe sous le logo. Le logo figure aussi sur le rapport imprimé.
- Balises d'IDENTITE.md :
  - favicons ICO et SVG, icône Apple, manifeste ;
  - `og:image` vers `og-image.png` avec son texte alternatif ;
  - `theme-color` `#FBFAF7` ;
  - en plus, `<meta name="color-scheme" content="only light">`.
- `SITE.domaineDefinitif = false` : le domaine figure parmi les champs à compléter, et les mentions légales l'affichent « à compléter ». L'adresse provisoire reste dans `SITE.url`, car les adresses absolues en ont besoin d'une valide.

**Couleurs** (`tokens.css`, `base.css`)

| Usage | Couleur | Contraste |
| --- | --- | --- |
| Accent (boutons, liens, focus, étapes, cases, progression) | bleu encre `#1E4A9A` | texte blanc 8,4:1 ; liens 7,7:1 sur le papier |
| Survol du bouton principal et des liens | `#183B7B` | — |
| Bouton secondaire | teinte `#E8EEF8`, survol `#D9E3F3` | — |
| Anneau de focus | 2 px blancs puis 2 px de bleu encre | 7,7:1 sur le papier |

- Les liens survolés ont aussi un soulignement de 2 px.
- `color-scheme: only light` : listes, cases et barres de défilement restent claires quand l'ordinateur est en mode sombre.

**Tests**

- **Vitest** :
  - contrastes (survols, focus, bleu encre, thème clair) ;
  - logo d'au moins 120 px ;
  - domaine à compléter.
- **Playwright** :
  - pour chaque page : logo clair, nom accessible « Au propre », largeur d'au moins 120 px, balises d'IDENTITE.md ;
  - fichiers du kit servis ;
  - survol et focus du bouton principal ;
  - en mode sombre (6 pages et le rapport) : fond papier, cartes blanches, logo clair, `color-scheme` clair.

**Captures** (1280 et 390 px, clair et sombre, toutes les pages, découpage, rapport, impression)

- 14 paires sur 16 sont identiques au pixel près entre clair et sombre. Les deux autres :
  - le rapport, dont l'heure « Vérifié le » avait changé d'une minute ;
  - l'accueil, au premier rendu (lissage du texte) : identique à l'œil, et au pixel près sur une capture refaite à part.
- Défaut corrigé : l'anneau de focus des liens de navigation collait au texte. Ajout d'une marge intérieure compensée, sans décalage.

## Refonte de l'accueil : terminée

Validée par l'éditeur le 31 octobre 2026 : variante B avec le titre de A, telle qu'elle est en ligne. Accueil refait d'après DESIGN.md et les captures de référence (pages de Notion, gardées en local dans `docs/design/`, hors du dépôt). L'échelle a ensuite été étendue au reste du site (voir « Échelle étendue au site »).

**Deux variantes comparées** (pages temporaires `src/pages/essais/accueil-a/` et `accueil-b/`, non indexées, supprimées après la validation avec `HeroA.astro` ; `HeroB.astro` est devenu `Hero.astro`)

- **A, « fenêtre sous le titre »** : titre de 64 px, rapport complet juste sous le hero.
- **B, « panneau papier »** : titre de 56 px, rapport dans un panneau papier coupé en bas.
- **B retenue, avec le titre de A** (choix de l'éditeur, qui hésitait entre les deux) :
  - page plus courte (2 545 px contre 3 182 sur ordinateur, 2 677 contre 4 119 sur mobile) ;
  - 2 sources visibles dans l'aperçu au lieu de 8 ;
  - sur mobile, l'aperçu A occupait 1 700 px à lui seul ;
  - le panneau sépare le hero du produit sans ajouter de texte.
- Captures dans `test-results/accueil/` (ignoré par Git).

**Page**

- **Hero centré** :
  - titre « Vérifiez votre dossier RAEP avant de le déposer » (8 mots, 56 px, interligne 1,15) : il dit quoi faire et quand ;
  - accroche de 600 px de large sur 2 lignes ;
  - bouton ;
  - dessous : date limite et « Gratuit, sans compte. Votre fichier reste sur votre ordinateur. »
- **Aperçu du rapport** (`ApercuRapport.tsx`), rendu au build avec les vrais composants : `CompteursRapport` et `GroupeRapport`, extraits de `Rapport.tsx` dans `PartiesRapport.tsx`. Données d'exemple (`src/content/apercu.fr.ts`) : R02 à corriger, R10 à vérifier, 3 conformes, sur un dossier fictif annoncé comme tel.
- **Un seul chiffre sourcé** : « En 2026, 8 % des dossiers RAEP du CPE interne ont été écartés pour leur forme. » Source en petit gris. Les autres sources restent sur `/regles/`.
- **Puis** : « Comment ça marche » en 3 étapes, « Votre fichier reste sur votre ordinateur », « La forme, pas le fond ». En fin de page, « Le dépôt ferme le 3 décembre à 23 h 59 » et le bouton : l'ancien titre de fin répétait le titre principal.

**Échelle** (`tokens.css`, `--echelle-*`, `accueil.css`)

| Mesure | Ordinateur | Mobile |
| --- | --- | --- |
| Tailles de texte | 14, 16, 20, 32 et 56 px | 14, 16, 20, 24 et 36 px |
| Largeur du texte | 680 px (paragraphes limités à 32 em depuis l'extension de l'échelle) | — |
| Écart entre sections | 112 px | 96 px |

- Fond blanc (`Base.astro`, prop `fond="blanc"`) ; le pied de page garde le papier sur toute la largeur. *Remplacé le 31/10 par le papier `#FBFAF7` sur tout le site (« Un site plus chaleureux »).*
- Logo à 32 px. *Remplacé le 31/10 : 36 px.*

**Tests**

- `tests/e2e/accueil.spec.ts` mesure les contraintes sur ordinateur et mobile : tailles, mots du titre, lignes et largeur de l'accroche, largeur du texte, écarts, fond, logo, source unique, aperçu.
- `tests/content/apercu.test.ts` : compteurs 1, 1, 3 ; sources ; typographie.
- 506 tests Vitest ; 167 tests Playwright passent, 4 ignorés exprès en mobile.

**Défauts corrigés après les captures**

- Accroche décalée à gauche et collée au titre (une règle plus spécifique annulait sa marge).
- Accroche trop large : 749 px avec `60ch`, ramenée à 600 px.
- Coupe de l'aperçu juste sous un titre de groupe (déplacée au milieu d'une carte).
- Titre coupé au mauvais endroit sur mobile (36 px et espaces insécables).
- Mot « ordinateur. » seul sur sa ligne sous le bouton : sur mobile, « Votre fichier reste sur votre ordinateur. » passe désormais entière à la ligne.

**Écarts et limites**

- **Fond blanc** : DESIGN.md demande le papier ; le fond blanc est demandé et suit les références. *Remplacé le 31/10 : papier sur tout le site.*
- **Logo** : 32 px et non 28, car à 28 px il ne mesurerait que 117 px de large, sous le minimum de 120 px d'IDENTITE.md. *Remplacé le 31/10 : 36 px.*
- **Accroche** : 3 lignes sur mobile (un écran de 390 px ne contient pas 60 caractères en 20 px).
- **Chiffre sourcé** : sur une ligne à partir d'environ 900 px de large.

## Un site plus chaleureux : terminé

Titres à empattements, encre et papier, logo plus grand, zones en faute surlignées dans le rapport, exemple présenté comme une feuille, résumé resserré. Appliqué à tout le site.

**Titres** (`Base.astro`, `base.css`, `--font-titres`)

- h1 et h2 en Source Serif 4 semi-gras, la police du logo, avec une approche de −0,01 em.
- Paquet `@fontsource/source-serif-4` 5.3.1 (OFL-1.1, exception ajoutée à la règle 6 de CLAUDE.md). Seul le fichier latin en 600 est chargé, servi par le site.
- Le texte courant, les h3 et l'interface gardent la police actuelle.

**Couleurs** (`tokens.css`)

| Usage | Avant | Après | Contraste |
| --- | --- | --- | --- |
| Texte (encre) | `#000` | `#37352F` | 11,7:1 sur le papier |
| Fond (papier), tout le site | blanc (accueil), `#f6f5f4` (autres pages) | `#FBFAF7` | — |
| Panneau de l'exemple | `#f6f5f4` | `#F2F5FB` (bleu très pâle) | AA vérifié pour le texte, le texte secondaire et l'accent |
| Surligneur | — | `#FFF1A8`, contour `#A07F00` | contour 3,8:1 sur la page blanche |

- Les cartes restent blanches ; l'impression reste en noir sur blanc.
- La prop `fond="blanc"` de `Base.astro` et le pied de page papier propre à l'accueil sont supprimés.

**Logo** : 36 px de haut (151 px de large).

**Zones en faute surlignées, dans le vrai rapport**

- `ResultatRegle.zones` (facultatif) : `ZoneEnFaute` en points, avec la taille de la page (`types.ts`, CLAUDE.md). Helpers `zoneEnFaute` et `englobant` dans `rules/commun.ts`.
- Zones calculées, sans changement de gravité ni de texte :

  | Règle | Zone |
  | --- | --- |
  | R08 | Bande de marge occupée par le texte, à gauche et à droite |
  | R09 | Blocs trop proches du bord |
  | R10 | Espace de chaque retrait |
  | R13 | Blocs en couleur |

- `Controle.tsx` : ligne « Aperçu » avec la miniature de la première page concernée (200 px, 160 sur mobile), les zones posées en pourcentage (jaune en `multiply`, contour) et la légende « Page 2 : zone en faute surlignée. »
- Les miniatures passent de `Verificateur` à `Rapport`, puis `GroupeRapport` et `Controle`. Sans miniature (pas d'OffscreenCanvas), il n'y a pas d'aperçu. L'aperçu est imprimé en 3,5 cm, jaune conservé.

**Exemple de l'accueil**

- L'erreur est R08, identique au résultat réel sur la fixture `04_marges_2cm_word`, zones de la page 2 comprises (vérifié par `tests/content/apercu.test.ts`).
- Miniature `public/exemple/page-2.png` produite par le vrai pipeline (`outils/miniature-exemple.mjs`).
- La feuille remplace la fenêtre : coin supérieur droit corné (découpe et pli, ombre qui suit la découpe), trait de marge bleu encre de 2 px, en-tête « Rapport de vérification » et nom du fichier.
- Panneau coupé après la carte R08 : à 1 040 px sur ordinateur (dans la carte R10), à 1 200 px sur mobile. Le test vérifie que la miniature est visible en entier.

**Résumé** : chaque chiffre est collé à son libellé (« 1 point à corriger »), dans le rapport et l'exemple.

**Tests**

- 519 tests Vitest :
  - zones de R08 (fixture 04), R09, R10 et R13, absentes des résultats conformes ;
  - rendu de l'aperçu dans `Controle` ;
  - exemple identique au réel ;
  - contrastes (encre, papier, panneau, contour jaune).
- 176 tests Playwright passent, 4 ignorés exprès en mobile :
  - miniature et zones de R08 dans le rapport de la fixture 04 ;
  - feuille, panneau et polices de l'accueil ;
  - fond papier partout, y compris en mode sombre.
- Toujours 5 tailles de texte par écran sur l'accueil.

**Captures relues** (`test-results/accueil/`, `test-results/rapport/`) : accueil sur ordinateur et mobile, page des règles, rapport réel et impression.

## Échelle étendue au site : terminée

L'échelle de l'accueil s'applique désormais aux pages des règles, de confidentialité, des mentions légales, à la 404 et au vérificateur.

**Échelle** (`tokens.css`)

| Rôle | Ordinateur | Mobile | Token |
| --- | --- | --- | --- |
| Titre de page (h1) | 56 px | 36 px | `--echelle-titre` |
| Titre de section (h2) | 32 px | 24 px | `--echelle-section` |
| Chapo, titres des groupes du rapport, compteurs | 20 px | 20 px | `--echelle-accroche` |
| Texte courant | 16 px | 16 px | `--echelle-texte` |
| Petit texte | 14 px | 14 px | `--echelle-petit` |

- Cinq tailles par écran, mesurées sur chaque page et à chaque étape du vérificateur. Disparaissent : 12 px (numéros des étapes et des aperçus, passés en 14), 22 px (titres d'étape, compteurs), 40 et 30 px (anciens h1), 24 px sur ordinateur.
- Colonne de 680 px centrée (`--mesure-texte`) : `.p-page--document` et `.v-page`.
- **Paragraphes de moins de 80 caractères** : `--measure` passe de `68ch` à `32em` (512 px en 16 px). `68ch` donnait jusqu'à 103 caractères par ligne, car 1ch est la largeur du chiffre 0. La limite est posée sur les éléments de texte (paragraphes, valeurs, libellés), plus sur leurs conteneurs. Ainsi, le petit texte (14 px) a sa propre limite de 448 px. Ligne la plus longue mesurée : 77 caractères.
- Écarts : 112 px entre les sections, 96 sur mobile (`--ecart-sections`) ; 64 px entre l'en-tête et le titre, 36 sur mobile (`--ecart-haut`). Dans le vérificateur, l'outil suit le chapo à 64 px (36 sur mobile), comme l'aperçu sous le hero ; l'inscription est à 112 px du rapport.
- **Vérificateur dans la colonne de 680 px** : le rapport tenait déjà dans environ 600 px ; le découpage montre 3 aperçus par ligne au lieu de 5. Sur mobile, le chapo reste en 16 px pour garder le formulaire dans le premier écran.
- À l'impression, la colonne et la longueur de ligne sont levées : le rapport occupe toute la largeur de la feuille.

**Ménage**

- Supprimés : `src/pages/essais/`, `HeroA.astro`, les classes `.accueil--b` et `.accueil-hero--b`. `HeroB.astro` devient `Hero.astro` ; `--echelle-titre` vaut 56 et 36 px dans `tokens.css`.
- Retiré de `pages.css` : les styles de l'ancien accueil (`p-accueil__*`, `p-faits`, `p-etapes`, `p-extrait`, `p-controles`, `p-h2`). Le bloc de boutons de la 404 devient `.p-actions`.

**Tests**

- `tests/e2e/echelle.spec.ts` (18 tests sur Chromium, Firefox et mobile). Il vérifie sur chaque page et à chaque étape du vérificateur :
  - 5 tailles au plus, toutes dans l'échelle ;
  - h1 et h2 aux tailles prévues ;
  - colonne de 680 px ;
  - 112 ou 96 px entre les sections ;
  - aucune ligne de 80 caractères ou plus, accueil compris.
- 519 tests Vitest ; 194 tests Playwright passent, 4 ignorés exprès en mobile.

**Captures relues** (1280 et 390 px, toutes les pages, découpage et rapport). Défauts corrigés :

- Ligne de 82 caractères dans la checklist : le libellé, élément en ligne, ignorait la limite (passé en bloc).
- Premier écran mobile du vérificateur sans le choix de la discipline : chapo de 6 lignes en 20 px (ramené à 16 px sur mobile).
- 79 caractères sur l'accueil avec une limite de 32,5 em, trop près de 80 (limite ramenée à 32 em).

**Limites connues**

- En 56 px dans 680 px, le titre du vérificateur tient sur 2 lignes et celui des règles sur 3.
- Dans les contrôles conformes du rapport, les sources passent souvent sur 2 lignes (448 px en 14 px).

## Étape 6 : codée, mise en ligne en attente

Mise en ligne sur https://au-propre.fr, sur Cloudflare Workers. Le code et les tests sont faits ; les réglages à faire à la main et les vérifications en ligne sont dans `docs/LANCEMENT.md`.

**Déploiement** (`wrangler.jsonc`, `.github/workflows/deploiement.yml`)

- Worker sans script, assets statiques de `dist/` :
  - page 404 servie avec le statut 404 (`not_found_handling: "404-page"`) ;
  - `/regles` redirigé vers `/regles/` (`html_handling: "auto-trailing-slash"`) ;
  - ni sous-domaine workers.dev (qui porte le nom du compte) ni adresses d'aperçu.
- GitHub Actions, sur Ubuntu 24.04 et Node 24 (`.node-version`) :
  - `build` : `astro check`, construction, contrôle du site livré, `dist/` publié comme artefact ;
  - `vitest` ;
  - `playwright` : Chromium, Firefox, WebKit et mobile, dans l'image officielle `mcr.microsoft.com/playwright:v1.52.0-noble` (navigateurs déjà installés, aucun `playwright install`), sur le même `dist/` ;
  - `deploiement` : seulement sur `main`, si tout est vert ; `wrangler deploy` (wrangler 4.156.0, épinglé) ;
  - `production` : `npm run test:prod` après le déploiement, si la variable `PRODUCTION_ACTIVE` vaut `true`.
- Actions épinglées par empreinte de commit ; droits du jeton GitHub limités à la lecture.
- `playwright.config.ts` : projet `webkit` en CI seulement ; en CI, le serveur des tests sert le `dist/` fourni sans le reconstruire.

**Identité définitive** (`src/content/site.ts`)

- `url: 'https://au-propre.fr'`, `domaineDefinitif: true` ; `champsACompleter()` renvoie une liste vide (vérifié par un test).
- Éditeur : « Particulier, à titre non professionnel », anonyme selon l'article 1-1, II de la LCEN (créé par la loi n° 2024-449, art. 48 ; texte relu sur Légifrance). Plus de nom ni de directeur de la publication.
- Contact : contact@au-propre.fr. Formulaire Brevo renseigné : l'encart et la section de la politique de confidentialité s'affichent.
- Hébergeur : raison sociale, adresse et téléphone repris de la politique de confidentialité de Cloudflare (version du 4 novembre 2025), source affichée sous le bloc.

**Pages**

- Mentions légales : ligne « Anonymat » avec le lien vers la LCEN, plus de directeur de la publication, source de l'hébergeur. Page en `noindex`, sans canonique, retirée du sitemap (`PAGES_DU_SITE.mentionsLegales.indexer`, `estIndexee()`). robots.txt ne la bloque pas, pour que le `noindex` soit lu.
- Confidentialité :
  - « Si vous nous écrivez » : routage d'e-mails de Cloudflare, boîte Gmail, réponses par Brevo, conservation de 12 mois au plus après le dernier échange, serveurs hors de l'UE ;
  - « Statistiques de fréquentation » : affichée seulement quand le jeton de la balise est renseigné. Sans cookie ni stockage, d'après la page Web Analytics de Cloudflare citée ; aucune statistique sur le vérificateur.

**Statistiques** : Cloudflare Web Analytics, balise ajoutée par `Base.astro` sur toutes les pages sauf `/verifier/` (prop `statistiques={false}`), seulement si `SITE.statistiques.jeton` est renseigné.

**En-têtes**

- Politique de sécurité du contenu native d'Astro 7 (`security.csp`, sans dépendance) : balise meta avec les empreintes des scripts et styles d'Astro. `script-src 'self'` et le script de Cloudflare ; `connect-src 'self' https://cloudflareinsights.com` ; `img-src` avec `blob:` pour les aperçus ; `style-src-attr 'unsafe-inline'` pour les zones surlignées de l'accueil ; `object-src 'none'`.
- `public/_headers` : `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, HSTS d'un an (sans `includeSubDomains` ni `preload`), cache immuable sur `/_astro/*`.
- Le commentaire HTML du thème clair n'est plus livré.

**Site livré** : `outils/verifier-livraison.mjs` (`npm run verifier:livraison`, lancé par la CI) échoue sur :

- une balise `author` ou `generator`, un commentaire HTML autre que les marqueurs vides d'Astro ;
- une clé inattendue dans le manifeste, des métadonnées dans un PNG ou un SVG ;
- « à compléter », une adresse provisoire, l'ancien nom du projet.

En local, il cherche aussi les noms lus dans `git config`, le compte de l'ordinateur et `NOMS_INTERDITS`, sans jamais les écrire. Le site livré n'en contient aucun.

**Anciens noms** : le dépôt distant pointe sur `au-propre.git` ; plus aucune mention de l'adresse provisoire ni de l'ancien nom dans les fichiers suivis.

**Tests**

- Vitest (523) : identité définitive, éditeur anonyme, hébergeur sourcé, pages indexées, jeton de statistiques.
- Playwright (209 en local, 4 ignorés exprès en mobile) :
  - `securite.spec.ts` : aucune violation de la politique sur chaque page, pendant le parcours complet et à l'impression ; un script en ligne imprévu et un `fetch` vers un autre site sont bloqués et signalés ;
  - `reseau.spec.ts` : sur les pages de contenu, seule la balise de statistiques vient d'ailleurs ; aucun script tiers sur le vérificateur ;
  - `pages.spec.ts` : `noindex` des mentions légales, sitemap, LCEN, contact, sections de la politique de confidentialité.
  - Branche « statistiques actives » vérifiée avec un faux jeton temporaire : balise présente partout sauf sur `/verifier/`, aucune violation.
- Production (`tests/production/production.spec.ts`, 11 tests, Chromium et Firefox) :
  - aucun `Set-Cookie` sur les pages, la 404, les fichiers, le sitemap et les redirections, et aucun cookie dans le navigateur après un parcours ;
  - vraie 404 ; `/_headers` non servi ;
  - redirections (barre finale, https, www vers le domaine) ; sitemap et robots ;
  - en-têtes de sécurité ;
  - aucun script `/cdn-cgi/` injecté, lien `mailto:` intact ;
  - vraie balise de statistiques sans violation ni cookie ;
  - analyse de 01 et 04 sans aucune requête hors du domaine ; impression.
  - La partie navigateur a été essayée sur le site servi en local ; le reste attend le domaine.

**Captures relues** (mentions légales, confidentialité, 1280 et 390 px). Défaut corrigé : le « er » en exposant de « 1er novembre » créait une sixième taille de texte (11,7 px), relevée par `echelle.spec.ts`.

### Avant la mise en ligne (11 novembre)

Lancement visé sous 48 heures : pas de formulaire natif, le lien vers le formulaire hébergé par Brevo reste.

**Rappel et nouveautés par e-mail**

- Le formulaire Brevo a deux listes : « Rappel 3 décembre » et « Nouveautés Au propre ».
- L'encart « Recevez un rappel avant la clôture », juste après le rapport (après la checklist), annonce :
  - la clôture du dépôt, tirée de `src/content/session.ts`, nouvelle configuration de la session ;
  - en option, les nouveautés d'Au propre, dont un guide pour préparer l'oral envoyé en janvier.
- Bouton « M’inscrire au rappel ».
- Version compacte sur la page des règles, sous « En bref » (`InscriptionCompacte.astro`) : mêmes textes, même lien sans référent.
- L'annonce de la relecture critique payante a disparu de l'encart.

**Politique de confidentialité**, section « Inscription facultative par e-mail » :

- finalités : rappel avant la date limite et, si la personne l'a choisi, nouveautés ;
- base légale : consentement ;
- conservation : jusqu'à la désinscription, et au plus 3 ans après le dernier contact actif. Une simple ouverture d'e-mail ne compte pas, d'après le référentiel de la CNIL sur la gestion des activités commerciales, cité en lien et relu le 11/11 ;
- désinscription en un clic dans chaque e-mail ;
- la promesse « un seul e-mail, puis suppression » est retirée du site et de SPEC §4.5.

**Robuste sans les réglages de la zone**, introuvables dans le tableau de bord :

- `AdresseEmail.astro` entoure chaque adresse de `<!--email_off-->` et `<!--/email_off-->`, qu'Astro conserve au build (vérifié dans `dist/`). `verifier-livraison.mjs` refuse toute adresse e-mail hors de ces balises dans le `<body>`, essai négatif fait.
- Le texte de robots.txt est défini par `texteRobots()` (`site.ts`). Le test de production vérifie que Cloudflare le sert à l'identique.
- Le test de production des e-mails vérifie que l'adresse de contact est en clair, sans adresse masquée ni script `email-decode`.
- Le test des redirections vérifie que http vers https fonctionne sur la racine et avec une chaîne de requête. La règle de redirection est décrite dans `docs/LANCEMENT.md`.

**Accueil**

- Le bénéfice d'abord : « Vérifiez votre dossier RAEP en une minute », puis « Dès le brouillon, voyez s’il respecte les règles de forme du jury et ce qu’il faut corriger. »
- Confidentialité en langage courant : « Votre dossier reste sur votre ordinateur : il n’est ni envoyé ni conservé. » Le mot « navigateur » est absent de l'accueil, ce qu'un test vérifie.
- La mention « aucune mesure d’audience » est retirée : elle deviendra fausse avec Web Analytics.
- Sous le bouton, une ligne par information (la phrase dépassait 80 caractères).

**LANCEMENT.md** :

- étapes 1 à 8 cochées ;
- réglages de la zone devenus facultatifs ;
- deux règles de redirection, http vers https et www vers le domaine ;
- nouvelle section « Après le lancement » :
  - campagne de rappel du 1er décembre ;
  - guide de l'oral en janvier ;
  - formulaire natif ;
  - renouvellement du jeton Cloudflare avant le 30 juin 2027.

**Tests** :

- Vitest : 527 tests. Nouveaux :
  - date de clôture tirée de la session ;
  - aucune promesse d'un seul e-mail ;
  - source CNIL ;
  - texte de robots.txt.
- Playwright : 215 tests passent, 4 ignorés exprès en mobile. Nouveaux :
  - encart juste après le rapport ;
  - version compacte de la page des règles ;
  - section d'inscription de la politique de confidentialité ;
  - adresses protégées dans le HTML ;
  - accueil.
- Production : 12 tests.

**Décisions de l'éditeur, le même jour**

- Mise à jour de SPEC §4.5 et de CLAUDE.md : validée. « En une minute » : validé.
- Web Analytics :
  - jeton de la balise renseigné (`SITE.statistiques.jeton`) ;
  - la balise s'ajoute à toutes les pages sauf `/verifier/` ;
  - la section « Statistiques de fréquentation » de la politique de confidentialité s'affiche.
- Rappel automatique :
  - `SESSION.rappel` (`src/content/session.ts`) vaut le 1er décembre 2026 à 18 h, heure de Paris, date d'envoi du rappel ;
  - à partir de cette heure, l'encart ne propose plus que les nouveautés (« Recevez les nouveautés d’Au propre », guide de l'oral), avec le bouton « M’inscrire » ;
  - sous le rapport, le texte suit l'heure de l'ordinateur (`textesInscription()`) ;
  - sur la page des règles, les deux variantes sont dans la page et un petit script, livré depuis le site, choisit la bonne ;
  - aucun déploiement n'est nécessaire ;
  - tests : Vitest à la seconde près, Playwright avec une horloge fixée avant et après l'envoi.
- Bot Fight Mode : le test de production tranchera.

**Safari 18 : la lecture du PDF échouait** (trouvé par le premier passage de WebKit en CI)

- Les 25 tests WebKit qui lisent un PDF échouaient : « La lecture du PDF a échoué ». Le déploiement a été bloqué, comme prévu.
- Diagnostic : la cause d'un échec inattendu est désormais écrite dans la console (`diagnostic`, jamais affiché ni envoyé). Une branche temporaire a lancé un seul test WebKit en CI : `TypeError: undefined is not a function (near '...e of t...')`.
- Cause : pdf.js 6 parcourt des `ReadableStream` avec `for await` :
  - pour lire le texte (`getTextContent`) ;
  - pour décompresser certains flux.
  
  Safari 18.4 ne le permet pas, et le build « legacy » de pdf.js ne le complète pas. Les autres fonctions récentes absentes de Safari 18.4 (`Map.prototype.getOrInsertComputed`, `Math.sumPrecise`) sont bien complétées par core-js dans le build.
- Correction : `src/checker/flux-iterables.ts` ajoute cet itérateur dans le Worker, seulement s'il manque. Il est testé sur un flux sans itérateur, comme dans Safari.
- Sans le premier passage de WebKit, le vérificateur n'aurait pas fonctionné dans Safari 18 et antérieurs (Mac, iPhone).

**En ligne** (étapes 18 à 21 faites par l'éditeur)

- `curl -sI` :
  - en-têtes de sécurité présents ;
  - http vers https et www vers le domaine en 301, chaîne de requête conservée ;
  - `/regles` vers `/regles/` en 307 ;
  - vraie 404 ;
  - aucun `Set-Cookie`.
- `npm run test:prod` : 22 tests sur 24 passent. Bot Fight Mode ne pose pas de cookie, robots.txt est intact et l'adresse e-mail est en clair.
- Les 2 échecs viennent de la configuration automatique de Web Analytics : Cloudflare ajoutait sa balise (`beacon.min.js/v…`) à toutes les pages, vérificateur compris. Elle n'était visible qu'avec l'en-tête Accept d'un navigateur ; le test du HTML ne l'envoyait pas.
- Corrections :
  - `script-src` n'autorise plus que le fichier exact de notre balise (doc de Web Analytics) : une balise ajoutée est bloquée, vérificateur compris. Un test e2e le montre.
  - Les tests de production envoient l'en-tête Accept d'un navigateur.
  - L'éditeur passe Web Analytics en « Enable with JS Snippet installation ».

## Décisions prises

| Date | Décision | Raison |
| --- | --- | --- |
| 30/10/2026 | Gravité `bloquant` ajoutée et `source` remplacé par `sources[]` dans `ResultatRegle` (CLAUDE.md mis à jour) | SPEC classe R00 « Bloquant » sans source, et R02 à R11 citent deux sources (S1, S2). Un scan n'enfreint aucune règle : R00 affiche « Analyse impossible », pas une erreur |
| 30/10/2026 | R11 : erreur pour les parties 1 et 2, avertissement pour la couverture et les annexes ; A4 paysage accepté | SPEC limite par défaut les mesures aux parties ; une annexe scannée peut avoir un autre format et la règle y est moins certaine |
| 30/10/2026 | Couleurs ajustées pour le contraste AA (vérifié par `tests/styles/contraste.test.ts`) | Voir ci-dessous |
| 30/10/2026 | Un seul accent : la palette d'accents décoratifs de DESIGN.md (corail, jaune, bleu ciel, nuit) n'est pas reprise, ni la police à empattements. *En partie remplacé le 31/10 : titres h1 et h2 en Source Serif 4* | CLAUDE.md l'emporte sur DESIGN.md |
| 30/10/2026 | Exception de licence pour des dépendances indirectes de build : sharp / libvips (LGPL-3.0, via Astro), lightningcss (MPL-2.0, via Vite), BlueOak-1.0.0, CC0-1.0 (CLAUDE.md, règle 6) | Outils exécutés au build uniquement, jamais livrés au navigateur. Le site livré ne contient que notre code, React (MIT) et pdf.js (Apache-2.0). Aucune GPL ni AGPL |
| 30/10/2026 | Node 24 LTS, installé avec nvm ; `.node-version` = 24 pour Cloudflare Pages. *Depuis le 01/11/2026, `.node-version` sert à la CI (setup-node) : le site est construit par GitHub Actions et déployé sur Workers* | Vitest 5 ne prend pas en charge Node 23. Homebrew ne peut plus compiler Node 24 sur macOS 12 ; le binaire officiel, que nvm télécharge, fonctionne |
| 30/10/2026 | Le champ `police` garde le nom PostScript sans préfixe de sous-ensemble (`LiberationSans-Bold`, `Carlito-Regular`) | Le rapprochement avec une famille (Arial, substituts) relève de R05 |
| 30/10/2026 | Aucune police web embarquée pour l'instant (pile système, Inter si installée localement). *Remplacé le 31/10 : Source Serif 4 (OFL-1.1) est servie par le site pour les titres ; le texte courant garde Inter si installée, sinon la police système* | Inter est sous OFL-1.1, licence absente de la liste de CLAUDE.md |
| 30/10/2026 | R05 : la police majoritaire décide ; toute autre police utilisée sur du texte donne un avertissement ; les polices de puces (Symbol, Wingdings, OpenSymbol…) sont ignorées ; l'italique d'Arial est accepté ; Arial Narrow et Arial Black donnent une erreur (validé) | Lecture de SPEC (« police majoritaire ») sans laisser passer un passage dans une autre police, et sans fausse alerte sur les listes à puces |
| 30/10/2026 | R05 : une police non nommée dans le PDF donne un avertissement, pas une erreur (validé) | Mesure incertaine (CLAUDE.md, règle 5) |
| 30/10/2026 | R06 : avertissement aussi pour le texte plus petit que le corps (notes, passages réduits) ; fragments de 3 caractères ou moins ignorés (exposants, appels de note, numéros) | Les jurys sanctionnent la police réduite pour gagner de la place |
| 30/10/2026 | Seuils de calibration (`measure.ts`) : retrait « récurrent » = 2 paragraphes ; texte « en couleur » si écart RVB ≥ 40 ; interligne mesuré sur au moins 5 écarts, sinon « info » ; ligne « pleine » à 80 % de la largeur (validés) | SPEC ne chiffre pas ces seuils ; les règles concernées restent en avertissement. À réviser si de vrais dossiers montrent de fausses alertes |
| 30/10/2026 | R08 et R09 mesurent tout le texte des pages des parties, en-tête et pied de page compris | Les marges et la distance au bord s'appliquent à toute la page |
| 30/10/2026 | R01 : avertissement seulement si la page 1 est sans texte, commence par « Première partie », n'a aucun mot-clé de couverture ou mentionne une autre session ; sinon info « Couverture détectée : vérifiez dans la checklist… ». Session attendue réglable (`SESSION_ATTENDUE`). Source S5 ajoutée | Sans vrai formulaire Cyclades, l'outil ne peut pas certifier la couverture ; un avertissement permanent sur un dossier conforme serait du bruit. Une couverture d'une autre année rend le dossier hors norme (S5) |
| 30/10/2026 | R14 : seulement le titre « Sommaire » ou « Table des matières », ou la forme d'une table des matières (au moins 3 lignes terminées par un numéro de page croissant, avec points de suite ou tabulation) | « Le sommaire du manuel » dans une analyse n'est pas un sommaire du dossier |
| 30/10/2026 | R15 : « CV » ou « Curriculum vitae » en titre → avertissement ; cité dans une phrase → info | « J'ai actualisé mon curriculum vitae » est légitime |
| 30/10/2026 | R16 : erreur si l'expression est un titre, figure en annexe ou ouvre un bloc ; info si elle est citée dans les parties 1 et 2 (« Mentionner une visite ou une inspection est possible… ») | Évoquer une visite-conseil dans son parcours est légitime ; joindre le rapport écarte le dossier (S9) |
| 30/10/2026 | Portée : R14 à R17 sur toutes les pages sauf la couverture ; R18 sur la partie 2 et les annexes | Les jurys relèvent CV et lettres de recommandation en annexe ; avoir enseigné l'HGGSP (partie 1) est légitime |
| 30/10/2026 | R17 : les QR codes ne sont pas détectés, et le résultat le dit | Les détecter demanderait une dépendance de décodage d'image |
| 31/10/2026 | Poids du fichier : refus au-delà de 50 Mo, information au-delà de 10 Mo, présentés comme des limites de l'outil (validé) | Aucune limite officielle n'est publiée pour le dépôt du RAEP dans Cyclades ; les 5 Mo cités en ligne concernent d'autres ministères |
| 31/10/2026 | CPE : R03 reste une erreur (6 pages confirmées par S10) ; R04 passe en avertissement avec la mention « limite non confirmée » ; R02 et R03 citent S10 pour le CPE (validé ; remplacé le même jour, voir plus bas : le rapport du jury CPE 2026 confirme la limite) | Limite des annexes du CPE non confirmée (CLAUDE.md, règle 5) |
| 31/10/2026 | Disciplines : sections ouvertes en 2027 d'après la page officielle (octobre 2026) ; CAPES sans documentation ni éducation musicale (pas de RAEP) ; CAER avec la liste du concours public ; identifiant `histoire-geographie` réservé au CAPES | R18 ne vise que le CAPES ; la page officielle ne publie pas de liste propre au CAER |
| 31/10/2026 | pdf.js « legacy » dans le navigateur (alias dans `astro.config.mjs`) | La version moderne de pdf.js 6 exige `Uint8Array.prototype.toHex` et `Map.prototype.getOrInsertComputed`, absents de navigateurs de quelques mois (Chromium 136, Safari sous macOS 12) : la lecture échouait. Même paquet, même licence |
| 31/10/2026 | Playwright épinglé en 1.52.0 (Apache-2.0, développement) | Dernière version dont les navigateurs tournent sous macOS 12. Alerte `npm audit` (GHSA-7mvr-c777-76hp) : elle ne concerne que le téléchargement des navigateurs (`playwright install`), déjà en cache ici. Ne pas lancer `playwright install` sur un réseau non fiable ; mettre à jour en changeant de machine |
| 31/10/2026 | `npm run test:e2e` = `PW_DISABLE_TS_ESM=1 playwright test`, imports en `.ts` dans `tests/e2e` | Le chargeur TypeScript de Playwright 1.52 se bloque sous Node 24 ; Node lit lui-même les fichiers .ts |
| 31/10/2026 | Serveur des tests : `astro preview --ignore-lock` | Quand Astro 7 détecte un agent (assistant de code), `astro preview` passe en arrière-plan et rend la main ; Playwright croyait à un échec et laissait un serveur orphelin |
| 31/10/2026 | Pas de test WebKit automatisé. *Remplacé le 01/11/2026 : WebKit en CI seulement, sous Linux* | Sous macOS 12, le WebKit de Playwright 1.52 refuse son protocole (« Unknown setting ») |
| 31/10/2026 | Analyse impossible (scan) affichée en style neutre, pas en erreur | Un scan n'enfreint aucune règle (décision du 30/10 sur R00) |
| 31/10/2026 | À l'impression, adresses des sources listées une fois à la fin | Répétées sous chaque contrôle, elles doublaient la longueur du rapport imprimé |
| 31/10/2026 | Liens vers les sources dans un nouvel onglet | Quitter la page ferait perdre le rapport, qui n'est enregistré nulle part |
| 31/10/2026 | Pas d'axe-core | Licence MPL-2.0, absente de la liste de CLAUDE.md ; accessibilité vérifiée par les tests clavier et focus, les contrastes et les captures |
| 31/10/2026 | Nom du produit : « Au propre », sous-titre « Vérifiez votre dossier RAEP avant le dépôt » ; domaine provisoire sur une adresse gratuite de Cloudflare ; identité centralisée dans `src/content/site.ts`. *Domaine remplacé le 01/11/2026 par au-propre.fr* | Décision de l'éditeur ; le domaine n'est pas encore réservé |
| 31/10/2026 | Inscription par e-mail : lien vers un formulaire Brevo hébergé, ouvert sans paramètre ni référent ; encart masqué tant que l'adresse est vide (non bloquant) | Rien n'est saisi ni stocké sur le site ; l'e-mail ne peut pas être lié au dossier. Clôt le point en suspens « SPEC §4.5 contre hors périmètre » (CLAUDE.md précisé) |
| 31/10/2026 | Conservation des adresses : jusqu'à l'envoi de l'annonce, puis suppression ; désinscription à tout moment. *Remplacé le 11/11/2026 : deux listes, conservation jusqu'à la désinscription et 3 ans au plus après le dernier contact actif* | Finalité unique (proposée dans le plan de l'étape 5) |
| 31/10/2026 | CPE : S10 et S11 pour R02, R03, R05 à R11 ; S11 pour R04, qui redevient une erreur ; S11 ajoutée à R15 et R16 ; R12 et R13 gardent S8 et S7 avec la mention « bonne pratique » | Le rapport du jury CPE 2026 confirme ces règles (p. 17 à 20) mais ne parle ni de pagination ni de couleur (CLAUDE.md, règle 5) |
| 31/10/2026 | Pas de police web : Inter si installée, sinon police système. *Remplacé le même jour : Source Serif 4 pour les titres (exception OFL-1.1) ; toujours pas d'Inter embarquée* | Inter est sous OFL-1.1, hors de la liste de CLAUDE.md ; aucune requête de plus |
| 31/10/2026 | pypdf (BSD-3-Clause) pour créer les fixtures protégées, outil de développement hors de `package.json` ; chiffrement RC4 128 bits | L'AES demanderait le paquet `cryptography` ; Ghostscript (AGPL) écarté |
| 31/10/2026 | « Officiel » permis quand il qualifie les textes, jamais le site ni l'outil (CLAUDE.md, règle 2 précisée) | Le titre « Les règles officielles du RAEP » est demandé par SPEC §9 |
| 31/10/2026 | Sitemap et robots.txt écrits à la main (points d'accès statiques), sans `@astrojs/sitemap` | 5 pages ; aucune dépendance de plus |
| 31/10/2026 | Accent du site : bleu encre de la marque `#1E4A9A`, survol `#183B7B`, à la place du bleu de DESIGN.md (validé) | Un seul bleu, celui du logo (IDENTITE.md) ; meilleur contraste que `#0075de` |
| 31/10/2026 | V1 en thème clair seulement : `logo-clair.svg`, `color-scheme: only light`, `theme-color` clair seul ; `logo-sombre.svg` et `#8CB4FF` gardés pour le thème sombre (validé) | Un logo sombre sur un site resté clair serait illisible ; le `theme-color` sombre teinterait la barre du navigateur au-dessus d'une page claire |
| 31/10/2026 | Logo à 32 px de haut (134 px de large). *Remplacé le même jour : 36 px (151 px de large)* | Minimum de 120 px de large fixé par IDENTITE.md |
| 31/10/2026 | `SITE.url` garde l'adresse provisoire, signalée « à compléter » par `domaineDefinitif: false`. *Remplacé le 01/11/2026 : `https://au-propre.fr`, `domaineDefinitif: true`* | Canonique, sitemap et image de partage exigent une adresse absolue valide |
| 31/10/2026 | Titres h1 et h2 en Source Serif 4 (OFL-1.1, exception à la règle 6) ; l'interdit vise la combinaison terre cuite, crème et serif, pas notre serif avec le bleu encre | Demande de l'éditeur : site trop froid ; police du logo |
| 31/10/2026 | Encre `#37352F` et papier `#FBFAF7` sur tout le site ; panneau de l'exemple `#F2F5FB` ; logo à 36 px | Couleurs d'IDENTITE.md ; contrastes AA vérifiés |
| 31/10/2026 | Jaune surligneur `#FFF1A8` : couleur fonctionnelle (zones en faute), jamais en titre ni en décoration (IDENTITE.md, CLAUDE.md) | Situer un défaut sur la page sans ajouter d'accent |
| 31/10/2026 | Les zones surlignées sont dans le vrai rapport (R08, R09, R10, R13), pas seulement dans l'exemple (validé) | L'accueil ne montre que ce que l'outil fait vraiment |
| 31/10/2026 | Tests de bout en bout sur le port 4329 (et non 4321) | `npm run dev` occupe 4321 ; Playwright réutilisait ce serveur de développement, dont la barre d'outils ajoute titres et liens, et les tests échouaient |
| 31/10/2026 | Accueil : variante B (panneau papier) avec le titre de A, fond blanc, échelle de 5 tailles par écran, chiffre sourcé unique (CPE 2026). *Validé le même jour ; fond blanc remplacé par le papier* | Plus court, moins de texte et de sources visibles, aperçu du produit dès le premier écran (voir « Refonte de l'accueil ») |
| 31/10/2026 | Échelle de l'accueil étendue à tout le site : colonne de 680 px centrée, paragraphes limités à 32 em (moins de 80 caractères), 112 px entre les sections, 96 sur mobile (validé) | 680 px en texte de 16 px donnait jusqu'à 103 caractères par ligne, contre moins de 80 demandés par CLAUDE.md. Le choix de l'éditeur garde la colonne et limite les paragraphes |
| 31/10/2026 | Vérificateur dans la même colonne de 680 px, découpage et rapport compris | Le rapport tenait déjà dans environ 600 px ; le découpage passe de 5 à 3 aperçus par ligne, sans autre changement. Pas besoin d'une colonne plus large |
| 31/10/2026 | Sur mobile, le chapo du vérificateur reste en 16 px | En 20 px (6 lignes), le premier écran ne montrait plus que le choix du concours |
| 31/10/2026 | Captures d'écran hors du dépôt (`docs/design/`, `Capture d'écran*`, `Screenshot*` dans `.gitignore`) | Dépôt public ; les références de design sont des pages de Notion |
| 01/11/2026 | Hébergement sur Cloudflare Workers (assets statiques, sans script) et non Pages ; CLAUDE.md mis à jour (validé) | La doc de Pages dit « Start new projects with Workers ». Un projet Pages en upload direct ne peut jamais être relié à Git ; un Worker peut l'être plus tard (Workers Builds). workers.dev et aperçus désactivés |
| 01/11/2026 | Jeton de déploiement limité à Account › Workers Scripts › Edit ; domaine rattaché à la main | Le jeton n'a aucun droit sur la zone ni sur le DNS |
| 01/11/2026 | wrangler en CI seulement (wrangler-action, version épinglée), absent de `package.json` | Aucune dépendance ajoutée au projet ; rien de livré au navigateur |
| 01/11/2026 | Playwright 1.52.0 en CI dans l'image officielle `v1.52.0-noble`, sur Ubuntu 24.04 épinglé | Navigateurs déjà installés : pas de téléchargement (GHSA-7mvr-c777-76hp). Même version qu'en local |
| 01/11/2026 | Cloudflare Web Analytics, balise manuelle, sur toutes les pages sauf le vérificateur (validé) | Sur la page où le PDF est lu, aucun script tiers : la promesse reste vérifiable par un test |
| 01/11/2026 | Politique de sécurité du contenu d'Astro (balise meta) et `public/_headers` | Native, sans dépendance. `connect-src` limite les requêtes au site et aux statistiques : un envoi vers un autre site est bloqué (testé) |
| 01/11/2026 | Éditeur anonyme (LCEN, art. 1-1, II), sans nom ni directeur de la publication ; mentions légales en `noindex` (validé) | Particulier éditant à titre non professionnel ; identité connue de l'hébergeur |
| 01/11/2026 | E-mails de contact conservés le temps de répondre, puis 12 mois au plus après le dernier échange (validé) | Couvre une question reposée d'une session à l'autre |
| 01/11/2026 | « 1er » sans exposant dans les dates | L'exposant ajoutait une sixième taille de texte à l'échelle |
| 11/11/2026 | Lancement sous 48 heures, sans formulaire natif : le lien vers le formulaire Brevo reste (demandé) | Le formulaire natif est reporté après le lancement (`docs/LANCEMENT.md`) |
| 11/11/2026 | Inscription en deux listes : rappel avant la clôture, nouveautés en option ; encart juste après le rapport et version compacte sur la page des règles ; SPEC §4.5 et CLAUDE.md mis à jour (demandé) | Le rappel sert le candidat avant le 3 décembre ; la liste des nouveautés prépare l'oral |
| 11/11/2026 | Adresses d'inscription conservées jusqu'à la désinscription, et au plus 3 ans après le dernier contact actif ; base légale : consentement (demandé) | Durée du référentiel de la CNIL sur la gestion des activités commerciales, cité dans la politique |
| 11/11/2026 | Date de clôture du dépôt dans `src/content/session.ts` | Une seule configuration de la session pour l'encart ; les autres mentions de la date restent à y rattacher (session 2028) |
| 11/11/2026 | Site indépendant des réglages de la zone : adresses en `<!--email_off-->`, redirection http vers https par règle, robots.txt comparé au nôtre en production (demandé) | Les réglages de la zone sont introuvables dans le tableau de bord ; l'obfuscation des e-mails est active par défaut selon la doc de Cloudflare |
| 11/11/2026 | Accueil : bénéfice d'abord, confidentialité sans le mot « navigateur » (demandé) | Langage courant pour des candidats non techniciens |
| 11/11/2026 | Après l'envoi du rappel (1er décembre 2026, 18 h), l'encart ne propose plus que les nouveautés, bouton « M’inscrire » ; changement automatique (demandé) | Une inscription tardive ne doit pas attendre un rappel déjà parti. Calculé dans le navigateur : rien à redéployer à heure fixe |
| 11/11/2026 | Complément `for await` sur `ReadableStream` dans le Worker (`flux-iterables.ts`), et cause des échecs inattendus écrite dans la console | Safari 18 ne parcourt pas les flux ; pdf.js 6 le suppose. La console reste sur l'ordinateur et aide à comprendre une erreur propre à un navigateur |
| 11/11/2026 | `script-src` limité au fichier exact `https://static.cloudflareinsights.com/beacon.min.js` ; tests de production avec l'en-tête Accept d'un navigateur | En ligne, la configuration automatique de Web Analytics ajoutait sa balise à toutes les pages, vérificateur compris, seulement pour les navigateurs. La politique la bloque désormais, quel que soit le réglage |
| 11/11/2026 | Jeton Web Analytics renseigné ; balise du site en `defer` (demandé) | Le tableau de bord propose `type="module"` : même script et même jeton, la balise déjà testée est gardée |

**Couleurs ajustées** (30/10). *En partie remplacé le 31/10 : le bleu de DESIGN.md (`#0075de`, `#005fb8`, `#e6f3fe`) a laissé la place au bleu encre `#1E4A9A` et à sa teinte `#E8EEF8`, et le fond `#f6f5f4` au papier `#FBFAF7` (voir « Identité visuelle » et « Un site plus chaleureux »). Le texte secondaire `#615d59` et les couleurs d'état restent en vigueur.*

- `#757575` (Stone) et `#0075de` (bleu) n'atteignent pas 4,5:1 sur le fond `#f6f5f4` (environ 4,2:1). Texte secondaire : `#615d59`. Liens et texte en bleu : `#005fb8`. *Liens remplacés par `#1E4A9A`.*
- Le bleu `#0075de` reste la couleur des boutons principaux : texte blanc sur bleu, 4,57:1. *Remplacé par `#1E4A9A` (8,4:1).*
- Le bouton secondaire de DESIGN.md (texte `#0075de` sur `#e6f3fe`, 4,05:1) n'est pas conforme : utiliser `--color-accent-text` sur `--color-accent-soft`. *Toujours vrai, avec les valeurs du bleu encre.*
- Couleurs d'état, absentes de DESIGN.md : erreur `#b42318` (vermillon assombri), avertissement `#8a5a00` (safran assombri), conforme `#1f7a3d` (vert ajouté, DESIGN.md n'en a pas). Chacune a un fond clair associé.

## Améliorations prévues après le lancement

- **Thème sombre complet**, selon le réglage de l'ordinateur :
  - `logo-sombre.svg` dans l'en-tête ;
  - couleurs sombres d'IDENTITE.md : fond `#191919`, feuille `#232323`, encre `#EDECE8`, accent `#8CB4FF`, lignes `#3A4A66` ;
  - `theme-color` `#191919` ;
  - couleurs d'état sombres vérifiées en AA ;
  - impression toujours en clair.

## Points en suspens

**Bloquant pour la mise en ligne** : les étapes à faire à la main après le premier déploiement, listées dans `docs/LANCEMENT.md` : domaine personnalisé, `www`, deux règles de redirection, variable `PRODUCTION_ACTIVE`. Ensuite, `npm run test:prod` au vert.

**À l'attention de l'éditeur** (non tranché par le code)

- Anonymat (article 1-1, II de la LCEN) : il suppose que l'hébergeur a reçu nom, prénoms, adresse et téléphone. Remplir le profil du compte Cloudflare (`docs/LANCEMENT.md`).
- RGPD, article 13 : il demande « l'identité et les coordonnées du responsable du traitement » dès qu'il y a collecte (e-mails de contact, inscription). L'anonymat de la LCEN couvre les mentions légales, pas forcément cette obligation. Consigne suivie : aucun nom sur le site. À faire vérifier en cas de doute.

**Non bloquant**

- Brevo : lieu d'hébergement des données non vérifié (sa politique est une page en JavaScript, illisible par l'outil) ; la page ne dit que « société française ». Le mentionner seulement avec une source.
- S10 : la page refuse la lecture automatique (403). Les sources du CPE reposent sur la décision validée et sur le rapport S11, relu.
- La date de clôture est encore écrite en dur ailleurs que dans `session.ts` : accueil, vérificateur, page des règles, checklist. À rattacher avant la session 2028.

**Fixtures à ajouter** (voir `tests/fixtures/README.md`)

- Cas limites : partie 2 sur 7 pages, annexes de 11 pages, police en 10 pt, titres en 14 pt, interligne 1,5, retrait de première ligne, texte en couleur, pied de page trop proche du bord, dossier sans pagination, puces, mot « Sommaire », URL dans le texte, export Google Docs. R03, R04, R06, R07, R09, R10, R11, R12 et R13 ne sont testées en erreur ou en avertissement que sur des documents synthétiques.
- Le vrai formulaire de couverture Cyclades 2027, pour calibrer R01 : avec lui, une couverture reconnue pourrait passer de « info » à « conforme ».
- Cas limites des règles de contenu sur de vrais PDF : sommaire généré par Word, CV ou lettre de recommandation scannés en annexe, adresses web en note de bas de page.

**Limites techniques connues**

- Couleur des blocs de texte : obtenue en alignant les opérateurs de dessin sur le texte extrait. Si l'alignement échoue, la couleur vaut `null` (R13 donne alors « info »). Validé sur les exports LibreOffice et Word.
- Un PDF partiellement scanné (quelques pages sans texte dans les parties) n'est pas encore traité : R00 ne bloque que si le document entier est sans texte, et les règles de mise en page ne disent « contrôle impossible » que si toutes les pages des parties sont sans texte.
- R16 et R15 ne lisent que le texte : un rapport ou un CV joint sous forme d'image (scan) n'est pas détecté. R17 ne détecte pas les QR codes.
- R12 ne reconnaît que les numéros en chiffres arabes, seuls ou avec « Page », « - n - », « n/N » ou « n sur N », sur la première ou la dernière ligne de la page.
- Le Worker est testé dans Chromium et Firefox par Playwright en local, et dans WebKit en CI. Safari reste à essayer à la main (OffscreenCanvas dans un Worker, glisser-déposer, impression) : `docs/LANCEMENT.md`.
- Un PDF lâché sur la page avant l'hydratation de l'îlot (connexion très lente) ouvrirait le PDF dans l'onglet ; les champs, eux, restent désactivés jusqu'à l'hydratation.
- L'absence de cookie (`Set-Cookie`, cookies du navigateur), la 404, les redirections et les en-têtes ne se vérifient qu'en ligne : `npm run test:prod`.
- Le cas « PDF protégé » est désormais testé sur une vraie fixture chiffrée en RC4 ; Word et LibreOffice chiffrent en AES, que pdf.js lit aussi.

**À vérifier dans les textes officiels** (d'après `docs/Dossier RAEP – … règles officielles,.md`)

- Sections ouvertes au CAER en 2027 (la liste du concours public est reprise).
- Arrêté d'ouverture de la session 2027, avant de figer les règles.

## Étape suivante prévue

**Fin de l'étape 6 : mise en ligne** (checklist `docs/LANCEMENT.md`)

1. Premier passage de la CI après le push du 11 novembre, avec WebKit pour la première fois, puis premier déploiement.
2. Domaine personnalisé, `www`, règles de redirection (http vers https, www vers le domaine), variable `PRODUCTION_ACTIVE`, puis `npm run test:prod`.
3. Vérifications à la main : Safari, Lighthouse, Search Console, e-mails, statistiques côté serveur.
4. Après le lancement : campagne de rappel du 1er décembre à 18 h et retrait de la liste « Rappel » du formulaire Brevo, guide de l'oral en janvier, formulaire natif, renouvellement du jeton avant le 30 juin 2027.
