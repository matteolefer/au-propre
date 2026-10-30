import { R17 } from '../../content/rules.fr';
import { texteDePage } from '../recherche';
import type { Decoupage, ModeleDocument, ResultatRegle } from '../types';
import { ajouterPage, enGroupes, pagesSaufCouverture } from './commun';

const ADRESSE_EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const ADRESSE_WEB = /\b(?:https?:\/\/|www\.)[^\s<>"«»]+/g;
const NOM_DE_DOMAINE = /\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:fr|com|org|net|eu|edu)\b(?:\/[^\s<>"«»]*)?/g;

/** Nombre maximal d'adresses citées dans le détail. */
const ADRESSES_AFFICHEES_MAX = 5;

/**
 * R17 : liens et QR codes non lus (SPEC §5). Adresses web dans le texte et
 * liens cliquables vers le web ; les liens internes au PDF sont ignorés. Les
 * QR codes ne sont pas détectables sans décodage d'image.
 */
export function verifierR17(document: ModeleDocument, decoupage: Decoupage): ResultatRegle[] {
  const adresses = new Map<string, Set<number>>();
  for (const page of pagesSaufCouverture(document, decoupage)) {
    for (const adresse of adressesDuTexte(texteDePage(page).texte)) ajouterPage(adresses, adresse, page.numero);
    for (const lien of page.liens) {
      if (lien.url !== null && /^(?:https?:|www\.)/i.test(lien.url)) ajouterPage(adresses, `lien vers ${lien.url}`, page.numero);
    }
  }

  const sources = [...R17.sources];
  if (adresses.size > 0) {
    const groupes = enGroupes(adresses);
    const affiches = groupes.slice(0, ADRESSES_AFFICHEES_MAX);
    return [
      {
        id: 'R17',
        gravite: 'avertissement',
        titre: R17.avertissement.titre,
        detail: R17.avertissement.detail(affiches),
        pages: [...new Set(groupes.flatMap((g) => g.pages))].sort((a, b) => a - b),
        correction: R17.avertissement.correction,
        sources,
      },
    ];
  }
  return [{ id: 'R17', gravite: 'conforme', titre: R17.conforme.titre, detail: R17.conforme.detail, correction: '', sources }];
}

/** Adresses web d'un texte normalisé, sans les adresses e-mail. */
export function adressesDuTexte(texte: string): string[] {
  let reste = texte.replace(ADRESSE_EMAIL, ' ');
  const trouvees: string[] = [];
  for (const motif of [ADRESSE_WEB, NOM_DE_DOMAINE]) {
    for (const correspondance of reste.matchAll(motif)) trouvees.push(correspondance[0].replace(/[.,;:)\]]+$/, ''));
    reste = reste.replace(motif, ' ');
  }
  return trouvees;
}
