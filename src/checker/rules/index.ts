/**
 * Registre des règles. R00 s'exécute seule, avant le découpage : si elle est
 * bloquante, aucune autre règle n'est lancée.
 */
import type { Decoupage, ModeleDocument, ParametresDossier, ResultatRegle } from '../types';
import { verifierR00 } from './R00-pdf-lisible';
import { verifierR01 } from './R01-couverture';
import { verifierR02 } from './R02-partie1-pages';
import { verifierR03 } from './R03-partie2-pages';
import { verifierR04 } from './R04-annexes-pages';
import { verifierR05 } from './R05-police-arial';
import { verifierR06 } from './R06-taille';
import { verifierR07 } from './R07-interligne';
import { verifierR08 } from './R08-marges-laterales';
import { verifierR09 } from './R09-en-tete-pied';
import { verifierR10 } from './R10-retrait';
import { verifierR11 } from './R11-format-a4';
import { verifierR12 } from './R12-pagination';
import { verifierR13 } from './R13-couleur';
import { verifierR14 } from './R14-sommaire';
import { verifierR15 } from './R15-cv';
import { verifierR16 } from './R16-documents-interdits';
import { verifierR17 } from './R17-liens';
import { verifierR18 } from './R18-hggsp';
import { verifierR19 } from './R19-nom-fichier';

export interface Regle {
  id: string;
  verifier: (document: ModeleDocument, decoupage: Decoupage, parametres: ParametresDossier) => ResultatRegle[];
}

export const verifierLisibilite = verifierR00;

export const REGLES: readonly Regle[] = [
  { id: 'R01', verifier: (document, decoupage, parametres) => verifierR01(document, decoupage, parametres) },
  { id: 'R02', verifier: verifierR02 },
  { id: 'R03', verifier: verifierR03 },
  { id: 'R04', verifier: verifierR04 },
  { id: 'R05', verifier: verifierR05 },
  { id: 'R06', verifier: verifierR06 },
  { id: 'R07', verifier: verifierR07 },
  { id: 'R08', verifier: verifierR08 },
  { id: 'R09', verifier: verifierR09 },
  { id: 'R10', verifier: verifierR10 },
  { id: 'R11', verifier: verifierR11 },
  { id: 'R12', verifier: verifierR12 },
  { id: 'R13', verifier: verifierR13 },
  { id: 'R14', verifier: verifierR14 },
  { id: 'R15', verifier: verifierR15 },
  { id: 'R16', verifier: verifierR16 },
  { id: 'R17', verifier: verifierR17 },
  { id: 'R18', verifier: verifierR18 },
  { id: 'R19', verifier: verifierR19 },
];
