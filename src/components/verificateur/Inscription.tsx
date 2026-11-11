/**
 * Encart d'inscription facultative, juste après le rapport. Le lien ouvre le
 * formulaire du service d'e-mail tel quel, dans un nouvel onglet et sans
 * référent : rien du dossier ni du rapport ne lui est transmis.
 */
import { INSCRIPTION } from '../../content/interface.fr';
import { PAGES_DU_SITE, SITE } from '../../content/site';

export function Inscription({ url }: { url: string }) {
  return (
    <section className="v-carte v-inscription" aria-labelledby="titre-inscription">
      <h3 className="v-sous-titre" id="titre-inscription">
        {INSCRIPTION.titre}
      </h3>
      <p className="v-intro">{INSCRIPTION.texte}</p>
      <p className="v-intro">{INSCRIPTION.option}</p>
      <a className="v-bouton v-bouton--secondaire" href={url} target="_blank" rel="noopener noreferrer">
        {INSCRIPTION.bouton}
        <span className="v-visuellement-cache"> {INSCRIPTION.nouvelOnglet}</span>
      </a>
      <p className="v-inscription__independance">{INSCRIPTION.independance}</p>
      <p className="v-aide">
        {INSCRIPTION.note(SITE.inscription.service)}{' '}
        <a href={`${PAGES_DU_SITE.confidentialite.chemin}#inscription`}>{INSCRIPTION.confidentialite}</a>
      </p>
    </section>
  );
}
