/** Étape 3 : le rapport, imprimable. Résumé, groupes de contrôles, checklist, inscription facultative. */
import { ORDRE_GROUPES, type Rapport as RapportType } from '../../checker/report';
import type { Source } from '../../checker/types';
import type { PointChecklist } from '../../content/checklist.fr';
import { dateEtHeure, PARAMETRES, poidsFichier, RAPPORT } from '../../content/interface.fr';
import { inscriptionActive, SITE } from '../../content/site';
import { Checklist } from './Checklist';
import { Inscription } from './Inscription';
import { CompteursRapport, GroupeRapport } from './PartiesRapport';

interface Proprietes {
  rapport: RapportType;
  nomFichier: string;
  poids: number;
  fichierLourd: boolean;
  nombrePages: number;
  /** Aperçus des pages (adresses locales), pour situer les zones en faute. */
  miniatures: readonly (string | null)[];
  concours: string;
  discipline: string | null;
  date: Date;
  checklist: readonly PointChecklist[];
  titreRef: React.Ref<HTMLHeadingElement>;
  onModifier: () => void;
  onAutreFichier: () => void;
}

/** Sources distinctes du rapport et de la checklist, dans l'ordre de première citation. */
function sourcesCitees(rapport: RapportType, checklist: readonly PointChecklist[]): Source[] {
  const parUrl = new Map<string, Source>();
  const toutes = [...ORDRE_GROUPES.flatMap((cle) => rapport.groupes[cle]), ...checklist].flatMap((element) => element.sources);
  for (const source of toutes) if (!parUrl.has(source.url)) parUrl.set(source.url, source);
  return [...parUrl.values()];
}

export function Rapport(props: Proprietes) {
  const { rapport, titreRef } = props;
  const erreurs = rapport.resume.aCorriger;
  return (
    <section className="v-etape v-rapport" aria-labelledby="titre-etape">
      <header className="v-rapport__entete">
        <h2 className="v-etape__titre" id="titre-etape" ref={titreRef} tabIndex={-1}>
          {RAPPORT.titre}
        </h2>
        <dl className="v-meta">
          <div>
            <dt>{RAPPORT.meta.fichier}</dt>
            <dd>
              {props.nomFichier} ({RAPPORT.meta.pages(props.nombrePages)}, {poidsFichier(props.poids)})
            </dd>
          </div>
          <div>
            <dt>{RAPPORT.meta.concours}</dt>
            <dd>{props.concours}</dd>
          </div>
          {props.discipline && (
            <div>
              <dt>{RAPPORT.meta.discipline}</dt>
              <dd>{props.discipline}</dd>
            </div>
          )}
          <div>
            <dt>{RAPPORT.meta.date}</dt>
            <dd>{dateEtHeure(props.date)}</dd>
          </div>
        </dl>
        <p className="v-aide">{RAPPORT.confidentialite}</p>
        {props.fichierLourd && <p className="v-note">{PARAMETRES.lourd}</p>}
      </header>

      <section className="v-carte v-resume" aria-labelledby="titre-resume">
        <h3 className="v-visuellement-cache" id="titre-resume">
          {RAPPORT.resume.titre}
        </h3>
        <CompteursRapport resume={rapport.resume} />
        <p className="v-resume__phrase">{erreurs > 0 ? RAPPORT.resume.avecErreurs(erreurs) : RAPPORT.resume.sansErreur}</p>
        <p className="v-aide">{RAPPORT.resume.portee}</p>
        <div className="v-actions v-actions--rapport">
          <button type="button" className="v-bouton v-bouton--principal" onClick={() => window.print()}>
            {RAPPORT.actions.imprimer}
          </button>
          <button type="button" className="v-bouton v-bouton--secondaire" onClick={props.onModifier}>
            {RAPPORT.actions.modifier}
          </button>
          <button type="button" className="v-bouton v-bouton--texte" onClick={props.onAutreFichier}>
            {RAPPORT.actions.autreFichier}
          </button>
        </div>
      </section>

      {ORDRE_GROUPES.map((cle) =>
        cle === 'informations' && rapport.groupes[cle].length === 0 ? null : (
          <GroupeRapport cle={cle} resultats={rapport.groupes[cle]} miniatures={props.miniatures} key={cle} />
        ),
      )}

      <Checklist points={props.checklist} />

      {inscriptionActive() && <Inscription url={SITE.inscription.formulaireUrl} />}

      <section className="v-sources-citees v-imprime-seulement" aria-labelledby="titre-sources">
        <h3 className="v-groupe__titre" id="titre-sources">
          {RAPPORT.sourcesCitees.titre}
        </h3>
        <p className="v-groupe__intro">{RAPPORT.sourcesCitees.intro}</p>
        <ul>
          {sourcesCitees(rapport, props.checklist).map((source) => (
            <li key={source.url}>
              {source.libelle}
              {'\u00A0'}: {source.url}
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
