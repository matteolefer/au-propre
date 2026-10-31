/**
 * Zone de dépôt : un vrai champ fichier, caché visuellement mais utilisable au
 * clavier, dans une étiquette qui accepte aussi le glisser-déposer.
 */
import { useState } from 'react';
import { PARAMETRES, poidsFichier } from '../../content/interface.fr';
import { IconeFichier } from './Icones';

interface Proprietes {
  fichier: File | null;
  /** Faux avant l'hydratation de l'îlot. */
  actif: boolean;
  manquant: boolean;
  /** Fichiers choisis ou déposés ; la vérification de leur type et de leur poids revient au parent. */
  onChoix: (fichiers: FileList) => void;
}

const TEXTES = PARAMETRES.fichier;

export function DepotFichier({ fichier, actif, manquant, onChoix }: Proprietes) {
  const [survol, setSurvol] = useState(false);
  const decrit = [fichier ? 'fichier-nom' : null, manquant ? 'fichier-erreur' : null, 'fichier-confidentialite'].filter(Boolean).join(' ');

  return (
    <div className="v-champ">
      <span className="v-libelle" id="fichier-libelle">
        {TEXTES.libelle}
      </span>
      <label
        className={`v-depot${survol ? ' v-depot--survol' : ''}${fichier ? ' v-depot--rempli' : ''}${manquant ? ' v-depot--invalide' : ''}`}
        onDragEnter={(evenement) => {
          evenement.preventDefault();
          setSurvol(true);
        }}
        onDragOver={(evenement) => {
          evenement.preventDefault();
          evenement.dataTransfer.dropEffect = 'copy';
        }}
        onDragLeave={(evenement) => {
          // Quitter un élément enfant ne fait pas quitter la zone.
          if (!evenement.currentTarget.contains(evenement.relatedTarget as Node | null)) setSurvol(false);
        }}
        onDrop={(evenement) => {
          evenement.preventDefault();
          setSurvol(false);
          if (evenement.dataTransfer.files.length > 0) onChoix(evenement.dataTransfer.files);
        }}
      >
        <input
          type="file"
          className="v-visuellement-cache"
          accept=".pdf,application/pdf"
          disabled={!actif}
          aria-labelledby="fichier-libelle fichier-action"
          aria-describedby={decrit}
          aria-invalid={manquant || undefined}
          data-testid="champ-fichier"
          onChange={(evenement) => {
            const fichiers = evenement.currentTarget.files;
            if (fichiers && fichiers.length > 0) onChoix(fichiers);
            // Permet de choisir de nouveau le même fichier après une correction.
            evenement.currentTarget.value = '';
          }}
        />
        <IconeFichier className="v-icone v-depot__icone" />
        {fichier ? (
          <span className="v-depot__fichier" id="fichier-nom">
            <span className="v-depot__nom">{fichier.name}</span>
            <span className="v-depot__poids">{poidsFichier(fichier.size)}</span>
          </span>
        ) : (
          <span className="v-depot__invite">
            <span className="v-depot__glisser">{TEXTES.glisser}</span>
            <span className="v-depot__ou"> {TEXTES.ou} </span>
          </span>
        )}
        <span className="v-bouton v-bouton--secondaire v-depot__bouton" id="fichier-action">
          {fichier ? TEXTES.changer : TEXTES.choisir}
        </span>
      </label>
      {manquant && (
        <p className="v-erreur-champ" id="fichier-erreur">
          {TEXTES.manquant}
        </p>
      )}
      <p className="v-confidentialite" id="fichier-confidentialite">
        {TEXTES.confidentialite}
      </p>
    </div>
  );
}
