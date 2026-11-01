/**
 * Contrôle du site livré (dist/) avant le déploiement : aucun nom de personne,
 * aucune métadonnée d'auteur, aucun commentaire de développement, aucun champ
 * « à compléter », aucune adresse provisoire. Échoue (code 1) au moindre défaut.
 *
 *     npm run build && npm run verifier:livraison
 *
 * Les noms cherchés ne sont jamais écrits dans le dépôt : ils sont lus au
 * lancement dans `git config` (nom et début de l'e-mail), dans le nom du compte
 * de l'ordinateur et dans la variable NOMS_INTERDITS (« Prénom,Nom »). En CI,
 * aucun de ces noms n'est connu : seuls les contrôles de structure s'appliquent.
 */
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { userInfo } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const TEXTE = new Set(['.html', '.js', '.mjs', '.css', '.xml', '.txt', '.svg', '.webmanifest', '.json', '']);
/** Seuls commentaires HTML admis : les marqueurs vides qu'Astro et React insèrent eux-mêmes. */
const COMMENTAIRES_ADMIS = new Set(['<!-- -->', '<!--astro:end-->']);
const CLES_MANIFESTE = ['background_color', 'description', 'display', 'icons', 'lang', 'name', 'short_name', 'theme_color'];
/** Blocs PNG qui portent du texte ou des métadonnées (auteur, logiciel, EXIF). */
const BLOCS_PNG_INTERDITS = new Set(['tEXt', 'zTXt', 'iTXt', 'eXIf']);
const MOTIFS_INTERDITS = [
  { motif: /à compléter/i, message: 'champ « à compléter »' },
  { motif: /pages\.dev|workers\.dev/i, message: 'adresse provisoire de Cloudflare' },
  { motif: /raep.?check/i, message: 'ancien nom du projet' },
];

function fichiers(dossier) {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = path.join(dossier, nom);
    return statSync(chemin).isDirectory() ? fichiers(chemin) : [chemin];
  });
}

function lire(commande) {
  try {
    return execSync(commande, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

/** Noms de personne à chercher, en minuscules, d'au moins 4 lettres. Jamais affichés. */
function nomsInterdits() {
  if (process.env['CI']) return [];
  const sources = [
    lire('git config user.name'),
    lire('git config user.email').split('@')[0] ?? '',
    userInfo().username,
    process.env['NOMS_INTERDITS'] ?? '',
  ];
  const mots = sources.flatMap((source) => source.split(/[\s,._+-]+/)).map((mot) => mot.toLowerCase());
  return [...new Set(mots.filter((mot) => mot.length >= 4 && !['root', 'runner', 'user'].includes(mot)))];
}

function blocsPng(octets) {
  const blocs = [];
  for (let position = 8; position + 8 <= octets.length; ) {
    const longueur = octets.readUInt32BE(position);
    blocs.push(octets.toString('latin1', position + 4, position + 8));
    position += 12 + longueur;
  }
  return blocs;
}

const defauts = [];
const noms = nomsInterdits();

for (const chemin of fichiers(DIST)) {
  const relatif = path.relative(DIST, chemin);
  const extension = path.extname(chemin).toLowerCase();
  const octets = readFileSync(chemin);
  const brut = octets.toString('latin1').toLowerCase();
  const signaler = (message) => defauts.push(`${relatif} : ${message}`);

  noms.forEach((nom, i) => {
    if (brut.includes(nom)) signaler(`nom de personne n° ${i + 1} trouvé (lu dans git config, le compte ou NOMS_INTERDITS)`);
  });

  if (extension === '.png' && blocsPng(octets).some((bloc) => BLOCS_PNG_INTERDITS.has(bloc))) {
    signaler(`métadonnées PNG (${blocsPng(octets).filter((b) => BLOCS_PNG_INTERDITS.has(b)).join(', ')})`);
  }
  if (!TEXTE.has(extension)) continue;

  const texte = octets.toString('utf8');
  for (const { motif, message } of MOTIFS_INTERDITS) if (motif.test(texte)) signaler(message);

  if (extension === '.html') {
    if (/<meta[^>]+name=["']?(author|generator)/i.test(texte)) signaler('balise meta author ou generator');
    for (const [commentaire] of texte.matchAll(/<!--[\s\S]*?-->/g)) {
      if (!COMMENTAIRES_ADMIS.has(commentaire)) signaler(`commentaire HTML livré : ${commentaire.slice(0, 60)}`);
    }
  }
  if (extension === '.svg' && /<metadata|<!--|sodipodi:|inkscape:|dc:creator/i.test(texte)) {
    signaler('métadonnées ou commentaire dans un SVG');
  }
  if (extension === '.webmanifest') {
    const cles = Object.keys(JSON.parse(texte)).sort();
    if (cles.join() !== CLES_MANIFESTE.join()) signaler(`clés inattendues dans le manifeste : ${cles.join(', ')}`);
  }
}

if (defauts.length > 0) {
  console.error(`Site livré : ${defauts.length} défaut(s)\n${defauts.map((d) => `  - ${d}`).join('\n')}`);
  process.exit(1);
}
console.log(`Site livré : ${fichiers(DIST).length} fichiers contrôlés, ${noms.length} nom(s) cherché(s), aucun défaut.`);
