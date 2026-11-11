# Lancement — Au propre

Checklist de la mise en ligne sur https://au-propre.fr (étape 6, voir `docs/AVANCEMENT.md`). Cocher au fur et à mesure, avec la date et le résultat. Le jeton d’API Cloudflare ne passe jamais par la conversation ni par le dépôt.

## 1. Avant le premier déploiement

**Cloudflare, jeton d’API** (My Profile › API Tokens › Create Token › Custom token)

- [x] Nom : `au-propre-deploiement-github`. (11/11/2026)
- [x] Permission unique : Account › Workers Scripts › Edit. Account Resources : Include › le compte. Aucune ressource de zone.
- [x] Pas de filtre d’adresse IP (celles de GitHub changent). Expiration : 30 juin 2027 (à renouveler avant : section 4).
- Si wrangler refuse une opération faute de droit, ajouter seulement la permission qu’il nomme.

**GitHub** (dépôt › Settings › Secrets and variables › Actions)

- [x] Secret `CLOUDFLARE_API_TOKEN` : le jeton, collé directement dans l’interface web. (11/11/2026)
- [x] Secret `CLOUDFLARE_ACCOUNT_ID` : Workers & Pages, colonne de droite. (11/11/2026)

**Compte Cloudflare** (condition de l’anonymat, article 1-1, II de la LCEN)

- [x] Profil du compte (facturation) rempli avec nom, prénoms, adresse et téléphone (11/11/2026). Sans ces éléments chez l’hébergeur, la mention « Ses éléments d’identification ont été communiqués à l’hébergeur » serait fausse.

**Réglages de la zone au-propre.fr** (facultatifs depuis le 11/11/2026)

Le site ne dépend plus de ces réglages, introuvables dans le tableau de bord le 11/11 :

