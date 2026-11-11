/**
 * Encart d'inscription facultative, juste après le rapport. Le lien ouvre le
 * formulaire du service d'e-mail tel quel, dans un nouvel onglet et sans
 * référent : rien du dossier ni du rapport ne lui est transmis. Le rapport
 * s'affiche dans le navigateur : les textes suivent l'heure de l'ordinateur,
 * et le rappel n'est plus proposé une fois envoyé.
 */
import { INSCRIPTION, textesInscription } from '../../content/interface.fr';
import { PAGES_DU_SITE, SITE } from '../../content/site';

export function Inscription({ url, maintenant = new Date() }: { url: string; maintenant?: Date }) {
  const textes = textesInscription(maintenant);
  return (
    <section className="v-carte v-inscription" aria-labelledby="titre-inscription">
      <h3 className="v-sous-titre" id="titre-inscription">
        {textes.titre}
      </h3>
      <p className="v-intro">{textes.texte}</p>
      {textes.option && <p className="v-intro">{textes.option}</p>}
      <a className="v-bouton v-bouton--secondaire" href={url} target="_blank" rel="noopener noreferrer">
        {textes.bouton}
        <span className="v-visuellement-cache"> {INSCRIPTION.nouvelOnglet}</span>
      </a>
      <p className="v-inscription__independance">{INSCRIPTION.independance}</p>
      <p className="v-aide">
        {textes.note(SITE.inscription.service)}{' '}
        <a href={`${PAGES_DU_SITE.confidentialite.chemin}#inscription`}>{INSCRIPTION.confidentialite}</a>
      </p>
    </section>
  );
}
