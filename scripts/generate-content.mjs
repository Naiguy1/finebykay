import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readSets, projectRoot } from './content.mjs';

const sets = readSets();
mkdirSync(resolve(projectRoot, 'src/data'), { recursive: true });
writeFileSync(resolve(projectRoot, 'src/data/sets.generated.json'), JSON.stringify(sets, null, 2) + '\n');
