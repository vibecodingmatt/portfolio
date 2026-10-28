import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { projects, featuredId } from '../projects.js';
const html = await readFile('dist/index.html', 'utf8');
assert.equal(projects.length, 9);
assert.equal(featuredId, 'universal-orlando');
assert.match(html, /id="feature"\s+data-project="universal-orlando"/);
assert.match(
  html,
  /id="feature-launch"\s+href="https:\/\/vibecodingmatt.github.io\/universal-orlando\/"/,
);
for (const asset of [
  'universal-dragon.webp',
  'universal-train.webp',
  'universal-halloween.webp',
  'universal-orlando-social-v1.jpg',
]) {
  assert.ok((await stat('dist/assets/images/' + asset)).size > 1000);
}
assert.equal(new Set(projects.map((p) => p.id)).size, projects.length);
assert.equal((html.match(/class="project-card"/g) || []).length, projects.length);
assert.ok(!html.includes('<!-- PROJECT_'));
assert.match(
  html,
  /<link\s+rel="canonical"\s+href="https:\/\/vibecodingmatt.github.io\/portfolio\/"\s*\/?>/,
);
assert.match(html, /property="og:image"/);
assert.match(html, /application\/ld\+json/);
for (const p of projects) {
  for (const asset of [p.image, p.thumbnail, p.preview].filter(Boolean)) {
    const info = await stat('dist/' + asset);
    assert.ok(info.size > 1000, asset + ' is not empty');
  }
  assert.equal(new URL(p.url).protocol, 'https:');
}
assert.match(projects.find((p) => p.id === 'dino-roblox').url, /98883356694296/);
assert.equal(
  projects.find((p) => p.id === 'matts-angels').url,
  'https://www.youtube.com/watch?v=6ZtGgA6IDdE',
);
const social = await readFile('dist/assets/images/social.jpg');
const appsHtml = await readFile('dist/apps.html', 'utf8');
for (const id of ['tubeclock', 'bloxclock']) {
  assert.match(appsHtml, new RegExp(`id="${id}"`));
  assert.equal(projects.find((p) => p.id === id).category, 'apps');
  assert.equal(projects.find((p) => p.id === id).source, null);
}
assert.match(appsHtml, /releases\/download\/tubeclock-v1\.3\.0\/TubeClock-win-x64\.zip/);
assert.ok(
  !appsHtml.includes('BloxClock-win-x64.zip'),
  'Unreleased BloxClock installer is not linked',
);
assert.equal(social.readUInt16BE(0), 0xffd8);
const forbidden = ['node_modules', 'scripts', 'tests', 'artifacts', '.git', 'package.json'];
const publicFiles = await readdir('dist');
for (const name of forbidden) assert.ok(!publicFiles.includes(name), 'Build excludes ' + name);
for (const name of [
  'style.css',
  'apps.html',
  'main.js',
  'projects.js',
  'assets/fonts/manrope-latin-variable.woff2',
  'assets/favicon.svg',
  'sitemap.xml',
  'robots.txt',
  '.nojekyll',
])
  await stat('dist/' + name);
console.log(
  'Release checks passed: nine projects, Universal premiere, exact launch links, complete media, social metadata, relative assets, clean static build.',
);
