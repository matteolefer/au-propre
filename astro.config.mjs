// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { SITE } from './src/content/site.ts';

export default defineConfig({
  // Adresse du site (provisoire tant que le domaine n'est pas réservé) : URL canoniques, sitemap.
  site: SITE.url,
  output: 'static',
  integrations: [react()],
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
