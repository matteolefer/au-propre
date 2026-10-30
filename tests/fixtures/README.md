# Fichiers de test du vérificateur RAEP

Cinq PDF de test, plus les quatre documents Word dont ils sont issus. Contenu : texte bidon, aucune donnée réelle.

Structure commune (sauf mention contraire) : page 1 = couverture fictive ; partie 1 = 2 pages ; partie 2 = 6 pages ; annexes = 2 pages ; A4 ; texte justifié ; pas de retrait de paragraphe ; interligne simple ; marges haut et bas 2,5 cm ; en-tête et pied de page à 1,25 cm ; numéro de page en pied de page à partir de la page 2.

## Origine des PDF

Les PDF fournis ont été exportés depuis **LibreOffice**, sans les polices Microsoft. LibreOffice a donc remplacé :
- Arial par **Liberation Sans** (police de substitution aux mêmes dimensions) ;
- Calibri par **Carlito**.

C'est un cas réel : beaucoup de candidats utilisent LibreOffice. Pour avoir aussi des exports **Word** avec la vraie police Arial, ouvrir chaque `.docx` dans Word, puis Fichier > Enregistrer sous > PDF, et nommer le fichier avec le suffixe `_word` (par exemple `01_conforme_word.pdf`). Garder les deux séries : le vérificateur doit fonctionner sur les deux.

Exports Word présents : `01_conforme_word.pdf`, `03_calibri_word.pdf`. Manquants : `02_partie1_3pages_word.pdf`, `04_marges_2cm_word.pdf`. Les tests (`tests/fixtures-attendues.test.ts`) les vérifieront automatiquement dès qu'ils seront ajoutés.

## Résultats attendus

| Fichier | Particularité | Mesures (export LibreOffice) | Règles attendues, export LibreOffice | Règles attendues, export Word |
| --- | --- | --- | --- | --- |
| 01_conforme | Aucune | P1 2 p., P2 6 p., annexes 2 p. ; Liberation Sans 11 pt ; marges 2,50 / 2,48 cm ; pied à 1,25 cm ; interligne 1,09 | R05 avertissement (police de substitution) ; R01 à confirmer (couverture fictive) | Aucune erreur ; R01 à confirmer |
| 02_partie1_3pages | Partie 1 sur 3 pages | P1 3 p., P2 6 p. | R02 erreur ; R05 avertissement | R02 erreur |
| 03_calibri | Police Calibri 11 | Carlito 11 pt | R05 erreur (Carlito n'est pas un substitut d'Arial) | R05 erreur (Calibri) |
| 04_marges_2cm | Marges gauche et droite de 2 cm | marges 2,00 / 1,97 cm | R08 erreur ; R05 avertissement | R08 erreur |
| 05_scanne | Images seules, sans couche texte (copie rastérisée de 01, légère rotation et grain) | aucun texte, aucune police | R00 bloquant : analyse impossible | Sans objet |

## Vérifier les mesures soi-même

`outils/mesurer_pdf.py` (Python, dépendance pdfplumber sous licence MIT) refait ces mesures de façon déterministe :

```
pip install pdfplumber
python outils/mesurer_pdf.py tests/fixtures/*.pdf
```

Le produit fera les mêmes calculs dans le navigateur avec pdf.js ; ce script sert de référence pour calibrer les seuils.

## À ajouter plus tard

- Le vrai formulaire de couverture Cyclades 2027 (pour calibrer R01).
- Des cas limites : partie 2 sur 7 pages, annexes de 11 pages, police en 10 pt, retrait de première ligne, texte en couleur, mot « Sommaire », URL dans le texte, PDF exporté depuis Google Docs.
