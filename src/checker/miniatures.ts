/// <reference lib="webworker" />
/**
 * Aperçu des pages pour l'écran de découpage, dessiné dans le Web Worker avec
 * OffscreenCanvas. Rien n'est envoyé sur le réseau : les images restent dans
 * le navigateur. Un navigateur sans OffscreenCanvas n'a pas d'aperçu, et
 * l'écran de découpage affiche alors la première ligne de chaque page.
 */
import { AnnotationMode } from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

/** Largeur des aperçus en pixels : deux fois leur largeur affichée, pour les écrans haute densité. */
export const LARGEUR_MINIATURE_PX = 320;

interface CanvasEtContexte {
  canvas: OffscreenCanvas | null;
  context: OffscreenCanvasRenderingContext2D | null;
}

/**
 * Fabrique de canvas pour pdf.js, sans DOM. pdf.js l'utilise pour ses canvas
 * temporaires (motifs, masques, transparence) ; elle reprend les méthodes de
 * sa fabrique par défaut (create, reset, destroy).
 */
export class FabriqueCanvasHorsEcran {
  create(largeur: number, hauteur: number): CanvasEtContexte {
    if (largeur <= 0 || hauteur <= 0) throw new Error('Taille de canvas invalide');
    const canvas = new OffscreenCanvas(largeur, hauteur);
    return { canvas, context: canvas.getContext('2d', { willReadFrequently: true }) };
  }

  reset(element: CanvasEtContexte, largeur: number, hauteur: number): void {
    if (!element.canvas) throw new Error('Canvas absent');
    if (largeur <= 0 || hauteur <= 0) throw new Error('Taille de canvas invalide');
    element.canvas.width = largeur;
    element.canvas.height = hauteur;
  }

  destroy(element: CanvasEtContexte): void {
    if (!element.canvas) throw new Error('Canvas absent');
    element.canvas.width = 0;
    element.canvas.height = 0;
    element.canvas = null;
    element.context = null;
  }
}

export function miniaturesPossibles(): boolean {
  return typeof OffscreenCanvas !== 'undefined';
}

/** Dessine chaque page ; une page qui échoue donne null sans arrêter les autres. */
export async function dessinerMiniatures(
  pdf: PDFDocumentProxy,
  progression: (page: number, total: number) => void,
): Promise<(Blob | null)[]> {
  const miniatures: (Blob | null)[] = [];
  for (let numero = 1; numero <= pdf.numPages; numero++) {
    miniatures.push(await dessinerPage(pdf, numero).catch(() => null));
    progression(numero, pdf.numPages);
  }
  return miniatures;
}

async function dessinerPage(pdf: PDFDocumentProxy, numero: number): Promise<Blob> {
  const page = await pdf.getPage(numero);
  try {
    const largeur = page.getViewport({ scale: 1 }).width;
    const vue = page.getViewport({ scale: LARGEUR_MINIATURE_PX / largeur });
    const canvas = new OffscreenCanvas(Math.ceil(vue.width), Math.ceil(vue.height));
    // pdf.js accepte un OffscreenCanvas, même si ses types ne le déclarent pas.
    await page.render({ canvas: canvas as unknown as HTMLCanvasElement, viewport: vue, annotationMode: AnnotationMode.DISABLE })
      .promise;
    return await canvas.convertToBlob({ type: 'image/png' });
  } finally {
    page.cleanup();
  }
}
