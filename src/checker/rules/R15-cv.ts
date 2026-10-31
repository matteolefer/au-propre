import { R15 } from '../../content/rules.fr';
import { estTitre, texteDePage } from '../recherche';
import type { Decoupage, ModeleDocument, ParametresDossier, ResultatRegle } from '../types';
import { pagesSaufCouverture, sourcesDe } from './commun';

const TITRE_CV = /^(?:mon |le )?(?:cv|curriculum vitae)\b/;
const MENTION_CV = /\bcv\b|curriculum vitae/;

/**
 * R15 : pas de CV (SPEC §5). « CV » ou « Curriculum vitae » en titre :
 * avertissement ; cité dans une phrase : simple information.
 */
export function verifierR15(document: ModeleDocument, decoupage: Decoupage, parametres?: ParametresDossier): ResultatRegle[] {
  const titres: number[] = [];
  const mentions: number[] = [];
  for (const page of pagesSaufCouverture(document, decoupage)) {
    const texte = texteDePage(page);
    if (texte.textes.some((ligne, i) => TITRE_CV.test(ligne) && estTitre(texte.lignes, i))) titres.push(page.numero);
    else if (MENTION_CV.test(texte.texte)) mentions.push(page.numero);
  }
  const sources = sourcesDe(R15, parametres);
  if (titres.length > 0) {
    return [
      { id: 'R15', gravite: 'avertissement', titre: R15.avertissement.titre, detail: R15.avertissement.detail(titres), pages: titres, correction: R15.avertissement.correction, sources },
    ];
  }
  if (mentions.length > 0) {
    return [{ id: 'R15', gravite: 'info', titre: R15.mention.titre, detail: R15.mention.detail, pages: mentions, correction: '', sources }];
  }
  return [{ id: 'R15', gravite: 'conforme', titre: R15.conforme.titre, detail: R15.conforme.detail, correction: '', sources }];
}
