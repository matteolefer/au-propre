import { describe, expect, it } from 'vitest';
import { verifierR19 } from '../../src/checker/rules/R19-nom-fichier';
import { DECOUPAGE_SYNTHETIQUE, documentStandard } from '../helpers/document-synthetique';
import { attendreTextesEtSources } from '../helpers/sources';

function verifierNom(nomFichier: string | null) {
  return verifierR19(documentStandard(), DECOUPAGE_SYNTHETIQUE, { concours: null, discipline: null, nomFichier });
}

describe('R19 : nom du fichier', () => {
  it.each(['DUPONT_Marie.pdf', 'Dupont Marie.pdf', 'DUPONT-MARTIN_Marie-Claire.pdf', 'N’DIAYE_Awa.pdf', 'DUPONT_Marie.PDF'])(
    '« %s » : conforme',
    (nom) => {
      const resultats = verifierNom(nom);
      expect(resultats.map((r) => r.gravite)).toEqual(['conforme']);
      attendreTextesEtSources(resultats, ['S4']);
    },
  );

  it.each(['01_conforme.pdf', 'dossier_RAEP_final.pdf', 'DUPONT.pdf', 'DUPONT_Marie.docx', 'DUPONT_Marie_v2.pdf'])(
    '« %s » : avertissement',
    (nom) => {
      const resultats = verifierNom(nom);
      expect(resultats.map((r) => r.gravite)).toEqual(['avertissement']);
      expect(resultats[0]?.detail).toContain(`« ${nom} »`);
      attendreTextesEtSources(resultats, ['S4']);
    },
  );

  it('nom de fichier inconnu : la règle ne s’applique pas', () => {
    expect(verifierNom(null)).toEqual([]);
  });
});
