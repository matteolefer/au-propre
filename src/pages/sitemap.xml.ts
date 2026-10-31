/** Plan du site pour les moteurs de recherche : les pages publiques, sans la 404. */
import type { APIRoute } from 'astro';
import { PAGES_DU_SITE, urlAbsolue } from '../content/site';

export const GET: APIRoute = () => {
  const urls = Object.values(PAGES_DU_SITE)
    .map((page) => `  <url><loc>${urlAbsolue(page.chemin)}</loc></url>`)
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
