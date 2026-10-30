# Avancement — RAEP Check

Mis à jour le 30 octobre 2026. Objectif : V1 en ligne vers le 10 novembre 2026, dépôt des dossiers au plus tard le 3 décembre 2026 à 23 h 59.

## Étape 1 : terminée

Socle technique, extraction du PDF et cinq premières règles. Pas encore d'interface : la page d'accueil est provisoire.

**Projet**

- Astro 7 (site statique) avec un îlot React 19 prévu pour le vérificateur, TypeScript 6 en mode `strictest`, Vitest 5.
- Dépôt Git : https://github.com/matteolefer/RAEP-check (public), branche `main`.
- Commandes : `npm test`, `npm run check` (types), `npm run build`, `npm run dev`.

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

## Décisions prises

| Date | Décision | Raison |
| --- | --- | --- |
| 30/10/2026 | Gravité `bloquant` ajoutée et `source` remplacé par `sources[]` dans `ResultatRegle` (CLAUDE.md mis à jour) | SPEC classe R00 « Bloquant » sans source, et R02 à R11 citent deux sources (S1, S2). Un scan n'enfreint aucune règle : R00 affiche « Analyse impossible », pas une erreur |
| 30/10/2026 | R11 : erreur pour les parties 1 et 2, avertissement pour la couverture et les annexes ; A4 paysage accepté | SPEC limite par défaut les mesures aux parties ; une annexe scannée peut avoir un autre format et la règle y est moins certaine |
| 30/10/2026 | Couleurs ajustées pour le contraste AA (vérifié par `tests/styles/contraste.test.ts`) | Voir ci-dessous |
| 30/10/2026 | Un seul accent : la palette d'accents décoratifs de DESIGN.md (corail, jaune, bleu ciel, nuit) n'est pas reprise, ni la police à empattements | CLAUDE.md l'emporte sur DESIGN.md |
| 30/10/2026 | Exception de licence pour des dépendances indirectes de build : sharp / libvips (LGPL-3.0, via Astro), lightningcss (MPL-2.0, via Vite), BlueOak-1.0.0, CC0-1.0 (CLAUDE.md, règle 6) | Outils exécutés au build uniquement, jamais livrés au navigateur. Le site livré ne contient que notre code, React (MIT) et pdf.js (Apache-2.0). Aucune GPL ni AGPL |
| 30/10/2026 | Node 24 LTS, installé avec nvm ; `.node-version` = 24 pour Cloudflare Pages | Vitest 5 ne prend pas en charge Node 23. Homebrew ne peut plus compiler Node 24 sur macOS 12 ; le binaire officiel, que nvm télécharge, fonctionne |
| 30/10/2026 | Le champ `police` garde le nom PostScript sans préfixe de sous-ensemble (`LiberationSans-Bold`, `Carlito-Regular`) | Le rapprochement avec une famille (Arial, substituts) relève de R05 |
| 30/10/2026 | Aucune police web embarquée pour l'instant (pile système, Inter si installée localement) | Inter est sous OFL-1.1, licence absente de la liste de CLAUDE.md |
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

**Couleurs ajustées**

- `#757575` (Stone) et `#0075de` (bleu) n'atteignent pas 4,5:1 sur le fond `#f6f5f4` (environ 4,2:1). Texte secondaire : `#615d59`. Liens et texte en bleu : `#005fb8`.
- Le bleu `#0075de` reste la couleur des boutons principaux : texte blanc sur bleu, 4,57:1.
- Le bouton secondaire de DESIGN.md (texte `#0075de` sur `#e6f3fe`, 4,05:1) n'est pas conforme : utiliser `--color-accent-text` sur `--color-accent-soft`.
- Couleurs d'état, absentes de DESIGN.md : erreur `#b42318` (vermillon assombri), avertissement `#8a5a00` (safran assombri), conforme `#1f7a3d` (vert ajouté, DESIGN.md n'en a pas). Chacune a un fond clair associé.

## Points en suspens

**À décider**

- Police du site : embarquer Inter (OFL-1.1) ou rester sur la police système. À trancher à l'étape de la page d'accueil.
- Page d'essai temporaire `/essai` (dépôt d'un PDF, découpage saisi à la main, résultats bruts) pour tester les règles sur de vrais dossiers : proposée, pas encore validée.

**Fixtures à ajouter** (voir `tests/fixtures/README.md`)

- Cas limites : partie 2 sur 7 pages, annexes de 11 pages, police en 10 pt, titres en 14 pt, interligne 1,5, retrait de première ligne, texte en couleur, pied de page trop proche du bord, dossier sans pagination, puces, mot « Sommaire », URL dans le texte, export Google Docs. R03, R04, R06, R07, R09, R10, R11, R12 et R13 ne sont testées en erreur ou en avertissement que sur des documents synthétiques.
- Le vrai formulaire de couverture Cyclades 2027, pour calibrer R01 : avec lui, une couverture reconnue pourrait passer de « info » à « conforme ».
- Cas limites des règles de contenu sur de vrais PDF : sommaire généré par Word, CV ou lettre de recommandation scannés en annexe, adresses web en note de bas de page.

**Limites techniques connues**

- Couleur des blocs de texte : obtenue en alignant les opérateurs de dessin sur le texte extrait. Si l'alignement échoue, la couleur vaut `null` (R13 donne alors « info »). Validé sur les exports LibreOffice et Word.
- Un PDF partiellement scanné (quelques pages sans texte dans les parties) n'est pas encore traité : R00 ne bloque que si le document entier est sans texte, et les règles de mise en page ne disent « contrôle impossible » que si toutes les pages des parties sont sans texte.
- R16 et R15 ne lisent que le texte : un rapport ou un CV joint sous forme d'image (scan) n'est pas détecté. R17 ne détecte pas les QR codes.
- R12 ne reconnaît que les numéros en chiffres arabes, seuls ou avec « Page », « - n - », « n/N » ou « n sur N », sur la première ou la dernière ligne de la page.
- Le Worker n'est testé dans un navigateur que par un essai manuel ; le test automatisé viendra avec Playwright.
- Le build Cloudflare Pages avec Node 24 reste à vérifier au premier déploiement.

**À vérifier dans les textes officiels** (d'après `docs/Dossier RAEP – … règles officielles,.md`)

- Volume de pages du RAEP du concours interne de CPE.
- Arrêté d'ouverture de la session 2027, avant de figer les règles.

## Étape suivante prévue

**Étape 4 (à planifier en mode Plan) : l'interface complète**

- Dépôt du PDF ; choix du concours et de la discipline (liste, avec l'identifiant `histoire-geographie` attendu par R18) ; nom du fichier transmis à R19.
- `split.ts` : découpage proposé d'après les titres, puis confirmé ou corrigé par l'utilisateur ; rien n'est analysé avant la confirmation.
- `report.ts` et rapport : résumé, groupes « À corriger », « À vérifier », « Conforme », informations, sources sous chaque contrôle, checklist manuelle (SPEC §6), impression.
- Tests Playwright de bout en bout, dont le cas du message « ready » envoyé par pdf.js dans le Worker, et la vérification qu'aucune requête ne transmet le PDF.

**Ensuite**

1. Pages Accueil, Règles officielles, Confidentialité, Mentions légales.
2. Lighthouse accessibilité ≥ 95, déploiement sur Cloudflare Pages.
