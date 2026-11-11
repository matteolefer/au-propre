# CLAUDE.md — Au propre

## Le projet en une phrase

Un outil web qui permet aux candidats des concours internes d'enseignants (CAPES, CAPLP, CAPET, leurs équivalents CAER du privé, et CPE) de vérifier que leur dossier RAEP respecte les règles officielles avant de le déposer sur Cyclades. Une V1.5 payante ajoutera une relecture critique alignée sur les critères des jurys.

**Échéance** : la session 2027 impose un dépôt au plus tard le **3 décembre 2026 à 23 h 59**. La V1 doit être en ligne vers le **10 novembre 2026**. Chaque choix technique doit servir cette date.

## Documents à lire avant toute tâche

| Fichier | Rôle |
| --- | --- |
| `docs/SPEC.md` | Source de vérité fonctionnelle : périmètre, parcours, liste des règles de conformité avec seuils, gravités et sources |
| `DESIGN.md` | Système de design (inspiration Notion) : couleurs, typographie, espacements, composants |
| `docs/Dossier RAEP – concours internes enseignants (session 2027) règles officielles,.md` | Synthèse des textes officiels et des rapports de jury, avec sources. À consulter en cas de doute sur une règle |
| `docs/AVANCEMENT.md` | État du projet : étapes terminées, décisions prises, points en suspens, étape suivante prévue |
| `IDENTITE.md` | Identité visuelle : logos, couleurs de marque, règles d'usage, balises du `<head>` |

Si une demande contredit l'un de ces documents, le signaler avant d'agir.

## Règles absolues

1. **Le produit ne rédige jamais le dossier à la place du candidat.** Aucune génération de paragraphe, de partie, de séquence « modèle » ou d'exemple à recopier. Autorisé : vérifier, signaler, expliquer, poser des questions, et (en V1.5) proposer la correction orthographique ou syntaxique d'une phrase écrite par le candidat, acceptée phrase par phrase. Raison : plusieurs jurys 2025-2026 condamnent les dossiers rédigés par IA, et le jury de SES 2025 les élimine quand la fraude est avérée.
2. **Indépendance visible.** Le produit n'est pas affilié au ministère. Jamais de Marianne, de bleu-blanc-rouge, de reprise du design des sites de l'État (DSFR), ni des mots « officiel », « gouv » ou « ministère » dans le nom, les titres ou le logo. « Officiel » reste permis quand il qualifie les textes (« les règles officielles »), jamais le site ni l'outil. Le pied de page indique : « Outil indépendant, non affilié au ministère de l'Éducation nationale. »
3. **Aucune promesse de résultat.** Pas d'« admissibilité garantie » ni de formulation équivalente.
4. **Confidentialité.** En V1, l'analyse s'exécute entièrement dans le navigateur : le PDF ne quitte jamais l'ordinateur de l'utilisateur. Aucune donnée de dossier côté serveur. Aucun outil d'analyse d'audience qui capture du contenu. En V1.5, le texte n'est envoyé à l'API qu'après consentement explicite, n'est jamais stocké et n'est jamais réutilisé.
5. **Chaque contrôle cite sa règle et sa source** (URL officielle), exactement comme dans `docs/SPEC.md`. Ne jamais inventer une règle ni un seuil. Une règle incertaine ou une mesure approximative donne un **avertissement**, jamais une **erreur**.
6. **Dépendances à licence permissive uniquement** (MIT, Apache-2.0, BSD, ISC). Interdit : AGPL et GPL (par exemple PyMuPDF / MuPDF). Demander avant d'ajouter toute dépendance. Exception acceptée le 30 octobre 2026 pour des dépendances indirectes servant uniquement au build, jamais livrées au navigateur : sharp / libvips (LGPL-3.0, via Astro), lightningcss (MPL-2.0, via Vite), ainsi que BlueOak-1.0.0 et CC0-1.0. Exception acceptée le 31 octobre 2026 pour les fichiers de police de Source Serif 4 (@fontsource/source-serif-4, SIL OFL-1.1), la police du logo, utilisée pour les titres.

## Stack

