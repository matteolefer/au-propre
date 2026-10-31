/** PDF sans couche texte (scan) : R00 bloque l'analyse et explique pourquoi. */
import type { ResultatRegle } from '../../checker/types';
import { IMPOSSIBLE } from '../../content/interface.fr';
import { Message } from './Message';

interface Proprietes {
  resultat: ResultatRegle;
  titreRef: React.Ref<HTMLHeadingElement>;
  onAutreFichier: () => void;
}

export function AnalyseImpossible({ resultat, titreRef, onAutreFichier }: Proprietes) {
  return (
    <section className="v-etape" aria-labelledby="titre-etape">
      <Message texte={resultat} titreRef={titreRef} ton="neutre" />
      <div className="v-actions">
        <button type="button" className="v-bouton v-bouton--principal" onClick={onAutreFichier}>
          {IMPOSSIBLE.autreFichier}
        </button>
      </div>
    </section>
  );
}