- chaque adresse e-mail est entourée de `<!--email_off-->` et `<!--/email_off-->`, que l’obfuscation de Cloudflare respecte ([doc](https://developers.cloudflare.com/waf/tools/scrape-shield/email-address-obfuscation/)). `outils/verifier-livraison.mjs` bloque le déploiement si une adresse en sort ;
- la redirection vers https passe par une règle de redirection (section 2) ;
- les tests de production signalent ce que ces réglages changeraient : adresse masquée ou script `email-decode`, cookie, robots.txt différent du nôtre, script `/cdn-cgi/`.

S’ils sont retrouvés plus tard :

- [ ] Email Address Obfuscation (Security › Settings, d’après la doc) : peut être désactivé, sans effet sur le site.
- [ ] Always Use HTTPS (SSL/TLS › Edge Certificates) : peut être activé en plus de la règle.
- [ ] Bot Fight Mode : s’il pose le cookie `__cf_bm`, le test de production « aucun Set-Cookie » échoue ; le désactiver alors.
- [ ] Rocket Loader et Zaraz : désactivés par défaut ; un script `/cdn-cgi/` injecté ferait échouer un test de production.
- [ ] « Managed robots.txt » (AI Crawl Control) : s’il est actif, Cloudflare modifie notre robots.txt et le test de production « robots.txt identique » échoue. Le désactiver, ou accepter ses lignes et adapter le test.

**Statistiques** (Web Analytics)

- [ ] Add site `au-propre.fr`, puis Manage site › Enable with JS Snippet installation (pas la configuration automatique).
- [ ] Jeton de la balise reporté dans `SITE.statistiques.jeton` (`src/content/site.ts`). Il est public : il figure dans le HTML de chaque page.

## 2. Premier déploiement et domaine

- [ ] Commit et push sur `main` : la CI construit, teste (Vitest, Playwright sur Chromium, Firefox, WebKit, mobile) puis déploie. Le Worker `au-propre` est créé sans adresse publique (`workers_dev` et `preview_urls` désactivés).
- [ ] Workers & Pages › au-propre › Settings › Domains & Routes › Add › Custom Domain › `au-propre.fr`. L’enregistrement DNS et le certificat sont créés par Cloudflare.
- [ ] DNS › Add record : `www`, AAAA, `100::`, proxifié.
- [ ] Rules › Redirect Rules (Single Redirects), deux règles, dans cet ordre ([exemples de la doc](https://developers.cloudflare.com/rules/url-forwarding/single-redirects/examples/)) :

  | Nom de la règle | When incoming requests match | Then |
  | --- | --- | --- |
  | `HTTP vers HTTPS` | Wildcard pattern, Request URL : `http://*` | Target URL : `https://${1}` ; Status code : 301 ; Preserve query string : coché |
  | `www vers le domaine` | Wildcard pattern, Request URL : `https://www.*` | Target URL : `https://${1}` ; Status code : 301 ; Preserve query string : coché |

  `http://www.au-propre.fr/` passe par les deux : https d’abord, puis le domaine. Le test de production vérifie les deux redirections, chaîne de requête comprise, et l’arrivée sur `https://au-propre.fr/`.
- [ ] Variable GitHub `PRODUCTION_ACTIVE` = `true` (Settings › Secrets and variables › Actions › Variables) : le job « production » tourne alors après chaque déploiement.
- [ ] `npm run test:prod` en local (Chromium et Firefox) : tout au vert.
- [ ] Relancer la CI (Actions › Tests et déploiement › Run workflow) : job « production » au vert.

**Enregistrements DNS ajoutés.** Aucun enregistrement existant n’est modifié ni supprimé : MX, SPF, DKIM et DMARC (routage Cloudflare, Brevo) restent tels quels. Au 1er novembre 2026, la résolution publique ne montrait aucun enregistrement A, AAAA ou CNAME sur `au-propre.fr` ni sur `www` : rien ne bloque le domaine personnalisé.

| Nom | Type | Contenu | Créé par | Date |
| --- | --- | --- | --- | --- |
| `au-propre.fr` | Worker (domaine personnalisé) | Worker `au-propre`, proxifié | Cloudflare, au rattachement du domaine | |
| `www` | AAAA | `100::`, proxifié | à la main, pour la redirection | |
| `au-propre.fr` | TXT | `google-site-verification=…` | à la main, pour la Search Console | |

## 3. Vérifications à la main

**Safari** (le Mac, puis un iPhone ; noter les versions)

- [ ] Vérificateur avec `01_conforme_word.pdf`, `04_marges_2cm_word.pdf` (R08 en erreur, zone surlignée sur l’aperçu de la page 2) et `05_scanne.pdf` (analyse impossible).
- [ ] Glisser-déposer du PDF (Mac).
- [ ] Aperçus des pages. Sans OffscreenCanvas dans le Worker (Safari antérieur à 16.4), la première ligne de chaque page remplace l’aperçu : c’est le comportement prévu.
- [ ] Impression du rapport et « Enregistrer au format PDF ».
- [ ] Pages de contenu, navigation au clavier (Tab, lien d’évitement).

**Lighthouse ≥ 95** (Chrome › DevTools › Lighthouse, mode navigation, sur mobile puis sur ordinateur, 4 catégories)

| Page | Performances | Accessibilité | Bonnes pratiques | SEO |
| --- | --- | --- | --- | --- |
| `/` | | | | |
| `/verifier/` | | | | |
| `/regles/` | | | | |
| `/confidentialite/` | | | | |
| `/mentions-legales/` | | | | — |
| `/page-inexistante/` | | | | — |

Le SEO des mentions légales et de la 404 est bas exprès : ces pages sont en `noindex`.

**Search Console**

- [ ] Ajouter une propriété › Domaine › `au-propre.fr` ; enregistrement TXT ajouté dans le DNS de Cloudflare (tableau ci-dessus) ; propriété validée.
- [ ] Sitemaps › `https://au-propre.fr/sitemap.xml` envoyé.
- [ ] Quelques jours après : 4 pages indexées (accueil, vérificateur, règles, confidentialité) ; mentions légales « exclue par la balise noindex », comme prévu.

**E-mails** (avec une adresse académique, `@ac-….fr`)

- [ ] Inscription par l’encart sous le rapport : e-mail de confirmation de Brevo reçu dans la boîte de réception, pas dans les indésirables.
- [ ] En-têtes du message (« Afficher l’original ») : SPF, DKIM (`d=au-propre.fr`) et DMARC à « pass ».
- [ ] Aucun nom de personne dans `From`, `Sender`, `Reply-To` ni `Return-Path`.
- [ ] Réponse envoyée depuis Gmail par le SMTP de Brevo vers l’adresse académique : reçue, mêmes contrôles d’en-têtes.
- [ ] Message envoyé de l’adresse académique à contact@au-propre.fr : arrivé dans Gmail.

**Statistiques côté serveur pour /verifier/** (sans script ni cookie)

- Le tableau de bord Analytics › HTTP Traffic de l’offre gratuite ne propose ni ventilation ni filtre par chemin : requêtes, bande passante, visiteurs uniques, carte par pays ([doc Cloudflare](https://developers.cloudflare.com/analytics/account-and-zone-analytics/zone-analytics/)).
- [ ] Security › Analytics existe sur l’offre gratuite : 31 jours, données échantillonnées, robots compris ([doc](https://developers.cloudflare.com/waf/analytics/security-analytics/)). La doc ne dit pas si le filtre par chemin y est disponible en gratuit : essayer un filtre « Path » égal à `/verifier/`.
  - S’il existe, noter ici où le lire. Le chemin `/_astro/extract.worker-….js` n’est chargé qu’au moment où un PDF est lu : il approche le nombre d’analyses, cache du navigateur mis à part.
  - Sinon, on s’en passe.

## 4. Après le lancement

- [ ] Programmer dans Brevo la campagne de rappel du 1er décembre (liste « Rappel 3 décembre »).
  - Après l’envoi, l’encart promet encore un rappel avant la clôture : reformuler ou retirer `INSCRIPTION` (`src/content/interface.fr.ts`), puis déployer.
- [ ] Guide de l’oral, envoyé en janvier (liste « Nouveautés Au propre »), comme l’annoncent l’encart et la politique de confidentialité.
- [ ] Formulaire natif dans la page, après le lancement, à la place du lien vers le formulaire hébergé par Brevo. À prévoir : `form-action` dans la politique de sécurité (`astro.config.mjs`), politique de confidentialité, tests réseau.
- [ ] Renouveler le jeton d’API Cloudflare avant le 30 juin 2027, date de son expiration, puis remplacer le secret GitHub `CLOUDFLARE_API_TOKEN`. Sans cela, le déploiement échoue.

## 5. Journal

| Date | Étape | Résultat |
| --- | --- | --- |
| 01/11/2026 | Code de l’étape 6, tests locaux | 523 tests Vitest ; 209 tests Playwright passent, 4 ignorés exprès en mobile |
| 11/11/2026 | Jeton, secrets GitHub, profil Cloudflare (étapes 1 à 8) | Faits par l’éditeur ; réglages de la zone introuvables |
| 11/11/2026 | Rappel et nouveautés par e-mail, politique de confidentialité, site robuste sans réglages de zone, accueil | 527 tests Vitest ; 215 tests Playwright passent, 4 ignorés exprès en mobile ; commit et push sur `main` |