- **Astro** (site statique, bon référencement) avec **TypeScript strict**.
- Un **îlot React** pour le vérificateur (dépôt du fichier, découpage des parties, rapport).
- **pdfjs-dist** pour lire le PDF dans le navigateur, dans un **Web Worker** pour ne pas bloquer l'interface.
- **CSS** : variables CSS générées à partir des tokens de `DESIGN.md`. Tailwind est autorisé si sa configuration reprend ces tokens ; pas de bibliothèque de composants au style par défaut reconnaissable.
- **Tests** : Vitest pour les règles, Playwright pour un parcours de bout en bout, et `npm run test:prod` sur le site en ligne.
- **Hébergement** : Cloudflare Workers, avec assets statiques et sans script (`wrangler.jsonc`), sur https://au-propre.fr. GitHub Actions déploie seulement si tous les tests passent (`.github/workflows/deploiement.yml`). La V1 est 100 % statique. En V1.5 : un script Worker pour Stripe et l'appel à l'API Anthropic.
- **En-têtes** : politique de sécurité du contenu produite par Astro (`security.csp`), autres en-têtes dans `public/_headers`. Toute requête vers un autre site doit y être autorisée explicitement.
- **Secrets** : uniquement en variables d'environnement. `.env` est dans `.gitignore`.

## Architecture V1

```
src/
  pages/
    index.astro               page d'accueil
    verifier.astro            le vérificateur
    regles.astro              les règles officielles, avec sources
    confidentialite.astro
    mentions-legales.astro
    404.astro
    sitemap.xml.ts, robots.txt.ts
  components/                 composants d'interface (Astro et React)
  checker/
    extract.ts                PDF → modèle de document : pages (taille), blocs de texte
                              (police, taille, position, couleur), liens, images
    measure.ts                constantes et conversions (1 cm = 28,3465 pt, tolérance 2 pt)
    split.ts                  détection proposée : couverture, partie 1, partie 2, annexes
    rules/
      R05-police-arial.ts     une règle par fichier, fonction pure
      index.ts                registre des règles
    report.ts                 agrégation et tri par gravité
  content/
    rules.fr.ts               libellés, explications, « comment corriger », sources :
                              tous les textes des règles en un seul endroit
    site.ts                   identité du site : nom, adresse, éditeur, hébergeur,
                              formulaire d'inscription, pages publiques
tests/
  fixtures/                   PDF réels exportés depuis Word ou LibreOffice
  rules/*.test.ts
```

Chaque règle renvoie des résultats de cette forme :

```ts
// « bloquant » : analyse impossible (R00, PDF sans couche texte). Ce n'est pas une erreur de conformité.
type Gravite = 'bloquant' | 'erreur' | 'avertissement' | 'conforme' | 'info';

interface ResultatRegle {
  id: string;            // ex. 'R05'
  gravite: Gravite;
  titre: string;         // ex. « La police n'est pas Arial »
  detail: string;        // ce qui a été mesuré, avec les pages concernées
  pages?: number[];
  correction: string;    // comment corriger, concrètement
  sources: { libelle: string; url: string }[]; // toutes les sources citées par SPEC ; vide pour R00
  zones?: ZoneEnFaute[]; // R08, R09, R10, R13 : où se trouve le défaut, surligné sur l'aperçu de la page
}

// En points, dans le repère des blocs, avec la taille de la page.
interface ZoneEnFaute { page: number; x: number; y: number; largeur: number; hauteur: number; largeurPage: number; hauteurPage: number }
```

## Méthode de travail

- Toute nouvelle fonctionnalité commence en **mode Plan** : proposer un plan court, attendre la validation, puis coder.
- Avancer par **petites étapes livrables**. Une règle = une fonction pure + ses tests + ses textes dans `content/rules.fr.ts`.
- Ne pas coder une étape qui n'a pas été demandée.
- Après chaque étape : lancer les tests, résumer ce qui a changé, mettre à jour `docs/AVANCEMENT.md` (ce qui est fait, décisions, points en suspens, étape suivante), proposer un message de commit.
- Si une règle de `docs/SPEC.md` est ambiguë ou techniquement peu fiable, le dire au lieu de deviner.
- Mesures PDF en **points** ; constantes et tolérances centralisées dans `measure.ts`.
- Un PDF sans couche texte (scan) ne doit pas produire de faux résultats : afficher que l'analyse est impossible et pourquoi.

## Identité

