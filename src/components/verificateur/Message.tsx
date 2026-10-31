/** Message d'échec ou d'analyse impossible : ce qui ne va pas, puis comment corriger. */
import { ECHECS, type TexteEchec } from '../../content/interface.fr';
import { IconeErreur, IconeInfo } from './Icones';

interface Proprietes {
  texte: TexteEchec;
  /** « neutre » : l'analyse est impossible, mais le dossier n'enfreint aucune règle (R00). */
  ton?: 'erreur' | 'neutre';
  /** Titre en h2 quand le message est le contenu principal de l'étape, sinon en paragraphe. */
  titreRef?: React.Ref<HTMLHeadingElement>;
  role?: 'alert';
}

export function Message({ texte, titreRef, role, ton = 'erreur' }: Proprietes) {
  const Icone = ton === 'neutre' ? IconeInfo : IconeErreur;
  return (
    <div className={`v-message v-message--${ton}`} {...(role ? { role } : {})}>
      <Icone className="v-icone v-message__icone" />
      <div className="v-message__corps">
        {titreRef ? (
          <h2 className="v-message__titre" id="titre-etape" ref={titreRef} tabIndex={-1}>
            {texte.titre}
          </h2>
        ) : (
          <p className="v-message__titre">{texte.titre}</p>
        )}
        <p>{texte.detail}</p>
        <p className="v-message__correction">
          <strong>{ECHECS.correction}</strong>
          <br />
          {texte.correction}
        </p>
      </div>
    </div>
  );
}
