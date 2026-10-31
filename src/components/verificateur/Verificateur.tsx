/**
 * Îlot React du vérificateur : paramètres, lecture du PDF dans le Worker,
 * découpage confirmé par le candidat, puis rapport. Tout se passe dans le
 * navigateur : le fichier n'est envoyé nulle part.
 */
import { useEffect, useRef, useState } from 'react';
import { extraireDansWorker } from '../../checker/extraction';
import { TAILLE_FICHIER_LOURD_OCTETS, TAILLE_FICHIER_MAX_OCTETS } from '../../checker/measure';
import type { ProgressionExtraction } from '../../checker/protocole';
import { analyser, construireRapport, pagesAnnexesEnImage, type Rapport as RapportType } from '../../checker/report';
import { verifierLisibilite } from '../../checker/rules';
import { proposerDecoupage, type DebutsDecoupage, type PropositionDecoupage } from '../../checker/split';
import type { Decoupage as DecoupageType, ModeleDocument, ResultatRegle } from '../../checker/types';
import { pointsChecklist, type PointChecklist } from '../../content/checklist.fr';
import { trouverConcours, trouverDiscipline } from '../../content/concours.fr';
import { ECHECS, ETAPES, type TexteEchec } from '../../content/interface.fr';
import { AnalyseImpossible } from './AnalyseImpossible';
import { Decoupage } from './Decoupage';
import { Lecture } from './Lecture';
import { Parametres, type ChampParametres } from './Parametres';
import { Rapport } from './Rapport';

interface DocumentLu {
  document: ModeleDocument;
  /** Adresses locales (blob:) des aperçus, révoquées quand on change de fichier. */
  miniatures: (string | null)[];
  proposition: PropositionDecoupage;
}

type Etat =
  | { etape: 'parametres'; echec: TexteEchec | null }
  | { etape: 'lecture'; progression: ProgressionExtraction | null }
  | { etape: 'impossible'; resultat: ResultatRegle }
  | { etape: 'decoupage'; lu: DocumentLu; debuts: DebutsDecoupage }
  | {
      etape: 'rapport';
      lu: DocumentLu;
      debuts: DebutsDecoupage;
      rapport: RapportType;
      checklist: PointChecklist[];
      date: Date;
    };

const NUMERO_ETAPE: Record<Etat['etape'], number> = { parametres: 1, lecture: 1, impossible: 1, decoupage: 2, rapport: 3 };

const TRAITEMENT_DE_TEXTE = /\.(docx?|odt|rtf|pages)$/i;

/** Vérifie le fichier choisi avant toute lecture : nombre, format, poids. */
function controlerFichiers(fichiers: FileList): { fichier: File } | { echec: TexteEchec } {
  const fichier = fichiers[0];
  if (fichiers.length > 1 || !fichier) return { echec: ECHECS.plusieurs() };
  if (TRAITEMENT_DE_TEXTE.test(fichier.name)) return { echec: ECHECS.traitementDeTexte(fichier.name) };
  if (fichier.type !== 'application/pdf' && !/\.pdf$/i.test(fichier.name)) return { echec: ECHECS.pasPdf(fichier.name) };
  if (fichier.size > TAILLE_FICHIER_MAX_OCTETS) return { echec: ECHECS.tropLourd(fichier.size) };
  return { fichier };
}

