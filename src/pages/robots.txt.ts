/**
 * Consignes aux robots d'indexation : tout le site, et l'adresse du plan du site.
 * Les mentions légales ne sont pas bloquées : un robot doit pouvoir y lire le `noindex`.
 */
import type { APIRoute } from 'astro';
import { urlAbsolue } from '../content/site';

export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${urlAbsolue('/sitemap.xml')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
