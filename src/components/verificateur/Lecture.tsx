/** Lecture du PDF dans le Worker : avancement page par page. */
import type { ProgressionExtraction } from '../../checker/protocole';
import { LECTURE } from '../../content/interface.fr';

interface Proprietes {
  nomFichier: string;
  progression: ProgressionExtraction | null;
  titreRef: React.Ref<HTMLHeadingElement>;
  onAnnuler: () => void;
}

/** Part de la lecture dans l'avancement total : le dessin des aperçus vient ensuite. */
const PART_LECTURE = 0.7;

function avancement(progression: ProgressionExtraction | null): number {
  if (!progression || progression.total === 0) return 0;
  const fraction = progression.page / progression.total;
  return progression.etape === 'lecture' ? fraction * PART_LECTURE : PART_LECTURE + fraction * (1 - PART_LECTURE);
}

export function Lecture({ nomFichier, progression, titreRef, onAnnuler }: Proprietes) {
  const etat = progression ? LECTURE.etat(progression.etape, progression.page, progression.total) : LECTURE.ouverture;
  return (
    <section className="v-etape" aria-labelledby="titre-etape" aria-busy="true">
      <h2 className="v-etape__titre" id="titre-etape" ref={titreRef} tabIndex={-1}>
        {LECTURE.titre}
      </h2>
      <div className="v-carte v-lecture">
        <p className="v-lecture__fichier">{nomFichier}</p>
        <progress className="v-progression" max={1} value={avancement(progression)} aria-labelledby="lecture-etat" />
        <p className="v-lecture__etat" id="lecture-etat" role="status">
          {etat}
        </p>
        <p className="v-aide">{LECTURE.note}</p>
        <div className="v-actions">
          <button type="button" className="v-bouton v-bouton--texte" onClick={onAnnuler}>
            {LECTURE.annuler}
          </button>
        </div>
      </div>
    </section>
  );
}
