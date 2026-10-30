// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  output: 'static',
  integrations: [react()],
  vite: {
    // pdf.js est un module ES : le Worker du vérificateur doit l'être aussi.
    worker: { format: 'es' },
  },
});
