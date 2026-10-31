/**
 * Concours et disciplines proposés au candidat (SPEC §4).
 *
 * Disciplines recopiées de la page officielle des sections ouvertes en 2027
 * (mise à jour d'octobre 2026). Les sections documentation et éducation
 * musicale et chant choral du CAPES interne sont écartées : elles passent par
 * une épreuve écrite, sans dossier RAEP (S3).
 *
 * CAER : même liste que le concours public correspondant, dont les épreuves
 * sont identiques (S1). La page officielle ne publie pas de liste propre au CAER.
 */
import { CONCOURS_CPE } from '../checker/rules/nombre-pages';
import { DISCIPLINE_HISTOIRE_GEOGRAPHIE } from '../checker/rules/R18-hggsp';
import type { Source } from '../checker/types';
import { SOURCES } from './rules.fr';

const ESP = ' ';

export const SOURCE_SECTIONS: Source = {
  libelle: 'Sections et options des concours de recrutement d’enseignants du second degré ouvertes en 2027',
  url: 'https://www.devenirenseignant.gouv.fr/sections-et-options-des-concours-de-recrutement-d-enseignants-du-second-degre-ouvertes-en-2027-1803',
};

/** Sections du CAPES interne sans RAEP, signalées sous la liste des disciplines. */
export const SECTIONS_SANS_RAEP = {
  texte: `Les sections documentation et éducation musicale et chant choral du CAPES interne passent par une épreuve écrite${ESP}: elles n’ont pas de dossier RAEP.`,
  source: SOURCES.S3,
};

export interface Discipline {
  id: string;
  libelle: string;
}

export interface Concours {
  id: string;
  libelle: string;
  /** Vide pour le CPE, qui n'a pas de discipline. */
  disciplines: readonly Discipline[];
}

function d(id: string, libelle: string): Discipline {
  return { id, libelle };
}

const LVE = `Langues vivantes étrangères${ESP}:`;

const DISCIPLINES_CAPES: readonly Discipline[] = [
  d('arts-plastiques', 'Arts plastiques'),
  d(DISCIPLINE_HISTOIRE_GEOGRAPHIE, 'Histoire et géographie'),
  d('langues-kanak-drehu', `Langues kanak${ESP}: drehu`),
  d('lve-allemand', `${LVE} allemand`),
  d('lve-anglais', `${LVE} anglais`),
  d('lve-espagnol', `${LVE} espagnol`),
  d('lve-italien', `${LVE} italien`),
  d('lve-portugais', `${LVE} portugais`),
  d('lettres-classiques', `Lettres${ESP}: lettres classiques`),
  d('lettres-modernes', `Lettres${ESP}: lettres modernes`),
  d('mathematiques', 'Mathématiques'),
  d('philosophie', 'Philosophie'),
  d('physique-chimie', 'Physique - chimie'),
  d('svt', 'Sciences de la vie et de la Terre'),
  d('ses', 'Sciences économiques et sociales'),
  d('tahitien', 'Tahitien'),
];

const DISCIPLINES_CAPLP: readonly Discipline[] = [
  d('batiment-peinture-revetements', 'Bâtiment option peinture - revêtements'),
  d('biotechnologies-sante-environnement', 'Biotechnologies option santé - environnement'),
  d('coiffure', 'Coiffure'),
  d('conducteurs-routiers', 'Conducteurs routiers'),
  d('design-metiers-art-design', 'Design et métiers d’art option design'),
  d('design-metiers-art-metiers-art', 'Design et métiers d’art option métiers d’art'),
  d('economie-gestion-commerce-vente', 'Économie et gestion option commerce et vente'),
  d('esthetique-cosmetique', 'Esthétique - cosmétique'),
  d('genie-chimique', 'Génie chimique'),
  d('genie-civil-construction-economie', 'Génie civil option construction et économie'),
  d('genie-civil-construction-realisation', 'Génie civil option construction et réalisation des ouvrages'),
  d('genie-electrique-electronique', 'Génie électrique option électronique'),
  d('genie-electrique-electrotechnique', 'Génie électrique option électrotechnique et énergie'),
  d('genie-industriel-materiaux-souples', 'Génie industriel option matériaux souples'),
  d('genie-industriel-plastiques-composites', 'Génie industriel option plastiques et composites'),
  d('genie-industriel-structures-metalliques', 'Génie industriel option structures métalliques'),
  d('genie-mecanique-construction', 'Génie mécanique option construction'),
  d('genie-mecanique-msma', 'Génie mécanique option maintenance des systèmes mécaniques automatisés'),
  d('genie-mecanique-maintenance-vehicules', 'Génie mécanique option maintenance des véhicules, machines agricoles, engins de chantier'),
  d('hotellerie-restauration-service', 'Hôtellerie - restauration option service et commercialisation'),
  d('langues-lettres-anglais', `Langues vivantes - lettres${ESP}: anglais - lettres`),
  d('langues-lettres-espagnol', `Langues vivantes - lettres${ESP}: espagnol - lettres`),
  d('lettres-histoire-geographie', 'Lettres - histoire et géographie'),
  d('mathematiques-physique-chimie', 'Mathématiques - physique chimie'),
  d('stms', 'Sciences et techniques médico - sociales'),
  d('horticulture', `Sections diverses${ESP}: horticulture`),
];

const DISCIPLINES_CAPET: readonly Discipline[] = [
  d('design-metiers-art', 'Design et métiers d’art'),
  d('biotechnologies-biochimie', 'Biotechnologies option biochimie - génie biologique'),
  d('economie-gestion-rh', 'Économie et gestion option communication, organisation et gestion des ressources humaines'),
  d('economie-gestion-comptabilite', 'Économie et gestion option comptabilité et finance'),
  d('economie-gestion-informatique', 'Économie et gestion option informatique et systèmes d’information'),
  d('economie-gestion-marketing', 'Économie et gestion option marketing'),
  d('stms', 'Sciences et techniques médico - sociales'),
  d('sii-electrique', 'Sciences industrielles de l’ingénieur option ingénierie électrique'),
  d('sii-informatique', 'Sciences industrielles de l’ingénieur option ingénierie informatique'),
  d('sii-mecanique', 'Sciences industrielles de l’ingénieur option ingénierie mécanique'),
];

/** Les 7 concours de SPEC §4, dans cet ordre. */
export const CONCOURS: readonly Concours[] = [
  { id: 'capes-interne', libelle: 'CAPES interne', disciplines: DISCIPLINES_CAPES },
  { id: 'caer-capes', libelle: 'CAER-CAPES (enseignement privé)', disciplines: DISCIPLINES_CAPES },
  { id: 'caplp-interne', libelle: 'CAPLP interne', disciplines: DISCIPLINES_CAPLP },
  { id: 'caer-caplp', libelle: 'CAER-CAPLP (enseignement privé)', disciplines: DISCIPLINES_CAPLP },
  { id: 'capet-interne', libelle: 'CAPET interne', disciplines: DISCIPLINES_CAPET },
  { id: 'caer-capet', libelle: 'CAER-CAPET (enseignement privé)', disciplines: DISCIPLINES_CAPET },
  { id: CONCOURS_CPE, libelle: 'CPE interne', disciplines: [] },
];

export function trouverConcours(id: string): Concours | undefined {
  return CONCOURS.find((concours) => concours.id === id);
}

export function trouverDiscipline(concours: Concours | undefined, id: string): Discipline | undefined {
  return concours?.disciplines.find((discipline) => discipline.id === id);
}
