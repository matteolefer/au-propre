/**
 * Registre des règles. R00 s'exécute seule, avant le découpage : si elle est
 * bloquante, aucune autre règle n'est lancée.
 */
import type { Decoupage, ModeleDocument, ResultatRegle } from '../types';
import { verifierR00 } from './R00-pdf-lisible';
import { verifierR02 } from './R02-partie1-pages';
import { verifierR03 } from './R03-partie2-pages';
import { verifierR04 } from './R04-annexes-pages';
import { verifierR11 } from './R11-format-a4';

export interface Regle {
  id: string;
  verifier: (document: ModeleDocument, decoupage: Decoupage) => ResultatRegle[];
}

export const verifierLisibilite = verifierR00;

export const REGLES: readonly Regle[] = [
  { id: 'R02', verifier: verifierR02 },
  { id: 'R03', verifier: verifierR03 },
  { id: 'R04', verifier: verifierR04 },
  { id: 'R11', verifier: verifierR11 },
];
