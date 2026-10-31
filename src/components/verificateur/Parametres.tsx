/** Étape 1 : concours, discipline et fichier. */
import { CONCOURS, SECTIONS_SANS_RAEP, SOURCE_SECTIONS, trouverConcours } from '../../content/concours.fr';
import { PARAMETRES, RAPPORT, type TexteEchec } from '../../content/interface.fr';
import { DepotFichier } from './DepotFichier';
import { Message } from './Message';

export type ChampParametres = 'concours' | 'discipline' | 'fichier';

interface Proprietes {
  concours: string;
  discipline: string;
  fichier: File | null;
  fichierLourd: boolean;
  /** Faux avant l'hydratation de l'îlot : les champs ne répondent pas encore. */
  actif: boolean;
  echec: TexteEchec | null;
  manquants: ReadonlySet<ChampParametres>;
  titreRef: React.Ref<HTMLHeadingElement>;
  onConcours: (id: string) => void;
  onDiscipline: (id: string) => void;
  onFichiers: (fichiers: FileList) => void;
  onLire: () => void;
}

export function Parametres(props: Proprietes) {
  const { concours, discipline, fichier, fichierLourd, actif, echec, manquants, titreRef } = props;
  const concoursChoisi = trouverConcours(concours);
  const avecDiscipline = concoursChoisi === undefined || concoursChoisi.disciplines.length > 0;
  const estCapes = concours === 'capes-interne' || concours === 'caer-capes';

  return (
    <section className="v-etape" aria-labelledby="titre-etape">
      <h2 className="v-etape__titre" id="titre-etape" ref={titreRef} tabIndex={-1}>
        {PARAMETRES.titre}
      </h2>

      {echec && <Message texte={echec} role="alert" />}

      <form
        className="v-carte v-formulaire"
        noValidate
        onSubmit={(evenement) => {
          evenement.preventDefault();
          props.onLire();
        }}
      >
        <div className="v-champ">
          <label className="v-libelle" htmlFor="champ-concours">
            {PARAMETRES.concours.libelle}
          </label>
          <select
            id="champ-concours"
            className="v-select"
            value={concours}
            disabled={!actif}
            aria-invalid={manquants.has('concours') || undefined}
            aria-describedby={manquants.has('concours') ? 'concours-erreur' : undefined}
            onChange={(evenement) => props.onConcours(evenement.currentTarget.value)}
          >
            <option value="">{PARAMETRES.concours.choisir}</option>
            {CONCOURS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.libelle}
              </option>
            ))}
          </select>
          {manquants.has('concours') && (
            <p className="v-erreur-champ" id="concours-erreur">
              {PARAMETRES.concours.manquant}
            </p>
          )}
        </div>

        {avecDiscipline && (
          <div className="v-champ">
            <label className="v-libelle" htmlFor="champ-discipline">
              {PARAMETRES.discipline.libelle}
            </label>
            <select
              id="champ-discipline"
              className="v-select"
              value={discipline}
              disabled={!actif || concoursChoisi === undefined}
              aria-invalid={manquants.has('discipline') || undefined}
              aria-describedby={['discipline-aide', manquants.has('discipline') ? 'discipline-erreur' : null].filter(Boolean).join(' ')}
              onChange={(evenement) => props.onDiscipline(evenement.currentTarget.value)}
            >
              <option value="">{PARAMETRES.discipline.choisir}</option>
              {concoursChoisi?.disciplines.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.libelle}
                </option>
              ))}
            </select>
            {manquants.has('discipline') && (
              <p className="v-erreur-champ" id="discipline-erreur">
                {PARAMETRES.discipline.manquant}
              </p>
            )}
            <p className="v-aide" id="discipline-aide">
              {PARAMETRES.discipline.aide}{' '}
              <a href={SOURCE_SECTIONS.url} target="_blank" rel="noopener noreferrer">
                {PARAMETRES.discipline.source}
                <span className="v-visuellement-cache"> {RAPPORT.controle.nouvelOnglet}</span>
              </a>
              .
            </p>
            {estCapes && (
              <p className="v-aide">
                {SECTIONS_SANS_RAEP.texte}{' '}
                <a href={SECTIONS_SANS_RAEP.source.url} target="_blank" rel="noopener noreferrer">
                  {SECTIONS_SANS_RAEP.source.libelle}
                  <span className="v-visuellement-cache"> {RAPPORT.controle.nouvelOnglet}</span>
                </a>
                .
              </p>
            )}
          </div>
        )}

        <DepotFichier fichier={fichier} actif={actif} manquant={manquants.has('fichier')} onChoix={props.onFichiers} />

        {fichier && fichierLourd && (
          <p className="v-note" role="status">
            {PARAMETRES.lourd}
          </p>
        )}

        <div className="v-actions">
          <button type="submit" className="v-bouton v-bouton--principal" disabled={!actif}>
            {PARAMETRES.bouton}
          </button>
        </div>
      </form>
    </section>
  );
}
