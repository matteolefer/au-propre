# CLAUDE.md — RAEP Check (nom provisoire)

## Le projet en une phrase

Un outil web qui permet aux candidats des concours internes d'enseignants (CAPES, CAPLP, CAPET, leurs équivalents CAER du privé, et CPE) de vérifier que leur dossier RAEP respecte les règles officielles avant de le déposer sur Cyclades. Une V1.5 payante ajoutera une relecture critique alignée sur les critères des jurys.

**Échéance** : la session 2027 impose un dépôt au plus tard le **3 décembre 2026 à 23 h 59**. La V1 doit être en ligne vers le **10 novembre 2026**. Chaque choix technique doit servir cette date.

## Documents à lire avant toute tâche

| Fichier | Rôle |
| --- | --- |
| `docs/SPEC.md` | Source de vérité fonctionnelle : périmètre, parcours, liste des règles de conformité avec seuils, gravités et sources |
| `DESIGN.md` | Système de design (inspiration Notion) : couleurs, typographie, espacements, composants |
| `docs/Dossier RAEP – concours internes enseignants (session 2027) règles officielles,.md` | Synthèse des textes officiels et des rapports de jury, avec sources. À consulter en cas de doute sur une règle |

Si une demande contredit l'un de ces documents, le signaler avant d'agir.

## Règles absolues

1. **Le produit ne rédige jamais le dossier à la place du candidat.** Aucune génération de paragraphe, de partie, de séquence « modèle » ou d'exemple à recopier. Autorisé : vérifier, signaler, expliquer, poser des questions, et (en V1.5) proposer la correction orthographique ou syntaxique d'une phrase écrite par le candidat, acceptée phrase par phrase. Raison : plusieurs jurys 2025-2026 condamnent les dossiers rédigés par IA, et le jury de SES 2025 les élimine quand la fraude est avérée.
2. **Indépendance visible.** Le produit n'est pas affilié au ministère. Jamais de Marianne, de bleu-blanc-rouge, de reprise du design des sites de l'État (DSFR), ni des mots « officiel », « gouv » ou « ministère » dans le nom, les titres ou le logo. Le pied de page indique : « Outil indépendant, non affilié au ministère de l'Éducation nationale. »
3. **Aucune promesse de résultat.** Pas d'« admissibilité garantie » ni de formulation équivalente.
4. **Confidentialité.** En V1, l'analyse s'exécute entièrement dans le navigateur : le PDF ne quitte jamais l'ordinateur de l'utilisateur. Aucune donnée de dossier côté serveur. Aucun outil d'analyse d'audience qui capture du contenu. En V1.5, le texte n'est envoyé à l'API qu'après consentement explicite, n'est jamais stocké et n'est jamais réutilisé.
5. **Chaque contrôle cite sa règle et sa source** (URL officielle), exactement comme dans `docs/SPEC.md`. Ne jamais inventer une règle ni un seuil. Une règle incertaine ou une mesure approximative donne un **avertissement**, jamais une **erreur**.
6. **Dépendances à licence permissive uniquement** (MIT, Apache-2.0, BSD, ISC). Interdit : AGPL et GPL (par exemple PyMuPDF / MuPDF). Demander avant d'ajouter toute dépendance. Exception acceptée le 30 octobre 2026 pour des dépendances indirectes servant uniquement au build, jamais livrées au navigateur : sharp / libvips (LGPL-3.0, via Astro), lightningcss (MPL-2.0, via Vite), ainsi que BlueOak-1.0.0 et CC0-1.0.

## Stack

- **Astro** (site statique, bon référencement) avec **TypeScript strict**.
- Un **îlot React** pour le vérificateur (dépôt du fichier, découpage des parties, rapport).
- **pdfjs-dist** pour lire le PDF dans le navigateur, dans un **Web Worker** pour ne pas bloquer l'interface.
- **CSS** : variables CSS générées à partir des tokens de `DESIGN.md`. Tailwind est autorisé si sa configuration reprend ces tokens ; pas de bibliothèque de composants au style par défaut reconnaissable.
- **Tests** : Vitest pour les règles, Playwright pour un parcours de bout en bout.
- **Hébergement** : Cloudflare Pages. La V1 est 100 % statique. En V1.5 : Cloudflare Pages Functions pour Stripe et l'appel à l'API Anthropic.
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
}
```

## Méthode de travail

- Toute nouvelle fonctionnalité commence en **mode Plan** : proposer un plan court, attendre la validation, puis coder.
- Avancer par **petites étapes livrables**. Une règle = une fonction pure + ses tests + ses textes dans `content/rules.fr.ts`.
- Ne pas coder une étape qui n'a pas été demandée.
- Après chaque étape : lancer les tests, résumer ce qui a changé, proposer un message de commit.
- Si une règle de `docs/SPEC.md` est ambiguë ou techniquement peu fiable, le dire au lieu de deviner.
- Mesures PDF en **points** ; constantes et tolérances centralisées dans `measure.ts`.
- Un PDF sans couche texte (scan) ne doit pas produire de faux résultats : afficher que l'analyse est impossible et pourquoi.

## Design et ton : professionnel, jamais « site IA »

**Référence** : `DESIGN.md`, inspiré de Notion. En reprendre les tokens (couleurs, typographie, espacements, rayons, composants). Ne jamais reprendre le logo, les illustrations ni l'identité de marque de Notion.

**Public** : des enseignants, souvent contractuels, sérieux et stressés par une échéance. Le site doit inspirer la confiance d'un outil professionnel sobre, pas l'enthousiasme d'une startup IA.

**À faire**

- Une seule couleur d'accent. Les états (conforme, avertissement, erreur) utilisent des couleurs accessibles, toujours doublées d'un texte ou d'une icône : jamais la couleur seule.
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
- Accent terre cuite sur fond crème avec titre à empattements : c'est le style par défaut des pages générées. Si `DESIGN.md` laisse un choix d'accent, en prendre un autre.
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
