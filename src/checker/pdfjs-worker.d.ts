// pdf.js ne fournit pas de déclaration pour son module Worker.
declare module 'pdfjs-dist/legacy/build/pdf.worker.mjs' {
  export const WorkerMessageHandler: unknown;
}
