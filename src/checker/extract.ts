/**
 * Lecture d'un PDF avec pdf.js et conversion vers le modèle de document.
 *
 * Ce module ne dépend d'aucune interface graphique : il tourne dans le Web
 * Worker du vérificateur (voir extract.worker.ts) et dans Node pour les tests.
 * Aucune requête réseau : ni cMapUrl ni standardFontDataUrl.
 */
import { getDocument, OPS, Util } from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy, TextContent, TextItem } from 'pdfjs-dist/types/src/display/api';
import type { MessageExtraction, RaisonEchec, ReponseExtraction } from './protocole';
import type { BlocTexte, ImageModele, Lien, ModeleDocument, PageModele, Rectangle } from './types';

export type { MessageExtraction, RaisonEchec, ReponseExtraction } from './protocole';

type Matrice = [number, number, number, number, number, number];

export class ErreurExtraction extends Error {
  readonly raison: RaisonEchec;

  constructor(raison: RaisonEchec, cause?: unknown) {
    super(`Extraction impossible : ${raison}`, { cause });
    this.name = 'ErreurExtraction';
    this.raison = raison;
  }
}

const OPTIONS_PDFJS = {
  // Pas de chargement de police dans le DOM : on ne fait que lire.
  disableFontFace: true,
  // Indispensable : sans cette option, pdf.js 6 n'expose pas le nom réel des polices.
  fontExtraProperties: true,
  isEvalSupported: false,
  useSystemFonts: false,
  verbosity: 0,
} as const;

/** Couleur de remplissage par défaut d'un PDF. */
const NOIR = '#000000';

export interface OptionsExtraction {
  /** Appelé après la lecture de chaque page. */
  progression?: (page: number, total: number) => void;
  /** Appelé avec le document pdf.js encore ouvert, une fois le modèle construit (dessin des miniatures). */
  avantFermeture?: (pdf: PDFDocumentProxy, modele: ModeleDocument) => Promise<void>;
  /** Fabrique de canvas pour dessiner les pages hors du DOM, dans le Worker. */
  CanvasFactory?: object;
}

export async function extraireDocument(donnees: Uint8Array, options: OptionsExtraction = {}): Promise<ModeleDocument> {
  const tache = getDocument({
    data: donnees,
    ...OPTIONS_PDFJS,
    ...(options.CanvasFactory ? { CanvasFactory: options.CanvasFactory } : {}),
  });
  try {
    const pdf = await tache.promise.catch((erreur: unknown) => {
      throw new ErreurExtraction(raisonDepuisErreurPdfjs(erreur), erreur);
    });
    const pages: PageModele[] = [];
    for (let numero = 1; numero <= pdf.numPages; numero++) {
      pages.push(await extrairePage(await pdf.getPage(numero), numero));
      options.progression?.(numero, pdf.numPages);
    }
    const modele = { pages, contientTexte: pages.some((page) => page.blocs.length > 0) };
    await options.avantFermeture?.(pdf, modele);
    return modele;
  } catch (erreur) {
    throw erreur instanceof ErreurExtraction ? erreur : new ErreurExtraction('inconnue', erreur);
  } finally {
    await tache.destroy();
  }
}

function raisonDepuisErreurPdfjs(erreur: unknown): RaisonEchec {
  const nom = erreur instanceof Error ? erreur.name : '';
  if (nom === 'PasswordException') return 'mot-de-passe';
  if (nom === 'InvalidPDFException') return 'pdf-invalide';
  return 'inconnue';
}

async function extrairePage(page: PDFPageProxy, numero: number): Promise<PageModele> {
  const vue = page.getViewport({ scale: 1 });
  const transformationVue = vue.transform as Matrice;
  const contenu = await page.getTextContent();
  // getOperatorList doit précéder la lecture des noms de police : c'est lui qui
  // charge les polices dans commonObjs.
  const operateurs = await page.getOperatorList();
  const { images, sequences } = parcourirOperateurs(
    operateurs.fnArray,
    operateurs.argsArray,
    transformationVue,
  );
  const blocs = construireBlocs(contenu, transformationVue, page, sequences);
  const liens = await extraireLiens(page, transformationVue);
  return {
    numero,
    largeur: vue.width,
    hauteur: vue.height,
    rotation: page.rotate,
    blocs,
    liens,
    images,
  };
}

// --- Liste d'opérateurs : images et couleur du texte -------------------------

interface SequenceTexte {
  texte: string;
  couleur: string | null;
}

interface EtatGraphique {
  ctm: Matrice;
  couleur: string | null;
}

const OPS_IMAGE = new Set<number>([
  OPS.paintImageXObject,
  OPS.paintInlineImageXObject,
  OPS.paintImageMaskXObject,
  // Variantes groupées ou répétées : la boîte retenue est celle de la matrice
  // courante, ce qui suffit à signaler la présence d'une image.
  OPS.paintImageXObjectRepeat,
  OPS.paintImageMaskXObjectRepeat,
  OPS.paintImageMaskXObjectGroup,
  OPS.paintInlineImageXObjectGroup,
]);

