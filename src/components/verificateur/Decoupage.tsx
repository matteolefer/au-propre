/**
 * Étape 2 : découpage proposé, à confirmer ou corriger. Les aperçus des pages
 * se rangent sous leur section à chaque changement. Rien n'est analysé avant
 * la confirmation.
 */
import { useMemo } from 'react';
import { texteDePage } from '../../checker/recherche';
import {
  construireDecoupage,
  sectionDeLaPage,
  type DebutsDecoupage,
  type ErreurDecoupage,
  type PropositionDecoupage,
  type Section,
} from '../../checker/split';
import type { Decoupage as DecoupageType, ModeleDocument, Plage } from '../../checker/types';
import { DECOUPAGE } from '../../content/interface.fr';
import { IconeAvertissement, IconeConforme } from './Icones';

interface Proprietes {
  document: ModeleDocument;
  miniatures: readonly (string | null)[];
  proposition: PropositionDecoupage;
  debuts: DebutsDecoupage;
  titreRef: React.Ref<HTMLHeadingElement>;
  onDebuts: (debuts: DebutsDecoupage) => void;
  onConfirmer: (decoupage: DecoupageType) => void;
  onAutreFichier: () => void;
}

type Champ = keyof DebutsDecoupage;
const CHAMPS: readonly Champ[] = ['partie1', 'partie2', 'annexes'];
const SECTIONS: readonly Section[] = ['couverture', 'partie1', 'partie2', 'annexes'];

function plageDe(section: Section, decoupage: DecoupageType): Plage | null {
  return decoupage[section];
}

