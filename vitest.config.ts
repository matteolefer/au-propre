import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // En Node, pdf.js recommande sa version « legacy ». Le code de l'application,
    // lui, importe « pdfjs-dist » normalement.
    alias: [{ find: /^pdfjs-dist$/, replacement: 'pdfjs-dist/legacy/build/pdf.mjs' }],
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 30_000,
  },
});
