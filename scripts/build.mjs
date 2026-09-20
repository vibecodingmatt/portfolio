import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderIndex } from './template.mjs';
const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = path.join(root, 'dist');
// The only removed directory is this project's generated, absolute dist path.
if (path.dirname(dist) !== root || path.basename(dist) !== 'dist')
  throw new Error('Invalid build destination');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await writeFile(
  path.join(dist, 'index.html'),
  renderIndex(await readFile(path.join(root, 'index.html'), 'utf8')),
);
for (const name of [
  'style.css',
  'main.js',
  'projects.js',
  'assets',
  'robots.txt',
  'sitemap.xml',
  '.nojekyll',
])
  await cp(path.join(root, name), path.join(dist, name), { recursive: true });
console.log('Built static portfolio in dist/ — ready for /portfolio/ on GitHub Pages.');
