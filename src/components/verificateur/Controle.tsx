/** Un résultat de contrôle dans le rapport : mesure, pages, correction, sources. */
import type { ResultatRegle, Source, ZoneEnFaute } from '../../checker/types';
import { NOMS_GRAVITES, RAPPORT } from '../../content/interface.fr';
import { LIBELLES_REGLES, listePages } from '../../content/rules.fr';
import { IconeGravite } from './Icones';

const TEXTES = RAPPORT.controle;

/** « pages 2 à 4 » → « 2 à 4 », après le libellé « Pages concernées ». */
function pagesSansLibelle(pages: readonly number[]): string {
  return listePages(pages).replace(/^pages?[\s ]/, '');
}

export function LiensSources({ sources }: { sources: readonly Source[] }) {
  return (
    <>
      {sources.map((source, i) => (
        <span key={source.url}>
          {i > 0 && ' ; '}
          <a href={source.url} target="_blank" rel="noopener noreferrer" className="v-source">
            {source.libelle}
            <span className="v-visuellement-cache"> {TEXTES.nouvelOnglet}</span>
          </a>
        </span>
      ))}
    </>
  );
}

/** Position d'une zone en pourcentage de la page, pour la poser sur l'aperçu. */
function styleZone(zone: ZoneEnFaute): React.CSSProperties {
  const pourcent = (valeur: number, total: number) => `${((valeur / total) * 100).toFixed(2)}%`;
  return {
    left: pourcent(zone.x, zone.largeurPage),
    top: pourcent(zone.y, zone.hauteurPage),
    width: pourcent(zone.largeur, zone.largeurPage),
    height: pourcent(zone.hauteur, zone.hauteurPage),
  };
}

/** Aperçu de la première page concernée, avec ses zones en faute surlignées. */
function ApercuPage({ zones, miniatures }: { zones: readonly ZoneEnFaute[]; miniatures: readonly (string | null)[] }) {
  const page = zones[0]?.page;
  const url = page === undefined ? null : (miniatures[page - 1] ?? null);
  if (page === undefined || url === null) return null;
  return (
    <div className="v-controle__apercu">
      <dt>{TEXTES.apercu}</dt>
      <dd>
        <figure className="v-apercu-page">
          <div className="v-apercu-page__cadre">
            <img src={url} alt={TEXTES.apercuImage(page)} />
            {zones
              .filter((zone) => zone.page === page)
              .map((zone, i) => (
                <span className="v-zone" style={styleZone(zone)} key={i} aria-hidden="true" />
              ))}
          </div>
          <figcaption>{TEXTES.apercuLegende(page)}</figcaption>
        </figure>
      </dd>
    </div>
  );
}

export function Controle({ resultat, miniatures = [] }: { resultat: ResultatRegle; miniatures?: readonly (string | null)[] }) {
  const { gravite } = resultat;
  const compact = gravite === 'conforme';
  const etat = gravite === 'bloquant' ? NOMS_GRAVITES.erreur : NOMS_GRAVITES[gravite];
  return (
    <li className={`v-controle v-controle--${gravite}${compact ? ' v-controle--compact' : ''}`} data-regle={resultat.id}>
      <IconeGravite gravite={gravite} className="v-icone v-controle__icone" />
      <div className="v-controle__corps">
        <h4 className="v-controle__titre">
          <span className="v-visuellement-cache">{etat}&nbsp;: </span>
          {resultat.titre}
        </h4>
        <p className="v-controle__regle">
          <span className="v-visuellement-cache">{TEXTES.regle} </span>
          <span className="v-controle__id">{resultat.id}</span> {LIBELLES_REGLES[resultat.id]}
        </p>
        <dl className="v-controle__details">
          <div>
            <dt className={compact ? 'v-visuellement-cache' : undefined}>{TEXTES.mesure}</dt>
            <dd>{resultat.detail}</dd>
          </div>
          {!compact && resultat.pages && resultat.pages.length > 0 && (
            <div>
              <dt>{TEXTES.pages}</dt>
              <dd>{pagesSansLibelle(resultat.pages)}</dd>
            </div>
          )}
          {resultat.correction !== '' && (
            <div>
              <dt>{TEXTES.correction}</dt>
              <dd>{resultat.correction}</dd>
            </div>
          )}
          {resultat.zones && resultat.zones.length > 0 && <ApercuPage zones={resultat.zones} miniatures={miniatures} />}
          {resultat.sources.length > 0 && (
            <div className="v-controle__sources">
              <dt>{resultat.sources.length > 1 ? TEXTES.sources : TEXTES.source}</dt>
              <dd>
                <LiensSources sources={resultat.sources} />
              </dd>
            </div>
          )}
        </dl>
      </div>
    </li>
  );
}
