import { R19 } from '../../content/rules.fr';
import { normaliser } from '../recherche';
import type { Decoupage, ModeleDocument, ParametresDossier, ResultatRegle } from '../types';

/** Mots qui ne sont pas un nom ou un prénom (comparés sans accents ni majuscules). */
const MOTS_EXCLUS = new Set([
  'raep', 'dossier', 'final', 'finale', 'definitif', 'definitive', 'version', 'copie', 'document', 'scan',
  'concours', 'capes', 'caplp', 'capet', 'cpe', 'caer', 'interne', 'partie', 'annexe', 'annexes', 'v',
]);

/** Un mot de nom ou de prénom : des lettres, avec traits d'union et apostrophes internes. */
const MOT_DE_NOM = /^\p{L}[\p{L}'’-]*$/u;

/**
 * R19 : nom du fichier (SPEC §5). Le PDF doit être nommé aux nom et prénom du
 * candidat (S4) : au moins deux mots de lettres séparés par « _ » ou une
 * espace, extension .pdf. Sans nom de fichier connu, la règle ne s'applique pas.
 */
export function verifierR19(_document: ModeleDocument, _decoupage: Decoupage, parametres?: ParametresDossier): ResultatRegle[] {
  if (!parametres?.nomFichier) return [];
  const nom = parametres.nomFichier.split(/[\\/]/).pop() ?? parametres.nomFichier;
  const sources = [...R19.sources];
  if (nomConforme(nom)) {
    return [{ id: 'R19', gravite: 'conforme', titre: R19.conforme.titre, detail: R19.conforme.detail(nom), correction: '', sources }];
  }
  return [
    { id: 'R19', gravite: 'avertissement', titre: R19.avertissement.titre, detail: R19.avertissement.detail(nom), correction: R19.avertissement.correction, sources },
  ];
}

export function nomConforme(nom: string): boolean {
  const extension = /\.pdf$/i.exec(nom);
  if (!extension) return false;
  const mots = nom.slice(0, extension.index).split(/[_\s]+/).filter((mot) => mot !== '');
  return mots.length >= 2 && mots.every((mot) => MOT_DE_NOM.test(mot) && !MOTS_EXCLUS.has(normaliser(mot)));
}
