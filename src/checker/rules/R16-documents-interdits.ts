import { R16 } from '../../content/rules.fr';
import { estDebutDeParagraphe, estTitre, rechercher, texteDePage } from '../recherche';
import type { Decoupage, ModeleDocument, ParametresDossier, ResultatRegle } from '../types';
import { ajouterPage, enGroupes, estDansPlage, pagesSaufCouverture, sourcesDe } from './commun';

/** Expressions recherchées, avec leur libellé affiché. Le texte est normalisé (sans accents, en minuscules). */
const EXPRESSIONS: readonly { motif: RegExp; libelle: string }[] = [
  { motif: /lettres? de recommandation/, libelle: '« lettre de recommandation »' },
  { motif: /rapports? d'inspection/, libelle: '« rapport d’inspection »' },
  { motif: /visites?\s?-?\s?conseils?/, libelle: '« visite-conseil »' },
];

/** Préfixe admis avant l'expression en tête de bloc : « Annexe 3 : », « Objet : ». */
const PREFIXE_DE_BLOC = /^(?:annexe\s*\d*\s*[:.-]?\s*|objet\s*:\s*)?$/;

/**
 * R16 : pas de lettre de recommandation ni de rapport d'inspection (SPEC §5).
 * Erreur quand l'expression est un titre, figure dans les annexes ou ouvre un
 * bloc (document probablement joint) ; simple information quand elle est
 * citée dans le texte des parties 1 et 2.
 */
export function verifierR16(document: ModeleDocument, decoupage: Decoupage, parametres?: ParametresDossier): ResultatRegle[] {
  const joints = new Map<string, Set<number>>();
  const mentions = new Set<number>();
  for (const page of pagesSaufCouverture(document, decoupage)) {
    const texte = texteDePage(page);
    const enAnnexe = estDansPlage(page.numero, decoupage.annexes);
    for (const { motif, libelle } of EXPRESSIONS) {
      for (const occurrence of rechercher(texte, motif)) {
        const debutDeLigne = (texte.textes[occurrence.ligne] ?? '').slice(0, occurrence.positionDansLigne);
        const ouvreUnBloc = PREFIXE_DE_BLOC.test(debutDeLigne) && estDebutDeParagraphe(texte.lignes, occurrence.ligne);
        if (enAnnexe || estTitre(texte.lignes, occurrence.ligne) || ouvreUnBloc) ajouterPage(joints, libelle, page.numero);
        else mentions.add(page.numero);
      }
    }
  }

  const sources = sourcesDe(R16, parametres);
  if (joints.size > 0) {
    const groupes = enGroupes(joints);
    return [
      {
        id: 'R16',
        gravite: 'erreur',
        titre: R16.erreur.titre,
        detail: R16.erreur.detail(groupes),
        pages: [...new Set(groupes.flatMap((g) => g.pages))].sort((a, b) => a - b),
        correction: R16.erreur.correction,
        sources,
      },
    ];
  }
  if (mentions.size > 0) {
    return [
      { id: 'R16', gravite: 'info', titre: R16.mention.titre, detail: R16.mention.detail, pages: [...mentions].sort((a, b) => a - b), correction: '', sources },
    ];
  }
  return [{ id: 'R16', gravite: 'conforme', titre: R16.conforme.titre, detail: R16.conforme.detail, correction: '', sources }];
}
