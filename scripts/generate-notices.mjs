import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { projectRoot } from './content.mjs';

const lock = JSON.parse(readFileSync(resolve(projectRoot, 'package-lock.json'), 'utf8'));
const sections = ['Third-party software included in the finebykay browser build.\nFonts retain their SIL Open Font License.'];
for (const [path, entry] of Object.entries(lock.packages)) {
  if (!path || entry.dev) continue;
  const directory = resolve(projectRoot, path);
  const files = readdirSync(directory).filter((name) => /^(?:licen[cs]e|copying|copyright|notice)(?:\.|$)/i.test(name));
  if (!files.length) throw new Error(`Missing upstream license text: ${path}`);
  sections.push(`${path.replace(/^node_modules\//, '')} ${entry.version} (${entry.license})\n${files.map((name) => readFileSync(resolve(directory, name), 'utf8')).join('\n')}`);
}
mkdirSync(resolve(projectRoot, 'dist/licenses'), { recursive: true });
writeFileSync(resolve(projectRoot, 'dist/licenses/third-party-software.txt'), sections.join('\n\n--------------------\n\n'));
