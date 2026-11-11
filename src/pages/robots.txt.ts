/** robots.txt, dont le texte est défini dans src/content/site.ts. */
import type { APIRoute } from 'astro';
import { texteRobots } from '../content/site';

export const GET: APIRoute = () =>
  new Response(texteRobots(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