export function Verificateur() {
  const [concours, setConcours] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [fichier, setFichier] = useState<File | null>(null);
  const [manquants, setManquants] = useState<ReadonlySet<ChampParametres>>(new Set());
  const [etat, setEtat] = useState<Etat>({ etape: 'parametres', echec: null });
  const lectureEnCours = useRef<AbortController | null>(null);
  const titreRef = useRef<HTMLHeadingElement>(null);
  const premierAffichage = useRef(true);
  // Faux pendant le rendu serveur : les champs restent désactivés jusqu'à
  // l'hydratation, pour qu'aucun choix fait avant ne soit perdu.
  const [pret, setPret] = useState(false);
  useEffect(() => setPret(true), []);

  const concoursChoisi = trouverConcours(concours);
  const lu = etat.etape === 'decoupage' || etat.etape === 'rapport' ? etat.lu : null;

  // À chaque changement d'étape, le focus va sur son titre (lecteurs d'écran, clavier).
  useEffect(() => {
    if (premierAffichage.current) {
      premierAffichage.current = false;
      return;
    }
    titreRef.current?.focus();
  }, [etat.etape]);

  // Les aperçus sont des adresses locales : on les libère quand on change de fichier.
  useEffect(
    () => () => {
      for (const url of lu?.miniatures ?? []) if (url) URL.revokeObjectURL(url);
    },
    [lu],
  );

  // Un PDF lâché hors de la zone de dépôt ne doit pas remplacer la page (et le rapport).
  useEffect(() => {
    const empecher = (evenement: DragEvent) => {
      if (evenement.dataTransfer?.types.includes('Files')) evenement.preventDefault();
    };
    window.addEventListener('dragover', empecher);
    window.addEventListener('drop', empecher);
    return () => {
      window.removeEventListener('dragover', empecher);
      window.removeEventListener('drop', empecher);
      lectureEnCours.current?.abort();
    };
  }, []);

  const retirerManquant = (champ: ChampParametres) =>
    setManquants((actuels) => (actuels.has(champ) ? new Set([...actuels].filter((c) => c !== champ)) : actuels));

  const choisirFichiers = (fichiers: FileList) => {
    const controle = controlerFichiers(fichiers);
    if ('echec' in controle) {
      setFichier(null);
      setEtat({ etape: 'parametres', echec: controle.echec });
      return;
    }
    setFichier(controle.fichier);
    retirerManquant('fichier');
    setEtat({ etape: 'parametres', echec: null });
  };

  const revenirAuxParametres = () => {
    setFichier(null);
    setEtat({ etape: 'parametres', echec: null });
  };

  const lire = async () => {
    const absents = new Set<ChampParametres>();
    if (!concoursChoisi) absents.add('concours');
    // Sans concours, la liste des disciplines est désactivée : on ne la signale pas encore.
    if (concoursChoisi && concoursChoisi.disciplines.length > 0 && !discipline) absents.add('discipline');
    if (!fichier) absents.add('fichier');
    setManquants(absents);
    if (absents.size > 0 || !fichier) {
      const premier = ['concours', 'discipline', 'fichier'].find((champ) => absents.has(champ as ChampParametres));
      const cible = premier === 'fichier' ? '[data-testid="champ-fichier"]' : `#champ-${premier ?? 'concours'}`;
      window.document.querySelector<HTMLElement>(cible)?.focus();
      return;
    }

    const controleur = new AbortController();
    lectureEnCours.current = controleur;
    setEtat({ etape: 'lecture', progression: null });
    try {
      const reponse = await extraireDansWorker(fichier, {
        signal: controleur.signal,
        progression: (progression) =>
          setEtat((actuel) => (actuel.etape === 'lecture' ? { etape: 'lecture', progression } : actuel)),
      });
      if (!reponse.ok) {
        setEtat({ etape: 'parametres', echec: ECHECS.lecture[reponse.raison] });
        return;
      }
      const lisibilite = verifierLisibilite(reponse.document);
      if (lisibilite.gravite === 'bloquant') {
        setEtat({ etape: 'impossible', resultat: lisibilite });
        return;
      }
      const proposition = proposerDecoupage(reponse.document);
      const miniatures = (reponse.miniatures ?? []).map((blob) => (blob ? URL.createObjectURL(blob) : null));
      setEtat({ etape: 'decoupage', lu: { document: reponse.document, miniatures, proposition }, debuts: proposition.debuts });
    } catch (erreur) {
      const annulee = erreur instanceof DOMException && erreur.name === 'AbortError';
      setEtat({ etape: 'parametres', echec: annulee ? null : ECHECS.lecture.inconnue });
    } finally {
      if (lectureEnCours.current === controleur) lectureEnCours.current = null;
    }
  };

  const verifier = (decoupage: DecoupageType) => {
    if (etat.etape !== 'decoupage' || !fichier) return;
    const { document } = etat.lu;
    const parametres = { concours: concours || null, discipline: discipline || null, nomFichier: fichier.name };
    setEtat({
      etape: 'rapport',
      lu: etat.lu,
      debuts: etat.debuts,
      rapport: construireRapport(analyser(document, decoupage, parametres)),
      checklist: pointsChecklist({
        sansDiscipline: concoursChoisi?.disciplines.length === 0,
        pagesAnnexesEnImage: pagesAnnexesEnImage(document, decoupage),
      }),
      date: new Date(),
    });
  };

  const numero = NUMERO_ETAPE[etat.etape];
  const fichierLourd = fichier !== null && fichier.size > TAILLE_FICHIER_LOURD_OCTETS;

  return (
    <div className="v-verificateur">
      <nav className="v-etapes" aria-label={ETAPES.libelle}>
        <p className="v-visuellement-cache">{ETAPES.etat(numero, ETAPES.noms.length)}</p>
        <ol>
          {ETAPES.noms.map((nom, i) => (
            <li
              key={nom}
              className={`v-etapes__etape${i + 1 === numero ? ' v-etapes__etape--courante' : ''}${i + 1 < numero ? ' v-etapes__etape--faite' : ''}`}
              aria-current={i + 1 === numero ? 'step' : undefined}
            >
              <span className="v-etapes__numero" aria-hidden="true">
                {i + 1}
              </span>
              {nom}
            </li>
          ))}
        </ol>
      </nav>

      {etat.etape === 'parametres' && (
        <Parametres
          concours={concours}
          discipline={discipline}
          fichier={fichier}
          fichierLourd={fichierLourd}
          actif={pret}
          echec={etat.echec}
          manquants={manquants}
          titreRef={titreRef}
          onConcours={(id) => {
            setConcours(id);
            // Une discipline d'un autre concours n'a plus de sens.
            if (!trouverDiscipline(trouverConcours(id), discipline)) setDiscipline('');
            retirerManquant('concours');
          }}
          onDiscipline={(id) => {
            setDiscipline(id);
            retirerManquant('discipline');
          }}
          onFichiers={choisirFichiers}
          onLire={() => void lire()}
        />
      )}

      {etat.etape === 'lecture' && fichier && (
        <Lecture
          nomFichier={fichier.name}
          progression={etat.progression}
          titreRef={titreRef}
          onAnnuler={() => lectureEnCours.current?.abort()}
        />
      )}

      {etat.etape === 'impossible' && (
        <AnalyseImpossible resultat={etat.resultat} titreRef={titreRef} onAutreFichier={revenirAuxParametres} />
      )}

      {etat.etape === 'decoupage' && (
        <Decoupage
          document={etat.lu.document}
          miniatures={etat.lu.miniatures}
          proposition={etat.lu.proposition}
          debuts={etat.debuts}
          titreRef={titreRef}
          onDebuts={(debuts) => setEtat({ ...etat, debuts })}
          onConfirmer={verifier}
          onAutreFichier={revenirAuxParametres}
        />
      )}

      {etat.etape === 'rapport' && fichier && concoursChoisi && (
        <Rapport
          rapport={etat.rapport}
          nomFichier={fichier.name}
          poids={fichier.size}
          fichierLourd={fichierLourd}
          nombrePages={etat.lu.document.pages.length}
          miniatures={etat.lu.miniatures}
          concours={concoursChoisi.libelle}
          discipline={trouverDiscipline(concoursChoisi, discipline)?.libelle ?? null}
          date={etat.date}
          checklist={etat.checklist}
          titreRef={titreRef}
          onModifier={() => setEtat({ etape: 'decoupage', lu: etat.lu, debuts: etat.debuts })}
          onAutreFichier={revenirAuxParametres}
        />
      )}
    </div>
  );
}