const OPS_TEXTE = new Set<number>([
  OPS.showText,
  OPS.showSpacedText,
  OPS.nextLineShowText,
  OPS.nextLineSetSpacingShowText,
]);

/**
 * Parcourt la liste d'opérateurs en suivant la pile graphique pour en tirer
 * la boîte des images et la couleur de chaque séquence de texte affichée.
 */
export function parcourirOperateurs(
  fnArray: readonly number[],
  argsArray: readonly unknown[],
  transformationVue: Matrice,
): { images: ImageModele[]; sequences: SequenceTexte[] } {
  let etat: EtatGraphique = { ctm: transformationVue, couleur: NOIR };
  const pile: EtatGraphique[] = [];
  const images: ImageModele[] = [];
  const sequences: SequenceTexte[] = [];

  fnArray.forEach((fn, i) => {
    const args = argsArray[i];
    switch (fn) {
      case OPS.save:
        pile.push({ ...etat });
        break;
      case OPS.restore:
        etat = pile.pop() ?? etat;
        break;
      case OPS.transform:
        if (estMatrice(args)) etat.ctm = Util.transform(etat.ctm, args) as Matrice;
        break;
      case OPS.paintFormXObjectBegin: {
        pile.push({ ...etat });
        const matrice = Array.isArray(args) ? args[0] : undefined;
        if (estMatrice(matrice)) etat.ctm = Util.transform(etat.ctm, matrice) as Matrice;
        break;
      }
      case OPS.paintFormXObjectEnd:
        etat = pile.pop() ?? etat;
        break;
      case OPS.setFillRGBColor:
        etat.couleur = couleurHex(args);
        break;
      // pdf.js convertit normalement toutes les couleurs en setFillRGBColor.
      // Les autres cas (motifs, espaces de couleur non convertis) restent inconnus.
      case OPS.setFillGray:
      case OPS.setFillCMYKColor:
      case OPS.setFillColor:
      case OPS.setFillColorN:
      case OPS.setFillTransparent:
        etat.couleur = null;
        break;
      default:
        if (OPS_IMAGE.has(fn)) {
          images.push(boiteCarreUnite(etat.ctm));
        } else if (OPS_TEXTE.has(fn) && Array.isArray(args)) {
          sequences.push({ texte: texteDesGlyphes(args[args.length - 1]), couleur: etat.couleur });
        }
    }
  });

  return { images, sequences };
}

function estMatrice(valeur: unknown): valeur is Matrice {
  return (
    (Array.isArray(valeur) || ArrayBuffer.isView(valeur)) &&
    (valeur as ArrayLike<unknown>).length === 6 &&
    Array.from(valeur as ArrayLike<unknown>).every((v) => typeof v === 'number')
  );
}

