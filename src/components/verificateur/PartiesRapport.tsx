/**
 * Parties du rapport réutilisées telles quelles par l'aperçu de la page
 * d'accueil : les compteurs du résumé et un groupe de contrôles.
 */
import type { CleGroupe, Rapport } from '../../checker/report';
import type { Gravite, ResultatRegle } from '../../checker/types';
import { RAPPORT } from '../../content/interface.fr';
import { Controle } from './Controle';
import { IconeGravite } from './Icones';

export const GRAVITE_DU_GROUPE: Record<CleGroupe, Gravite> = {
  aCorriger: 'erreur',
  aVerifier: 'avertissement',
  conforme: 'conforme',
  informations: 'info',
};

const COMPTEURS = ['aCorriger', 'aVerifier', 'conforme'] as const;

export function CompteursRapport({ resume }: { resume: Rapport['resume'] }) {
  return (
    <ul className="v-compteurs">
      {COMPTEURS.map((cle) => (
        <li className={`v-compteur v-compteur--${GRAVITE_DU_GROUPE[cle]}`} key={cle}>
          <IconeGravite gravite={GRAVITE_DU_GROUPE[cle]} className="v-icone v-compteur__icone" />
          <span className="v-compteur__nombre">{resume[cle]}</span>
          <span className="v-compteur__libelle">{RAPPORT.resume.compteurs[cle](resume[cle])}</span>
        </li>
      ))}
    </ul>
  );
}

interface ProprietesGroupe {
  cle: CleGroupe;
  resultats: readonly ResultatRegle[];
  /** Aperçus des pages (adresses locales), pour situer les zones en faute. */
  miniatures?: readonly (string | null)[];
}

export function GroupeRapport({ cle, resultats, miniatures = [] }: ProprietesGroupe) {
  const textes = RAPPORT.groupes[cle];
  return (
    <section className={`v-groupe v-groupe--${GRAVITE_DU_GROUPE[cle]}`} aria-labelledby={`groupe-${cle}`}>
      <h3 className="v-groupe__titre" id={`groupe-${cle}`}>
        <IconeGravite gravite={GRAVITE_DU_GROUPE[cle]} className="v-icone v-groupe__icone" />
        {textes.titre}
        <span className="v-groupe__nombre">{resultats.length}</span>
      </h3>
      {textes.intro && resultats.length > 0 && <p className="v-groupe__intro">{textes.intro}</p>}
      {resultats.length > 0 ? (
        <ul className="v-controles">
          {resultats.map((resultat, i) => (
            <Controle resultat={resultat} miniatures={miniatures} key={`${resultat.id}-${i}`} />
          ))}
        </ul>
      ) : (
        <p className="v-vide">{textes.vide}</p>
      )}
    </section>
  );
}
