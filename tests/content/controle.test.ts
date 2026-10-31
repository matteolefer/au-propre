/** Aperçu de la page dans un contrôle : miniature et zones surlignées, posées en pourcentage. */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Controle } from '../../src/components/verificateur/Controle';
import { RESULTATS_EXEMPLE } from '../../src/content/apercu.fr';

const R08 = RESULTATS_EXEMPLE.find((r) => r.id === 'R08')!;

describe('aperçu de la page concernée', () => {
  it('miniature de la première page, zones en pourcentage, légende en texte', () => {
    const html = renderToStaticMarkup(createElement(Controle, { resultat: R08, miniatures: [null, 'blob:page-2'] }));
    expect(html).toContain('<img src="blob:page-2" alt="Aperçu de la page 2"/>');
    expect(html.match(/class="v-zone"/g)).toHaveLength(2);
    expect(html).toContain('left:9.52%');
    expect(html).toContain('Page 2 : zone en faute surlignée.');
  });

  it('sans miniature (navigateur sans OffscreenCanvas) : pas d’aperçu', () => {
    const html = renderToStaticMarkup(createElement(Controle, { resultat: R08, miniatures: [] }));
    expect(html).not.toContain('v-apercu-page');
  });
});
