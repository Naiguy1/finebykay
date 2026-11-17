import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { projectRoot, readSets, renderSetPage, setPath, siteOrigin } from './content.mjs';

const sets = readSets();
const template = readFileSync(resolve(projectRoot, 'dist/index.html'), 'utf8');
for (const set of sets) {
  const directory = resolve(projectRoot, `dist${setPath(set.id)}`);
  mkdirSync(directory, { recursive: true });
  writeFileSync(resolve(directory, 'index.html'), renderSetPage(template, set));
}
const urls = ['/', ...sets.map((set) => setPath(set.id))];
writeFileSync(resolve(projectRoot, 'dist/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((path) => `  <url><loc>${siteOrigin}${path}</loc></url>`).join('\n')}\n</urlset>\n`);