- Nom : « Au propre » (dans les phrases) ; « au propre » en minuscules dans le logo uniquement. Sous-titre : « Vérifiez votre dossier RAEP avant le dépôt ».
- Fichiers et règles : voir IDENTITE.md. Utiliser public/brand/logo-clair.svg et logo-sombre.svg selon le thème ; ne jamais redessiner ni modifier le logo.
- Couleur d'accent de la marque : bleu encre #1E4A9A (#8CB4FF en mode sombre), cohérente avec les liens ajustés pour le contraste AA.
- Le rouge et le vert sont réservés aux états du rapport (erreur, conforme).
- Titres h1 et h2 en Source Serif 4 semi-gras, la police du logo, chargée en local ; le texte courant garde la police de DESIGN.md. Texte en encre #37352F, fond papier #FBFAF7, cartes blanches.
- Jaune surligneur #FFF1A8 : couleur fonctionnelle, pas un second accent. Seulement pour situer une zone en faute sur l'aperçu d'une page du rapport, toujours avec un texte ; jamais dans les titres, jamais en décoration.
- V1 : le site reste en thème clair (`logo-clair.svg` seul, `color-scheme: only light`). `logo-sombre.svg`, `#8CB4FF` et le `theme-color` sombre attendent le thème sombre prévu après le lancement.

## Design et ton : professionnel, jamais « site IA »

**Référence** : `DESIGN.md`, inspiré de Notion. En reprendre les tokens (couleurs, typographie, espacements, rayons, composants). Exception : l'accent est le bleu encre de la marque (section « Identité »), et non le bleu de DESIGN.md. Ne jamais reprendre le logo, les illustrations ni l'identité de marque de Notion.

**Public** : des enseignants, souvent contractuels, sérieux et stressés par une échéance. Le site doit inspirer la confiance d'un outil professionnel sobre, pas l'enthousiasme d'une startup IA.

**À faire**

- Une seule couleur d'accent (le bleu encre). Le jaune surligneur est fonctionnel, pas un accent (section « Identité »). Les états (conforme, avertissement, erreur) utilisent des couleurs accessibles, toujours doublées d'un texte ou d'une icône : jamais la couleur seule.
- Une hiérarchie typographique nette, des lignes de moins de 80 caractères, de l'espace.
- L'écran le plus soigné est **le rapport de vérification** : c'est lui qui vend le produit.
- Accessibilité : contraste AA minimum, focus clavier visible, `prefers-reduced-motion` respecté, affichage correct sur mobile.
- Montrer la confiance par des faits : « Votre fichier reste sur votre ordinateur », sources officielles citées sous chaque contrôle.

**À ne jamais faire** (ce sont les signes typiques d'un site généré par IA)

- Icônes étincelles, emojis, mots « IA », « magique », « révolutionnez », « boostez » dans les titres.
- Dégradés décoratifs, verre dépoli, fonds sombres néon, ombres grises identiques sous des cartes toutes semblables.
- Grilles de cartes « fonctionnalités » avec icônes génériques. Numérotation 01 / 02 / 03 si le contenu n'est pas une vraie séquence.
- Petits libellés en MAJUSCULES espacées au-dessus de chaque titre ; un seul mot en couleur ou en italique dans le titre principal ; chaînes du type « A · B · C » ; flèche « → » ajoutée au texte des boutons.
- Animations d'apparition sur chaque section, effets au survol sur toutes les cartes.
- La combinaison accent terre cuite, fond crème et titres à empattements : c'est le style par défaut des pages générées. L'interdit vise cette combinaison, pas une serif en soi : nos titres en Source Serif 4 (la police du logo) vont avec l'accent bleu encre. Si `DESIGN.md` laisse un choix d'accent, ne jamais prendre la terre cuite.
- Faux chiffres, faux témoignages, faux logos de clients.

**Textes** (en français)

- Vouvoiement, phrases courtes, voix active, casse de phrase (pas de Majuscule À Chaque Mot).
- Dire concrètement ce que fait l'outil : « Vérifiez que votre dossier RAEP respecte les règles officielles avant le 3 décembre. »
- Un bouton porte l'action exacte : « Vérifier mon dossier », pas « Commencer ».
- Un message d'erreur dit ce qui ne va pas, où (page), comment corriger, et cite la règle avec sa source. Il ne s'excuse pas et n'est jamais vague.
- Typographie française : apostrophe ’, guillemets « », espace insécable avant ; : ! ? et dans « 23 h 59 ».
- Aucun chiffre non sourcé.

## Hors périmètre V1

Paiement, comptes utilisateurs, appel à une IA, stockage côté serveur, éditeur de texte intégré. Ne pas les préparer « au cas où » : la V1 doit rester simple.

Seule exception : l'inscription facultative par e-mail, juste après le rapport et en version compacte sur la page des règles (SPEC §4.5). Elle propose un rappel avant la clôture et, en option, les nouveautés. C'est un lien vers un formulaire hébergé par Brevo, qui s'ouvre sans paramètre ni référent. Le site ne stocke rien et l'e-mail n'est jamais lié au dossier.
