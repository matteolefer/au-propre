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

**Couleurs ajustées**

- `#757575` (Stone) et `#0075de` (bleu) n'atteignent pas 4,5:1 sur le fond `#f6f5f4` (environ 4,2:1). Texte secondaire : `#615d59`. Liens et texte en bleu : `#005fb8`.
- Le bleu `#0075de` reste la couleur des boutons principaux : texte blanc sur bleu, 4,57:1.
- Le bouton secondaire de DESIGN.md (texte `#0075de` sur `#e6f3fe`, 4,05:1) n'est pas conforme : utiliser `--color-accent-text` sur `--color-accent-soft`.
- Couleurs d'état, absentes de DESIGN.md : erreur `#b42318` (vermillon assombri), avertissement `#8a5a00` (safran assombri), conforme `#1f7a3d` (vert ajouté, DESIGN.md n'en a pas). Chacune a un fond clair associé.

## Points en suspens

**À décider**

- Police du site : embarquer Inter (OFL-1.1) ou rester sur la police système. À trancher à l'étape de la page d'accueil.
- Page d'essai temporaire `/essai` (dépôt d'un PDF, découpage saisi à la main, résultats bruts) pour tester l'étape 1 sur de vrais dossiers : proposée, pas encore validée.

**Fixtures à ajouter** (voir `tests/fixtures/README.md`)

- Exports Word (`*_word.pdf`) avec la vraie police Arial : nécessaires pour R05.
- Cas limites : partie 2 sur 7 pages, annexes de 11 pages, police en 10 pt, retrait de première ligne, texte en couleur, mot « Sommaire », URL dans le texte, export Google Docs. R03, R04 et R11 ne sont aujourd'hui testées en erreur que sur des documents synthétiques.
- Le vrai formulaire de couverture Cyclades 2027, pour calibrer R01.

**Limites techniques connues**

- Couleur des blocs de texte : obtenue en alignant les opérateurs de dessin sur le texte extrait. Si l'alignement échoue, la couleur vaut `null` (R13 restera donc un avertissement). Validé sur les exports LibreOffice uniquement.
- Un PDF partiellement scanné (quelques pages sans texte dans les parties) n'est pas encore traité : R00 ne bloque que si le document entier est sans texte.
- Le Worker n'est testé dans un navigateur que par un essai manuel ; le test automatisé viendra avec Playwright.
- Le build Cloudflare Pages avec Node 24 reste à vérifier au premier déploiement.

**À vérifier dans les textes officiels** (d'après `docs/Dossier RAEP – … règles officielles,.md`)

- Volume de pages du RAEP du concours interne de CPE.
- Arrêté d'ouverture de la session 2027, avant de figer les règles.

## Étape suivante prévue

**Étape 2 (proposée, à valider en mode Plan) : règles de mise en page R05 à R10**

- R05 police Arial (erreur ; avertissement pour Liberation Sans ou Arimo), R06 taille 11 pt, R07 interligne simple (avertissement), R08 marges gauche et droite de 2,5 cm, R09 en-tête et pied de page à 1,25 cm, R10 pas de retrait de paragraphe (avertissement).
- Tests attendus sur les fixtures : R05 avertissement pour 01, 02 et 04 (Liberation Sans), R05 erreur pour 03 (Carlito), R08 erreur pour 04 (marges de 2 cm), et aucune erreur pour 01.
- Seuils marqués « approximatif » dans SPEC (R07, R10) à calibrer sur les fixtures.

**Ensuite, dans l'ordre**

1. Règles de contenu R12 à R19 (pagination, couleur, sommaire, CV, lettres de recommandation, liens, HGGSP, nom du fichier) et R01 (couverture).
2. `split.ts` (découpage proposé) et `report.ts` (agrégation et tri par gravité).
3. Îlot React du vérificateur : dépôt du fichier, confirmation du découpage, rapport, checklist manuelle, impression.
4. Pages Accueil, Règles officielles, Confidentialité, Mentions légales.
5. Parcours de bout en bout avec Playwright, vérification qu'aucune requête ne transmet le PDF, Lighthouse accessibilité ≥ 95, déploiement sur Cloudflare Pages.
