# Spécification produit — RAEP Check (nom provisoire)

Version : 30 octobre 2026. Session visée : concours internes 2027.

## 1. Le problème

- Environ 14 400 inscrits par an aux concours internes CAPES, CAPLP, CAPET et CAER (session 2026), dont près d'un tiers ne dépose jamais son dossier RAEP.
- Les règles de forme sont strictes : un dossier hors norme n'est pas évalué. En histoire-géographie 2026, 112 dossiers sur 1 252 (8,9 %) ont été écartés : 96 hors norme, 16 erreurs d'inscription.
- Dépôt de la session 2027 : au plus tard le **jeudi 3 décembre 2026 à 23 h 59**, en PDF, dans l'espace candidat Cyclades, rubrique « Mes justificatifs ».

## 2. La cible

Enseignants contractuels et maîtres délégués du privé surtout, mais aussi assistants d'éducation, AESH, professeurs des écoles, fonctionnaires d'autres corps, qui préparent un concours interne du second degré, souvent seuls et en parallèle de leur service.

## 3. La proposition

**V1 (gratuite)** : déposer son PDF et obtenir en quelques secondes un rapport qui dit, règle par règle, si le dossier respecte les normes officielles, où se trouvent les problèmes et comment les corriger. Le fichier ne quitte pas l'ordinateur.

**V1.5 (payante, après le lancement)** : relecture critique selon les critères officiels du jury et les constats des rapports de la discipline, correction des phrases du candidat, préparation aux questions de l'oral sur le dossier. Voir section 7.

Le produit **ne rédige jamais** le dossier (voir `CLAUDE.md`, règle absolue n° 1).

## 4. Parcours V1

1. **Accueil** : ce que fait l'outil, pour qui, l'échéance du 3 décembre, la garantie de confidentialité. Bouton « Vérifier mon dossier ».
2. **Paramètres** : choix du concours (CAPES interne, CAER-CAPES, CAPLP interne, CAER-CAPLP, CAPET interne, CAER-CAPET, CPE interne) et de la discipline (liste). Dépôt du PDF par glisser-déposer ou sélection. Mention visible : « Votre fichier est analysé dans votre navigateur et n'est envoyé nulle part. »
3. **Découpage** : l'outil propose automatiquement, d'après les titres détectés, les pages de la couverture, de la partie 1, de la partie 2 et des annexes. L'utilisateur confirme ou corrige avec de simples sélecteurs de pages. Rien n'est analysé tant que le découpage n'est pas confirmé.
4. **Rapport** :
   - un résumé en tête (nombre d'erreurs, nombre d'avertissements) ;
   - trois groupes : « À corriger », « À vérifier », « Conforme » ;
   - pour chaque contrôle : titre, ce qui a été mesuré, pages concernées, comment corriger, source officielle (lien) ;
   - une **checklist manuelle** à cocher pour ce qui ne peut pas être vérifié automatiquement (section 6) ;
   - possibilité d'imprimer le rapport.
5. **Après le rapport** : encart discret présentant la relecture critique à venir, avec inscription facultative par e-mail (consentement explicite, finalité unique).

## 5. Règles de conformité automatisées (V1)

Les mesures se font sur les pages de la partie 1 et de la partie 2, sauf mention contraire. La page de couverture et les annexes ne sont pas soumises aux règles de police et de marges. Les règles de contenu R14 à R17 portent sur toutes les pages sauf la couverture, annexes comprises.

Unités : 1 cm = 28,3465 pt. A4 = 595,28 × 841,89 pt. Tolérance par défaut : 2 pt.

