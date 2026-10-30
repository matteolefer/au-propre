/**
 * Identification des polices à partir de leur nom PostScript, tel qu'il figure
 * dans le PDF (ex. « BCDEEE+Arial-BoldMT »).
 */

export type ClassePolice = 'arial' | 'substitut' | 'symbole' | 'inconnue' | 'autre';

/** Styles reconnus après le nom de famille, séparés par « - » ou « , ». */
const STYLES = new Set(['', 'regular', 'roman', 'normal', 'bold', 'italic', 'oblique', 'bolditalic', 'boldoblique']);

/** Polices aux mêmes dimensions qu'Arial, utilisées quand Arial n'est pas installée. */
const SUBSTITUTS = new Set(['liberationsans', 'arimo']);

/** Polices de puces et de symboles : elles n'entrent pas dans le contrôle de la police. */
const SYMBOLES = new Set(['symbol', 'wingdings', 'wingdings2', 'wingdings3', 'webdings', 'zapfdingbats', 'dingbats', 'opensymbol']);

export function nomSansPrefixe(nom: string): string {
  return nom.replace(/^[A-Z]{6}\+/, '');
}

/** Famille et style, sans préfixe de sous-ensemble ni suffixe « MT » / « PSMT ». */
export function analyserNomPolice(nom: string): { famille: string; style: string } {
  const complet = nomSansPrefixe(nom).replace(/\s+/g, '');
  const separateur = complet.search(/[-,]/);
  const famille = separateur === -1 ? complet : complet.slice(0, separateur);
  const style = separateur === -1 ? '' : complet.slice(separateur + 1);
  return {
    famille: famille.replace(/(PS)?MT$/, ''),
    style: style.replace(/(PS)?MT$/, ''),
  };
}

export function classerPolice(nom: string): ClassePolice {
  // Identifiant interne de pdf.js : le PDF ne donne pas le nom de la police.
  if (/^g_d\d+_f\d+$/.test(nom)) return 'inconnue';
  const { famille, style } = analyserNomPolice(nom);
  const familleMin = famille.toLowerCase();
  if (SYMBOLES.has(familleMin)) return 'symbole';
  // « Arial-Black » ou « Arial-Narrow » : autre police que l'Arial imposée.
  if (!STYLES.has(style.toLowerCase())) return 'autre';
  if (familleMin === 'arial') return 'arial';
  if (SUBSTITUTS.has(familleMin)) return 'substitut';
  return 'autre';
}

/** Nom lisible de la famille : « LiberationSans » devient « Liberation Sans ». */
export function nomAffiche(nom: string): string {
  if (classerPolice(nom) === 'inconnue') return 'police non identifiée';
  const { famille, style } = analyserNomPolice(nom);
  const lisible = famille.replace(/([a-z])([A-Z])/g, '$1 $2');
  return STYLES.has(style.toLowerCase()) ? lisible : `${lisible} ${style.replace(/([a-z])([A-Z])/g, '$1 $2')}`;
}
