/** Checklist manuelle (SPEC §6) : cases à cocher, rien n'est enregistré. */
import { useState } from 'react';
import type { PointChecklist } from '../../content/checklist.fr';
import { RAPPORT } from '../../content/interface.fr';
import { LiensSources } from './Controle';

const TEXTES = RAPPORT.checklist;

export function Checklist({ points }: { points: readonly PointChecklist[] }) {
  const [coches, setCoches] = useState<ReadonlySet<string>>(new Set());
  const basculer = (id: string) =>
    setCoches((actuels) => {
      const suivants = new Set(actuels);
      if (suivants.has(id)) suivants.delete(id);
      else suivants.add(id);
      return suivants;
    });

  return (
    <section className="v-groupe v-checklist" aria-labelledby="titre-checklist">
      <h3 className="v-groupe__titre" id="titre-checklist">
        {TEXTES.titre}
      </h3>
      <p className="v-groupe__intro">{TEXTES.intro}</p>
      <p className="v-checklist__compteur" role="status">
        {TEXTES.compteur(coches.size, points.length)}
      </p>
      <ul className="v-checklist__liste">
        {points.map((point) => (
          <li className="v-checklist__point" key={point.id}>
            <input
              type="checkbox"
              id={`checklist-${point.id}`}
              className="v-case"
              checked={coches.has(point.id)}
              onChange={() => basculer(point.id)}
            />
            <div className="v-checklist__texte">
              <label htmlFor={`checklist-${point.id}`}>{point.texte}</label>
              {point.precision && <p className="v-checklist__precision">{point.precision}</p>}
              <p className="v-checklist__sources">
                {point.sources.length > 1 ? RAPPORT.controle.sources : RAPPORT.controle.source}&nbsp;:{' '}
                <LiensSources sources={point.sources} />
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