| ID | Règle | Seuil ou méthode | Gravité | Source |
| --- | --- | --- | --- | --- |
| R00 | PDF lisible | Si aucune couche texte n'est trouvée (scan), arrêter l'analyse et expliquer pourquoi | Bloquant | — |
| R01 | Page de couverture présente | Heuristique sur la page 1 (mots-clés du formulaire Cyclades, à calibrer sur un vrai formulaire) + confirmation manuelle. Avertissement si la page 1 est sans texte (scan), commence par « Première partie », ne contient aucun mot-clé de couverture (concours, session, RAEP, nom, prénom, attestation sur l'honneur, signature…) ou mentionne une autre session que celle attendue (`SESSION_ATTENDUE`, 2027). Sinon info : « Couverture détectée : vérifiez dans la checklist qu'il s'agit du formulaire 2027 téléchargé dans Cyclades. » | Avertissement ou info | S2, S3, S5 |
| R02 | Partie 1 : 2 pages maximum | Nombre de pages de la partie 1 > 2 | Erreur | S1, S2 |
| R03 | Partie 2 : 6 pages maximum | Nombre de pages de la partie 2 > 6 | Erreur | S1, S2 |
| R04 | Annexes : 10 pages maximum | Nombre de pages d'annexes > 10 | Erreur | S1, S2 |
| R05 | Police Arial | Police majoritaire du corps de texte ≠ Arial / ArialMT → erreur. Police de substitution métrique (Liberation Sans, Arimo) → avertissement : « votre traitement de texte a remplacé Arial » | Erreur ou avertissement | S1, S2 |
| R06 | Taille 11 pt | Corps de texte hors [10,5 ; 11,5] pt → erreur. Titres d'une autre taille → avertissement (les jurys recommandent d'unifier) | Erreur ou avertissement | S1, S2, S8 |
| R07 | Interligne simple | Écart médian entre lignes d'un même paragraphe rapporté à la taille de police > 1,35 → avertissement (mesure approximative) | Avertissement | S1, S2 |
| R08 | Marges gauche et droite de 2,5 cm | Texte du corps à moins de 2,5 cm − tolérance du bord gauche ou droit → erreur | Erreur | S1, S2 |
| R09 | En-tête et pied de page à 1,25 cm du bord | Texte à moins de 1,25 cm − tolérance du bord haut ou bas → erreur | Erreur | S1, S2 |
| R10 | Pas de retrait en début de paragraphe | Premières lignes décalées de plus de 5 pt par rapport aux lignes suivantes, de façon récurrente → avertissement | Avertissement | S1, S2 |
| R11 | Format A4 | Taille de page différente de l'A4 au-delà de la tolérance → erreur | Erreur | S1, S2 |
| R12 | Pagination | Aucun numéro de page détecté dans les parties → avertissement | Avertissement | S8 |
| R13 | Texte en noir | Texte coloré dans les parties → avertissement | Avertissement | S7 |
| R14 | Pas de sommaire | Titre « Sommaire » ou « Table des matières » (ligne courte qui commence par le mot), ou au moins 3 lignes courtes consécutives terminées par un numéro de page croissant, avec points de suite ou tabulation → avertissement. Le mot cité dans une phrase est ignoré | Avertissement | S5, S7 |
| R15 | Pas de CV | « CV » ou « Curriculum vitae » en titre → avertissement. Cité dans une phrase → info : « Citer un curriculum vitae dans le texte est possible. En revanche, les jurys demandent de ne pas joindre de CV au dossier. » | Avertissement ou info | S5, S7 |
| R16 | Pas de lettre de recommandation ni de rapport d'inspection | « lettre de recommandation », « rapport d'inspection », « visite-conseil » en titre, dans les annexes ou en tête d'un bloc (document probablement joint) → erreur. Cité dans le texte des parties 1 et 2 → info : « Mentionner une visite ou une inspection est possible. En revanche, joindre un rapport d'inspection, de visite-conseil ou une lettre de recommandation écarte le dossier. » | Erreur ou info | S9 |
| R17 | Liens et QR codes non lus | URL dans le texte ou annotations de lien → avertissement | Avertissement | S6 |
| R18 | HGGSP en histoire-géographie | Si discipline = histoire-géographie et « HGGSP » présent dans la partie 2 ou les annexes → avertissement. Une mention dans la partie 1 (parcours) est ignorée | Avertissement | S5 |
| R19 | Nom du fichier | Ne ressemble pas à NOM_Prénom.pdf → avertissement | Avertissement | S4 |

Les seuils marqués « approximatif » doivent être calibrés sur les fichiers de test réels avant la mise en ligne. En cas de doute sur la fiabilité d'une mesure, la règle reste en avertissement.

## 6. Checklist manuelle (affichée dans le rapport)

