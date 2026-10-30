import { A4 } from '../../src/checker/measure';
import type { BlocTexte, ModeleDocument, PageModele } from '../../src/checker/types';

const BLOC: BlocTexte = {
  texte: 'Texte',
  police: 'ArialMT',
  policeBrute: 'ABCDEF+ArialMT',
  taille: 11,
  couleur: '#000000',
  x: 70.87,
  y: 100,
  largeur: 400,
  hauteur: 11,
};

interface OptionsDocument {
  /** Taille particulière de certaines pages : numéro → [largeur, hauteur] en points. */
  formats?: Record<number, readonly [number, number]>;
  /** Pages sans texte ni image. */
  vides?: readonly number[];
}

/** Document minimal pour les cas que les fixtures ne couvrent pas. */
export function documentSynthetique(nombrePages: number, options: OptionsDocument = {}): ModeleDocument {
  const pages: PageModele[] = Array.from({ length: nombrePages }, (_, i) => {
    const numero = i + 1;
    const [largeur, hauteur] = options.formats?.[numero] ?? [A4.largeur, A4.hauteur];
    return {
      numero,
      largeur,
      hauteur,
      rotation: 0,
      blocs: options.vides?.includes(numero) ? [] : [BLOC],
      liens: [],
      images: [],
    };
  });
  return { pages, contientTexte: pages.some((page) => page.blocs.length > 0) };
}
