"""Prototype de mesure déterministe d'un PDF de dossier RAEP (référence de calcul).
Le produit fera les mêmes calculs dans le navigateur avec pdf.js ; ce script sert à
vérifier les seuils sur les fichiers de test. Dépendance : pdfplumber (licence MIT)."""
import sys, statistics, collections
import pdfplumber

CM = 28.3465  # points par centimètre

def mesurer(chemin):
    with pdfplumber.open(chemin) as pdf:
        pages = pdf.pages
        res = {"fichier": chemin, "pages": len(pages)}
        if not any(p.chars for p in pages):
            res["texte"] = False
            return res
        res["texte"] = True
        # Découpage simple par titres repérés dans le texte
        debut = {}
        for i, p in enumerate(pages, start=1):
            t = p.extract_text() or ""
            for cle, motif in (("p1", "Première partie"), ("p2", "Seconde partie"), ("ann", "Annexe 1")):
                if motif in t and cle not in debut:
                    debut[cle] = i
        res["partie1_pages"] = debut["p2"] - debut["p1"]
        res["partie2_pages"] = debut["ann"] - debut["p2"]
        res["annexes_pages"] = len(pages) - debut["ann"] + 1
        corps = pages[debut["p1"] - 1: debut["ann"] - 1]  # parties 1 et 2 seulement
        polices = collections.Counter()
        tailles = collections.Counter()
        gauche, droite, haut_min, bas_max, interlignes = [], [], [], [], []
        for p in corps:
            w, h = p.width, p.height
            zone_texte = [c for c in p.chars if c["text"].strip() and c["bottom"] < h - 2 * CM]
            pied = [c for c in p.chars if c["text"].strip() and c["bottom"] >= h - 2 * CM]
            for c in zone_texte:
                polices[c["fontname"].split("+")[-1]] += 1
                tailles[round(c["size"], 1)] += 1
            gauche.append(min(c["x0"] for c in zone_texte))
            droite.append(w - max(c["x1"] for c in zone_texte))
            haut_min.append(min(c["top"] for c in p.chars if c["text"].strip()))
            bas_max.append(h - max(c["bottom"] for c in p.chars if c["text"].strip()))
            lignes = sorted({round(c["top"], 1) for c in zone_texte})
            interlignes += [b - a for a, b in zip(lignes, lignes[1:]) if b - a < 1.5 * 11]
        taille = tailles.most_common(1)[0][0]
        res.update({
            "police_principale": polices.most_common(1)[0][0],
            "taille_principale_pt": taille,
            "marge_gauche_cm": round(min(gauche) / CM, 2),
            "marge_droite_cm": round(min(droite) / CM, 2),
            "texte_le_plus_haut_cm": round(min(haut_min) / CM, 2),
            "texte_le_plus_bas_cm": round(min(bas_max) / CM, 2),
            "interligne_ratio": round(statistics.median(interlignes) / taille, 2),
        })
        return res

if __name__ == "__main__":
    for f in sys.argv[1:]:
        print(mesurer(f))