export function Decoupage(props: Proprietes) {
  const { document, miniatures, proposition, debuts, titreRef } = props;
  const total = document.pages.length;
  const resultat = construireDecoupage(debuts, total);
  const erreurs = new Map<Champ, ErreurDecoupage>(resultat.ok ? [] : resultat.erreurs.map((e) => [e.champ, e]));
  const supposes = CHAMPS.some((champ) => proposition.origines[champ] === 'suppose');

  // Première ligne de chaque page : repère quand l'aperçu manque.
  const premieresLignes = useMemo(
    () => document.pages.map((page) => texteDePage(page).lignes[0]?.texte ?? ''),
    [document],
  );

  const changer = (champ: Champ, valeur: string) => {
    const page = valeur === '' ? null : Number(valeur);
    props.onDebuts({ ...debuts, [champ]: champ === 'annexes' ? page : (page ?? 1) });
  };

  const confirmer = () => {
    if (resultat.ok) {
      props.onConfirmer(resultat.decoupage);
      return;
    }
    // Saisie invalide : le focus va sur la première liste à corriger.
    const premier = CHAMPS.find((champ) => erreurs.has(champ));
    if (premier) window.document.getElementById(`champ-${premier}`)?.focus();
  };

  const pages = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <section className="v-etape" aria-labelledby="titre-etape">
      <h2 className="v-etape__titre" id="titre-etape" ref={titreRef} tabIndex={-1}>
        {DECOUPAGE.titre}
      </h2>
      <p className="v-intro">{DECOUPAGE.intro}</p>
      {supposes && (
        <p className="v-note v-note--avertissement">
          <IconeAvertissement className="v-icone v-note__icone" />
          <span>{DECOUPAGE.supposes}</span>
        </p>
      )}

      <div className="v-decoupage">
        <form
          className="v-carte v-decoupage__reglages"
          noValidate
          onSubmit={(evenement) => {
            evenement.preventDefault();
            confirmer();
          }}
        >
          {CHAMPS.map((champ) => {
            const erreur = erreurs.get(champ);
            const modifie = debuts[champ] !== proposition.debuts[champ];
            const origine = proposition.origines[champ];
            const valeur = debuts[champ];
            return (
              <div className="v-champ" key={champ}>
                <label className="v-libelle" htmlFor={`champ-${champ}`}>
                  {DECOUPAGE.champs[champ]}
                </label>
                <select
                  id={`champ-${champ}`}
                  className="v-select v-select--court"
                  value={valeur === null ? '' : String(valeur)}
                  aria-invalid={erreur ? true : undefined}
                  aria-describedby={[`origine-${champ}`, erreur ? `erreur-${champ}` : null].filter(Boolean).join(' ')}
                  onChange={(evenement) => changer(champ, evenement.currentTarget.value)}
                >
                  {champ === 'annexes' && <option value="">{DECOUPAGE.sansAnnexes}</option>}
                  {pages.map((n) => (
                    <option key={n} value={n}>
                      {DECOUPAGE.page(n)}
                    </option>
                  ))}
                </select>
                <p className={`v-origine${!modifie && origine === 'suppose' ? ' v-origine--suppose' : ''}`} id={`origine-${champ}`}>
                  {modifie ? null : origine === 'detecte' ? (
                    <>
                      <IconeConforme className="v-icone v-origine__icone" />
                      {DECOUPAGE.origine.detecte}
                    </>
                  ) : (
                    <>
                      <IconeAvertissement className="v-icone v-origine__icone" />
                      {DECOUPAGE.origine.suppose}
                    </>
                  )}
                </p>
                {erreur && (
                  <p className="v-erreur-champ" id={`erreur-${champ}`}>
                    {DECOUPAGE.erreurs[erreur.code](total)}
                  </p>
                )}
              </div>
            );
          })}

          {resultat.ok && (
            <div className="v-resume-decoupage">
              <h3 className="v-sous-titre">{DECOUPAGE.resumeTitre}</h3>
              <ul>
                {SECTIONS.map((section) => {
                  const plage = plageDe(section, resultat.decoupage);
                  if (plage) return <li key={section}>{DECOUPAGE.resume(section, plage)}</li>;
                  return <li key={section}>{section === 'couverture' ? DECOUPAGE.aucuneCouverture : DECOUPAGE.aucuneAnnexe}</li>;
                })}
              </ul>
            </div>
          )}

          <div className="v-actions v-actions--colonne">
            <button type="submit" className="v-bouton v-bouton--principal">
              {DECOUPAGE.confirmer}
            </button>
            <button type="button" className="v-bouton v-bouton--texte" onClick={props.onAutreFichier}>
              {DECOUPAGE.autreFichier}
            </button>
          </div>
        </form>

        <div className="v-decoupage__apercus">
          <h3 className="v-sous-titre">{DECOUPAGE.apercus}</h3>
          <p className="v-aide">{DECOUPAGE.apercusAide}</p>
          {resultat.ok ? (
            SECTIONS.map((section) => {
              const plage = plageDe(section, resultat.decoupage);
              if (!plage) return null;
              const pagesSection = pages.filter((n) => sectionDeLaPage(n, resultat.decoupage) === section);
              return (
                <section className="v-section-pages" key={section} aria-label={DECOUPAGE.resume(section, plage)}>
                  <h4 className="v-section-pages__titre">{DECOUPAGE.resume(section, plage)}</h4>
                  <ListeMiniatures pages={pagesSection} {...{ document, miniatures, premieresLignes }} />
                </section>
              );
            })
          ) : (
            <ListeMiniatures pages={pages} {...{ document, miniatures, premieresLignes }} />
          )}
        </div>
      </div>
    </section>
  );
}

interface ProprietesListe {
  pages: readonly number[];
  document: ModeleDocument;
  miniatures: readonly (string | null)[];
  premieresLignes: readonly string[];
}

function ListeMiniatures({ pages, document, miniatures, premieresLignes }: ProprietesListe) {
  return (
    <ol className="v-miniatures">
      {pages.map((numero) => {
        const page = document.pages[numero - 1];
        const url = miniatures[numero - 1] ?? null;
        const ligne = premieresLignes[numero - 1] ?? '';
        return (
          <li className="v-miniature" key={numero}>
            <div
              className="v-miniature__cadre"
              style={page ? { aspectRatio: `${page.largeur} / ${page.hauteur}` } : undefined}
            >
              {url ? (
                <img src={url} alt="" decoding="async" />
              ) : (
                <span className="v-miniature__texte">{ligne || DECOUPAGE.sansTexte}</span>
              )}
            </div>
            <span className="v-miniature__numero">{DECOUPAGE.page(numero)}</span>
          </li>
        );
      })}
    </ol>
  );
}