function couleurHex(args: unknown): string | null {
  const valeur = Array.isArray(args) ? args : [];
  const [premier] = valeur;
  if (typeof premier === 'string' && /^#[0-9a-f]{6}$/i.test(premier)) return premier.toLowerCase();
  // Anciennes versions de pdf.js : composantes r, g, b de 0 à 255.
  if (valeur.length === 3 && valeur.every((v) => typeof v === 'number')) {
    return Util.makeHexColor(valeur[0], valeur[1], valeur[2]).toLowerCase();
  }
  return null;
}

function texteDesGlyphes(glyphes: unknown): string {
  if (!Array.isArray(glyphes)) return '';
  return glyphes
    .map((glyphe: unknown) =>
      typeof glyphe === 'object' && glyphe !== null && 'unicode' in glyphe && typeof glyphe.unicode === 'string'
        ? glyphe.unicode
        : '',
    )
    .join('');
}

function boiteCarreUnite(ctm: Matrice): ImageModele {
  return boiteDesPoints(
    [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ].map(([x, y]) => appliquer(ctm, x ?? 0, y ?? 0)),
  );
}

// --- Contenu texte : blocs avec police, taille, position et couleur ----------

/** Caractères significatifs pour l'alignement : NFKC, sans espaces. */
function caracteres(texte: string): string[] {
  return Array.from(texte.normalize('NFKC').replace(/\s+/gu, ''));
}

function construireBlocs(
  contenu: TextContent,
  transformationVue: Matrice,
  page: PDFPageProxy,
  sequences: readonly SequenceTexte[],
): BlocTexte[] {
  // Flux des couleurs, un élément par caractère significatif, dans l'ordre
  // d'affichage. Les éléments de getTextContent suivent le même ordre.
  const fluxCaracteres: string[] = [];
  const fluxCouleurs: (string | null)[] = [];
  for (const sequence of sequences) {
    for (const caractere of caracteres(sequence.texte)) {
      fluxCaracteres.push(caractere);
      fluxCouleurs.push(sequence.couleur);
    }
  }
  let curseur = 0;
  let alignementRompu = false;

  const blocs: BlocTexte[] = [];
  for (const element of contenu.items) {
    if (!('str' in element)) continue;
    const attendus = caracteres(element.str);
    if (attendus.length === 0) continue;

    let couleur: string | null = null;
    if (!alignementRompu) {
      const trouves = fluxCaracteres.slice(curseur, curseur + attendus.length);
      if (trouves.join('') === attendus.join('')) {
        couleur = couleurDominante(fluxCouleurs.slice(curseur, curseur + attendus.length));
        curseur += attendus.length;
      } else {
        alignementRompu = true;
      }
    }

    const style = contenu.styles[element.fontName];
    const policeBrute = nomPolice(page, element.fontName) ?? style?.fontFamily ?? element.fontName;
    blocs.push({
      texte: element.str,
      policeBrute,
      police: policeBrute.replace(/^[A-Z]{6}\+/, ''),
      couleur,
      ...geometrieBloc(element, transformationVue, style?.ascent, style?.descent),
    });
  }
  return blocs;
}

/**
 * Couleur d'un bloc. S'il mélange plusieurs couleurs, on retient la plus
 * fréquente hors noir, pour qu'un mot coloré ne passe pas inaperçu.
 * null si une partie des caractères a une couleur inconnue.
 */
function couleurDominante(couleurs: readonly (string | null)[]): string | null {
  if (couleurs.some((c) => c === null)) return null;
  const comptes = new Map<string, number>();
  for (const c of couleurs) {
    if (c !== null && c !== NOIR) comptes.set(c, (comptes.get(c) ?? 0) + 1);
  }
  if (comptes.size === 0) return NOIR;
  return [...comptes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function nomPolice(page: PDFPageProxy, idPolice: string): string | null {
  try {
    if (!page.commonObjs.has(idPolice)) return null;
    const police: unknown = page.commonObjs.get(idPolice);
    if (typeof police === 'object' && police !== null && 'name' in police && typeof police.name === 'string') {
      return police.name;
    }
  } catch {
    // Police non résolue : on se rabat sur le style de getTextContent.
  }
  return null;
}

/** Ascendante et descendante par défaut, en fraction de la taille de police. */
const ASCENDANTE_DEFAUT = 0.8;
const DESCENDANTE_DEFAUT = -0.2;

function geometrieBloc(
  element: TextItem,
  transformationVue: Matrice,
  ascendante = ASCENDANTE_DEFAUT,
  descendante = DESCENDANTE_DEFAUT,
): Rectangle & { taille: number } {
  const matriceTexte = element.transform as Matrice;
  const m = Util.transform(transformationVue, matriceTexte) as Matrice;
  const taille = Math.hypot(m[2], m[3]);
  // Boîte du bloc dans l'espace du texte (en unités de police), puis dans la page.
  const echelleHorizontale = Math.hypot(matriceTexte[0], matriceTexte[1]) || 1;
  const largeurEnEm = element.width / echelleHorizontale;
  const boite = boiteDesPoints([
    appliquer(m, 0, descendante),
    appliquer(m, largeurEnEm, descendante),
    appliquer(m, 0, ascendante),
    appliquer(m, largeurEnEm, ascendante),
  ]);
  return { ...boite, taille };
}

// --- Liens ------------------------------------------------------------------

async function extraireLiens(page: PDFPageProxy, transformationVue: Matrice): Promise<Lien[]> {
  const annotations: unknown[] = await page.getAnnotations();
  const liens: Lien[] = [];
  for (const annotation of annotations) {
    if (typeof annotation !== 'object' || annotation === null) continue;
    const a = annotation as { subtype?: unknown; rect?: unknown; url?: unknown; unsafeUrl?: unknown };
    if (a.subtype !== 'Link' || !Array.isArray(a.rect) || a.rect.length !== 4) continue;
    const [x1, y1, x2, y2] = a.rect as number[];
    const url = typeof a.url === 'string' ? a.url : typeof a.unsafeUrl === 'string' ? a.unsafeUrl : null;
    liens.push({
      url,
      ...boiteDesPoints([
        appliquer(transformationVue, x1 ?? 0, y1 ?? 0),
        appliquer(transformationVue, x2 ?? 0, y2 ?? 0),
      ]),
    });
  }
  return liens;
}

// --- Géométrie ----------------------------------------------------------------

function appliquer(m: Matrice, x: number, y: number): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

function boiteDesPoints(points: readonly [number, number][]): Rectangle {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, largeur: Math.max(...xs) - x, hauteur: Math.max(...ys) - y };
}

// --- Protocole du Web Worker (types dans protocole.ts) ------------------------

/** Traite un message reçu par le Worker. Séparé du Worker pour être testable. */
export async function traiterMessage(message: MessageExtraction, options: OptionsExtraction = {}): Promise<ReponseExtraction> {
  try {
    return { ok: true, document: await extraireDocument(new Uint8Array(message.donnees), options) };
  } catch (erreur) {
    return { ok: false, raison: erreur instanceof ErreurExtraction ? erreur.raison : 'inconnue' };
  }
}
