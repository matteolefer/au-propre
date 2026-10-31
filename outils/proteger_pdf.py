"""Crée les fixtures de PDF protégés à partir de l'export Word conforme (01).

- 06_protege.pdf : mot de passe demandé à l'ouverture (« test »). Le vérificateur
  ne peut pas le lire et doit afficher le message « PDF protégé par un mot de passe ».
- 07_restrictions.pdf : s'ouvre sans mot de passe, mais la copie et la modification
  sont interdites (mot de passe « propriétaire » seulement). Le vérificateur doit
  l'analyser comme 01_conforme_word.pdf.

Dépendance : pypdf (licence BSD-3-Clause), outil de développement seulement.
Chiffrement RC4 128 bits, que pypdf sait faire sans autre dépendance (l'AES
demanderait le paquet « cryptography ») ; pdf.js lit les deux.

    pip install pypdf
    python outils/proteger_pdf.py
"""
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from pypdf.constants import UserAccessPermissions

FIXTURES = Path(__file__).resolve().parent.parent / "tests" / "fixtures"
SOURCE = FIXTURES / "01_conforme_word.pdf"


def copie() -> PdfWriter:
    writer = PdfWriter(clone_from=PdfReader(SOURCE))
    # Pas de date ni d'identifiant variables : le fichier reste identique d'une exécution à l'autre.
    writer.add_metadata({"/Producer": "outils/proteger_pdf.py"})
    return writer


def ecrire(writer: PdfWriter, nom: str) -> None:
    with open(FIXTURES / nom, "wb") as fichier:
        writer.write(fichier)
    print(f"{nom} écrit")


protege = copie()
protege.encrypt(user_password="test", owner_password="proprietaire", algorithm="RC4-128")
ecrire(protege, "06_protege.pdf")

restrictions = copie()
restrictions.encrypt(
    user_password="",
    owner_password="proprietaire",
    algorithm="RC4-128",
    permissions_flag=UserAccessPermissions.PRINT | UserAccessPermissions.PRINT_TO_REPRESENTATION,
)
ecrire(restrictions, "07_restrictions.pdf")