- [ ] La page de couverture est celle de l'année 2027, téléchargée dans mon espace Cyclades (S2, S3).
- [ ] J'ai signé le dossier (S5, S6).
- [ ] La discipline de ma séquence est celle choisie à l'inscription (S5).
- [ ] J'atteste sur l'honneur l'authenticité de toutes les informations (S2).
- [ ] Mes annexes sont 1 ou 2 exemples liés à la situation décrite et ne prolongent pas l'analyse (S2, S5).
- [ ] Les élèves sont anonymisés dans le texte et les annexes (S5, S7).
- [ ] Chaque citation est entre guillemets et référencée (S5).
- [ ] J'ai vérifié la pagination après l'export en PDF (S5).
- [ ] Je dépose avant le jeudi 3 décembre 2026 à 23 h 59, rubrique « Mes justificatifs » (S3).

## 7. V1.5 (payante) — à ne pas développer avant la mise en ligne de la V1

- **Relecture critique** : retours organisés selon les six critères officiels (pertinence du choix, maîtrise des enjeux, structuration, prise de recul, justification des choix, qualité de l'expression) et les constats des rapports de jury de la discipline.
- **Correction de langue** : suggestions sur les phrases du candidat, acceptées une par une, sans ajout de contenu.
- **Préparation de l'oral** : questions probables du jury sur le dossier.
- **Interdits** : rédiger un paragraphe, une partie ou une séquence ; proposer des formulations types communes à plusieurs utilisateurs.
- **Paiement** : Stripe Checkout, paiement unique, 39 € (relecture) et 59 € (relecture + oral).
- **Données** : envoi du texte à l'API après consentement explicite, aucun stockage, aucune réutilisation.

## 8. Critères d'acceptation de la V1

- Le fichier de test conforme ne produit aucune erreur.
- Chaque fichier de test non conforme déclenche la règle attendue, et seulement les règles attendues.
- Analyse d'un PDF de 18 pages en moins de 5 secondes sur un ordinateur portable courant.
- Fonctionne sur les dernières versions de Chrome, Firefox, Safari et Edge ; affichage correct sur mobile.
- Aucune requête réseau ne transmet le PDF (vérifié dans les outils de développement).
- Score d'accessibilité Lighthouse ≥ 95.

## 9. Pages et contenus de la V1

- Accueil.
- Vérificateur.
- « Les règles officielles du RAEP » : chaque règle, expliquée simplement, avec sa source. Page utile aux candidats et au référencement.
- Confidentialité : ce qui est traité, où, ce qui n'est jamais collecté.
- Mentions légales.

## 10. Sources

| Code | Source |
| --- | --- |
| S1 | Les épreuves du CAPES interne, section lettres — https://www.devenirenseignant.gouv.fr/les-epreuves-du-capes-interne-section-lettres-565 |
| S2 | Conseils pour l'épreuve de RAEP de certains concours internes — https://www.devenirenseignant.gouv.fr/conseils-pour-l-epreuve-de-reconnaissance-des-acquis-de-l-experience-professionnelle-raep-de-1124 |
| S3 | Calendrier des concours du second degré, session 2027 — https://www.devenirenseignant.gouv.fr/le-calendrier-des-concours-de-recrutement-d-enseignants-du-second-degre-de-la-session-2027-1562 |
| S4 | Note de service, BO n° 36 de 2026 — https://www.education.gouv.fr/bo/2026/Hebdo36/MENH2622420N |
| S5 | Rapport de jury CAPES interne histoire-géographie 2026 — https://www.devenirenseignant.gouv.fr/media/20558/download |
| S6 | Rapport de jury CAPES interne mathématiques 2026 — https://www.devenirenseignant.gouv.fr/media/20992/download |
| S7 | Rapport de jury CAPES interne arts plastiques 2026 — https://www.devenirenseignant.gouv.fr/media/20876/download |
| S8 | Rapport de jury CAPES interne lettres 2026 — https://www.devenirenseignant.gouv.fr/media/21286/download |
| S9 | Rapport de jury CAPES interne SES 2025 — https://ses.ens-lyon.fr/fichiers/enseigner/rapport-de-jury-capes-interne-2025.pdf |

Le contenu de devenirenseignant.gouv.fr est sous licence etalab-2.0 (réutilisation libre avec mention de la source).
