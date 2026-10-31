# Identité visuelle — Au propre

Logo : icône « copie au coin corné » (marge et coche) et nom « au propre » en Source Serif 4 semi-gras, en minuscules. Sous-titre : « Vérifiez votre dossier RAEP avant le dépôt ».

## Fichiers

| Fichier | Usage |
| --- | --- |
| `public/brand/logo-clair.svg` | Logo horizontal sur fond clair (en-tête du site, rapport imprimé, e-mails) |
| `public/brand/logo-sombre.svg` | Logo horizontal sur fond sombre (mode sombre) |
| `public/brand/logo-empile-clair.svg`, `logo-empile-sombre.svg` | Version empilée : avatars, formats carrés |
| `public/brand/icone-clair.svg`, `icone-sombre.svg` | Icône seule, grand format |
| `public/favicon.svg` | Favicon vectoriel ; suit automatiquement le thème clair ou sombre du navigateur |
| `public/favicon.ico` | Favicon de secours (16, 32 et 48 px) |
| `public/apple-touch-icon.png` | Icône d'écran d'accueil iPhone et iPad (180 × 180) |
| `public/icon-192.png`, `icon-512.png`, `site.webmanifest` | Icônes d'application (Android, raccourcis) |
| `public/og-image.png` | Image de partage sur les réseaux et messageries (1200 × 630) |

Le texte des logos est vectorisé : aucune police à charger pour les afficher.

## Couleurs

| Rôle | Clair | Sombre |
| --- | --- | --- |
| Encre (texte, contour) | `#37352F` | `#EDECE8` |
| Accent bleu encre (marge, coche, liens forts) | `#1E4A9A` | `#8CB4FF` |
| Papier (fond) | `#FBFAF7` | `#191919` (fond) / `#232323` (feuille) |
| Lignes de la feuille | `#C9D6EE` | `#3A4A66` |
| Surligneur (zone en faute dans le rapport) | `#FFF1A8`, contour `#A07F00` | à définir avec le thème sombre |

Le rouge est réservé aux erreurs et le vert à « conforme » dans le rapport : jamais en décoration, jamais dans le logo.

Le jaune surligneur est une couleur fonctionnelle, pas un second accent : il sert uniquement à situer une zone en faute sur l'aperçu d'une page du rapport (marges, en-tête et pied de page, retraits, texte en couleur), toujours accompagné d'un texte qui dit quoi et où. Jamais dans les titres, jamais en décoration, jamais dans le logo. Son contour `#A07F00` garde un contraste d'au moins 3:1 sur la page blanche.

## Typographie

- Logo : Source Serif 4 semi-gras (licence SIL OFL 1.1), déjà vectorisé dans les fichiers du logo.
- Titres du site (h1, h2) : Source Serif 4 semi-gras, chargée en local (paquet @fontsource/source-serif-4, aucune requête externe).
- Texte courant, h3 et interface : la police définie par `DESIGN.md`.
- L'interdit des titres à empattements visait la combinaison accent terre cuite et fond crème, style par défaut des pages générées ; il ne concerne pas la serif du logo avec l'accent bleu encre.

## Règles d'usage

- Espace libre autour du logo : au moins la moitié de la hauteur de l'icône.
- Taille minimale du logo horizontal : 120 px de large. En dessous, utiliser l'icône seule.
- Ne pas déformer, recolorer, ajouter d'ombre, de dégradé ou de contour au logo.
- Ne pas associer le logo au bleu-blanc-rouge, à la Marianne ou à tout code visuel de l'État.
- Écrire le nom « Au propre » dans les phrases (majuscule en début de phrase), « au propre » seulement dans le logo.

## Balises à placer dans le `<head>` de chaque page

```html
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#FBFAF7" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#191919" media="(prefers-color-scheme: dark)">
<meta property="og:site_name" content="Au propre">
<meta property="og:image" content="https://[DOMAINE]/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Au propre — Vérifiez votre dossier RAEP avant le dépôt">
<meta name="twitter:card" content="summary_large_image">
```

## Section à ajouter au CLAUDE.md

```markdown
## Identité

- Nom : « Au propre » (dans les phrases) ; « au propre » en minuscules dans le logo uniquement. Sous-titre : « Vérifiez votre dossier RAEP avant le dépôt ».
- Fichiers et règles : voir IDENTITE.md. Utiliser public/brand/logo-clair.svg et logo-sombre.svg selon le thème ; ne jamais redessiner ni modifier le logo.
- Couleur d'accent de la marque : bleu encre #1E4A9A (#8CB4FF en mode sombre), cohérente avec les liens ajustés pour le contraste AA.
- Le rouge et le vert sont réservés aux états du rapport (erreur, conforme).
```
