// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { SITE } from './src/content/site.ts';

export default defineConfig({
  // Adresse du site : URL canoniques, sitemap, image de partage.
  site: SITE.url,
  output: 'static',
  integrations: [react()],
  security: {
    // Politique de sécurité du contenu, native dans Astro : une balise meta par page,
    // avec les empreintes des scripts et styles en ligne d'Astro. Les en-têtes
    // qu'une balise meta ne peut pas porter (frame-ancestors…) sont dans public/_headers.
    csp: {
      directives: [
        "default-src 'self'",
        // Aperçus des pages du PDF : adresses blob: créées dans le navigateur.
        "img-src 'self' data: blob:",
        // Seule requête vers un autre site : les statistiques, absentes du vérificateur.
        "connect-src 'self' https://cloudflareinsights.com",
        "worker-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      scriptDirective: {
        resources: ["'self'", 'https://static.cloudflareinsights.com'],
      },
      styleDirective: {
        // Attributs style de l'exemple de l'accueil, rendu au build : position des zones surlignées.
        resources: ["'self'", { resource: "'unsafe-inline'", kind: 'attribute' }],
      },
    },
  },
  vite: {
    // pdf.js est un module ES : le Worker du vérificateur doit l'être aussi.
    worker: { format: 'es' },
    resolve: {
      // Version « legacy » de pdf.js : la version moderne exige des fonctions
      // JavaScript très récentes (Uint8Array.prototype.toHex,
      // Map.prototype.getOrInsertComputed) et échoue dans les navigateurs de
      // quelques mois, comme Safari sous macOS 12. Même paquet, même licence.
      alias: [{ find: /^pdfjs-dist$/, replacement: 'pdfjs-dist/legacy/build/pdf.mjs' }],
    },
  },
});
