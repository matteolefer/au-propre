// pdf.js ne fournit pas de déclaration pour son module Worker.
declare module 'pdfjs-dist/build/pdf.worker.mjs' {
  export const WorkerMessageHandler: unknown;
}
