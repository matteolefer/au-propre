import { R01 } from '../../content/rules.fr';
import { MOTS_CLES_COUVERTURE_MIN, SESSION_ATTENDUE } from '../measure';
import { normaliser, texteDePage } from '../recherche';
import type { Decoupage, ModeleDocument, ParametresDossier, ResultatRegle } from '../types';
import { blocsDeTexte } from './commun';

/** Mots attendus sur le formulaire de couverture, sans accents ni majuscules. */
const MOTS_CLES_COUVERTURE = [
  /reconnaissance des acquis|\braep\b/,
  /\bconcours\b/,
  /\bsession\b/,
  /\bnom\b/,
  /\bprenom\b/,
  /\battest|sur l'honneur/,
  /\bsignature\b/,
  /\bcyclades\b/,
  /\bsection\b|\bdiscipline\b/,
];

/** « Session 2026 », « concours 2026 », « session de 2026 »… */
const ANNEE_DE_SESSION = /(?:session|concours)\D{0,20}?(20\d{2})/g;

/**
 * R01 : page de couverture (SPEC §5). Heuristique sur la page 1, faute de vrai
 * formulaire Cyclades : avertissement si la page paraît absente, scannée, sans
 * mot-clé ou d'une autre session ; sinon simple information à confirmer dans
 * la checklist.
 */
export function verifierR01(
  document: ModeleDocument,
  _decoupage?: Decoupage,
  _parametres?: ParametresDossier,
  session: number = SESSION_ATTENDUE,
): ResultatRegle[] {
  const sources = [...R01.sources];
  const page = document.pages[0];
  if (!page || blocsDeTexte(page).length === 0) {
    return [
      {
        id: 'R01',
        gravite: 'avertissement',
        titre: R01.sansTexte.titre,
        detail: R01.sansTexte.detail,
        pages: [1],
        correction: R01.sansTexte.correction(session),
        sources,
      },
    ];
  }

  const texte = texteDePage(page);
  if (normaliser(texte.textes[0] ?? '').startsWith('premiere partie')) {
    return [
      { id: 'R01', gravite: 'avertissement', titre: R01.absente.titre, detail: R01.absente.detail, pages: [1], correction: R01.absente.correction(session), sources },
    ];
  }

  const resultats: ResultatRegle[] = [];
  const motsCles = MOTS_CLES_COUVERTURE.filter((motif) => motif.test(texte.texte)).length;
  if (motsCles < MOTS_CLES_COUVERTURE_MIN) {
    resultats.push({
      id: 'R01',
      gravite: 'avertissement',
      titre: R01.sansMotCle.titre,
      detail: R01.sansMotCle.detail,
      pages: [1],
      correction: R01.sansMotCle.correction(session),
      sources,
    });
  }
  const autresAnnees = [...new Set([...texte.texte.matchAll(ANNEE_DE_SESSION)].map((m) => Number(m[1])))].filter(
    (annee) => annee !== session,
  );
  if (autresAnnees.length > 0) {
    resultats.push({
      id: 'R01',
      gravite: 'avertissement',
      titre: R01.autreSession.titre(session),
      detail: R01.autreSession.detail(autresAnnees),
      pages: [1],
      correction: R01.autreSession.correction(session),
      sources,
    });
  }
  if (resultats.length > 0) return resultats;
  return [{ id: 'R01', gravite: 'info', titre: R01.detectee.titre, detail: R01.detectee.detail(session), pages: [1], correction: '', sources }];
}
