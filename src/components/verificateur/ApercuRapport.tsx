/**
 * Aperçu du rapport pour la page d'accueil, rendu au build sans JavaScript :
 * les vrais composants du rapport, sur un dossier fictif, présentés comme une
 * feuille du logo (coin corné, trait de marge bleu).
 */
import { construireRapport } from '../../checker/report';
import { APERCU, MINIATURES_EXEMPLE, RESULTATS_EXEMPLE } from '../../content/apercu.fr';
import { CompteursRapport, GroupeRapport } from './PartiesRapport';

const GROUPES = ['aCorriger', 'aVerifier', 'conforme'] as const;

export function ApercuRapport() {
  const rapport = construireRapport(RESULTATS_EXEMPLE);
  return (
    <figure className="apercu">
      <div className="apercu__ombre">
        <div className="apercu__feuille">
          <div className="apercu__entete">
            <span className="apercu__titre">{APERCU.feuille}</span>
            <span className="apercu__fichier">{APERCU.fichier}</span>
          </div>
          <h2 className="v-visuellement-cache">{APERCU.titre}</h2>
          <CompteursRapport resume={rapport.resume} />
          {GROUPES.map((cle) => (
            <GroupeRapport cle={cle} resultats={rapport.groupes[cle]} miniatures={MINIATURES_EXEMPLE} key={cle} />
          ))}
        </div>
      </div>
      <figcaption className="apercu__legende">{APERCU.legende}</figcaption>
    </figure>
  );
}
