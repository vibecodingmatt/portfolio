import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import { createServer } from '../scripts/serve.mjs';
import { projects } from '../projects.js';

await mkdir('artifacts', { recursive: true });
let server;
if (!process.env.TEST_URL) {
  server = createServer({ directory: path.resolve('dist') });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
}
const base = process.env.TEST_URL || `http://127.0.0.1:${server.address().port}/portfolio/`;
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : process.platform === 'win32'
      ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' }
      : {}),
});
const errors = [],
  failedAssets = [],
  report = { url: base, layouts: [], accessibility: [], previews: [], checks: [] };
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url().startsWith(base))
      failedAssets.push(`${r.status()} ${r.url()}`);
  });
  const requests = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  assert.match(await page.title(), /Matt/);
  assert.equal(await page.locator('.project-card').count(), 6);
  assert.equal(
    requests.filter((u) => /\.(webm|mp4)/.test(u)).length,
    0,
    'No video requested on initial load',
  );
  assert.ok(
    requests.every((u) => u.startsWith(new URL(base).origin)),
    'No third-party requests on initial load',
  );
  await page
    .locator('.project-card img')
    .evaluateAll((imgs) => imgs.forEach((i) => (i.loading = 'eager')));
  await page.evaluate(async () => {
    await Promise.all([...document.images].map((i) => i.decode()));
  });
  await page.screenshot({ path: 'artifacts/desktop.png', fullPage: true });
  await page.screenshot({ path: 'artifacts/desktop-first-screen.png' });
  const social = await page.evaluate(async () => {
    const i = new Image();
    i.src = './assets/images/social.jpg';
    await i.decode();
    return [i.naturalWidth, i.naturalHeight];
  });
  assert.deepEqual(social, [1200, 630]);
  const checkA11y = async (label) => {
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    report.accessibility.push({
      label,
      violations: result.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
      })),
    });
    await writeFile('artifacts/accessibility.json', JSON.stringify(report.accessibility, null, 2));
    assert.deepEqual(
      result.violations.map((v) => v.id),
      [],
      label + ' accessibility',
    );
  };
  await checkA11y('Desktop landing');
  for (const [category, count] of [
    ['games', 4],
    ['worlds', 1],
    ['music', 1],
    ['all', 6],
  ]) {
    await page.locator(`[data-filter="${category}"]`).click();
    assert.equal(await page.locator('.project-card:visible').count(), count);
    assert.equal(
      await page.locator(`[data-filter="${category}"]`).getAttribute('aria-pressed'),
      'true',
    );
  }
  for (const p of projects) {
    await page.locator(`[data-feature="${p.id}"]`).click();
    assert.match(
      await page.locator('#feature-name').innerText(),
      new RegExp(p.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
    );
    assert.equal(await page.locator('#feature-launch').getAttribute('href'), p.url);
    await page.waitForFunction(
      (image) => document.querySelector('#feature-image').getAttribute('src') === image,
      p.image,
    );
  }
  await page.locator('#feature-next').click();
  assert.equal(
    await page.locator('[data-feature="dino-browser"]').getAttribute('aria-pressed'),
    'true',
  );
  await page.locator('[data-feature="dino-browser"]').focus();
  await page.keyboard.press('ArrowLeft');
  assert.equal(
    await page.locator('[data-feature="matts-angels"]').getAttribute('aria-pressed'),
    'true',
  );
  await page.keyboard.press('Home');
  assert.equal(
    await page.locator('[data-feature="dino-browser"]').getAttribute('aria-pressed'),
    'true',
  );
  await page.keyboard.press('End');
  assert.equal(
    await page.locator('[data-feature="matts-angels"]').getAttribute('aria-pressed'),
    'true',
  );
  report.checks.push('Filters, featured selection, wrapping and arrow/Home/End keyboard controls');
  for (const p of projects) {
    const opener = page.locator(`.card-details-button[data-open="${p.id}"]`);
    await opener.click();
    await page.waitForSelector('#project-dialog[open]');
    assert.match(
      await page.locator('#dialog-title').innerText(),
      new RegExp(p.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
    assert.equal(await page.locator('.dialog-actions .button-accent').getAttribute('href'), p.url);
    assert.equal(new URL(page.url()).hash, `#project=${p.id}`);
    if (p.preview) {
      await page.waitForFunction(
        () => {
          const v = document.querySelector('dialog video');
          return v && !v.paused && v.currentTime > 0.3;
        },
        null,
        { timeout: 20000 },
      );
      const video = await page
        .locator('dialog video')
        .evaluate((v) => ({
          muted: v.muted,
          width: v.videoWidth,
          height: v.videoHeight,
          time: v.currentTime,
        }));
      assert.ok(video.muted && video.width > 0 && video.height > 0);
      report.previews.push({ id: p.id, ...video });
    } else assert.equal(await page.locator('dialog video').count(), 0);
    await checkA11y(p.id + ' dialog');
    if (p.id === 'war-survival') await page.screenshot({ path: 'artifacts/dialog-desktop.png' });
    for (let i = 0; i < 15; i++) await page.keyboard.press('Tab');
    assert.equal(
      await page.evaluate(() => document.querySelector('dialog').contains(document.activeElement)),
      true,
      'Focus remains in dialog',
    );
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !location.hash.startsWith('#project='));
    assert.equal(await page.locator('dialog video').count(), 0, 'Media removed on close');
    assert.equal(
      await opener.evaluate((el) => document.activeElement === el),
      true,
      'Opener focus restored',
    );
  }
  report.checks.push(
    'All project dialogs, accurate launch links, playable silent previews, focus containment, Escape and media cleanup',
  );
  await page.locator('.card-details-button[data-open="war-survival"]').click();
  await page.locator('#dialog-next').click();
  assert.match(await page.locator('#dialog-title').innerText(), /Rex Encounter/);
  await page.locator('#dialog-previous').click();
  assert.match(await page.locator('#dialog-title').innerText(), /War: Survival/);
  await page.goBack();
  assert.equal(await page.locator('#project-dialog').evaluate((el) => el.open), false);
  await page.goForward();
  assert.match(await page.locator('#dialog-title').innerText(), /War: Survival/);
  await page.locator('.dialog-close').click();
  await page.waitForFunction(() => !location.hash.startsWith('#project='));
  await page.goto(base + '#project=matts-angels');
  assert.equal(await page.locator('#project-dialog').evaluate((el) => el.open), true);
  await page.locator('.dialog-close').click();
  assert.equal(new URL(page.url()).hash, '#work');
  report.checks.push('Previous/next browsing, browser Back/Forward and direct project links');

  for (const [width, height] of [
    [1920, 1080],
    [1440, 900],
    [1024, 768],
    [768, 1024],
    [600, 900],
    [390, 844],
    [360, 800],
    [320, 568],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(base);
    await page.evaluate(() => document.fonts.ready);
    const layout = await page.evaluate(() => ({
      viewport: innerWidth,
      scroll: document.documentElement.scrollWidth,
      header: document.querySelector('header').getBoundingClientRect().width,
    }));
    assert.ok(
      layout.scroll <= width,
      `No horizontal overflow at ${width}: ${JSON.stringify(layout)}`,
    );
    for (const p of projects) {
      await page.locator(`[data-feature="${p.id}"]`).click();
      const fit = await page.evaluate(() => {
        const f = document.querySelector('.feature').getBoundingClientRect(),
          c = document.querySelector('.feature-copy').getBoundingClientRect(),
          first = document.querySelector('.feature-name').getBoundingClientRect(),
          b = document.querySelector('.feature-bottom').getBoundingClientRect(),
          t = document.querySelector('.feature-top').getBoundingClientRect();
        return {
          fits: c.bottom <= b.top && first.top >= t.bottom,
          left: c.left >= f.left,
          right: c.right <= f.right,
        };
      });
      assert.ok(
        fit.fits && fit.left && fit.right,
        `Hero content fits at ${width} for ${p.id}: ${JSON.stringify(fit)}`,
      );
    }
    await page.locator('[data-feature="war-survival"]').click();
    if (width === 390) {
      await page
        .locator('.project-card img')
        .evaluateAll((imgs) => imgs.forEach((i) => (i.loading = 'eager')));
      await page.evaluate(async () => {
        await Promise.all([...document.images].map((i) => i.decode()));
      });
      await page.screenshot({ path: 'artifacts/mobile.png', fullPage: true });
      await checkA11y('Mobile landing');
    }
    await page.locator('.card-details-button[data-open="dino-roblox"]').click();
    assert.equal(
      await page.locator('#project-dialog').evaluate((el) => el.scrollWidth <= el.clientWidth),
      true,
      `Modal fits ${width}`,
    );
    if (width === 390) {
      await page.screenshot({ path: 'artifacts/dialog-mobile.png' });
      await checkA11y('Mobile dialog');
    }
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !location.hash.startsWith('#project='));
    report.layouts.push({ width, height, overflow: false });
  }
  const phoneContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  });
  const phone = await phoneContext.newPage();
  await phone.goto(base);
  await phone.locator('[data-filter="music"]').tap();
  assert.equal(await phone.locator('.project-card:visible').count(), 1);
  await phone.locator('.card-media-button[data-open="matts-angels"]').tap();
  await phone.waitForSelector('#project-dialog[open]');
  await phone.locator('.dialog-close').tap();
  await phone.waitForFunction(() => !location.hash.startsWith('#project='));
  await phoneContext.close();
  report.checks.push('Nine responsive sizes and touch filter/preview/close interactions');

  const reduced = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  });
  const quiet = await reduced.newPage();
  await quiet.goto(base + '#project=war-survival');
  assert.equal(
    await quiet.locator('video').count(),
    0,
    'Reduced motion does not automatically play preview',
  );
  await quiet.locator('.preview-start').click();
  await quiet.waitForFunction(() => document.querySelector('video')?.currentTime > 0.2);
  await reduced.close();
  const nojs = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await nojs.newPage();
  await staticPage.goto(base);
  assert.equal(await staticPage.locator('.project-card').count(), 6);
  assert.equal(await staticPage.locator('.card-outbound').count(), 6);
  assert.equal(await staticPage.locator('.card-static-image:visible').count(), 6);
  await nojs.close();
  report.checks.push(
    'Reduced motion with explicit playback and six fully linked projects without JavaScript',
  );

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      get: () => ({ writeText: () => Promise.reject(new Error('Unavailable')) }),
    });
  });
  await page.goto(base + '?clipboard-test=1#project=war-survival');
  await page.locator('.share-button').click();
  assert.match(await page.locator('.share-field').inputValue(), /#project=war-survival$/);
  await page.locator('.dialog-close').click();
  await page.route('**/previews/*.webm', (r) => r.abort());
  await page.locator('.card-details-button[data-open="war-survival"]').click();
  await page.waitForSelector('.media-fallback');
  assert.equal(
    await page.locator('.dialog-actions .button-accent').getAttribute('href'),
    projects[2].url,
  );
  report.checks.push(
    'Clipboard-denied fallback and failed-preview recovery with launch link preserved',
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(failedAssets, []);
  report.errors = errors;
  report.failedAssets = failedAssets;
  await writeFile('artifacts/verification.json', JSON.stringify(report, null, 2));
  console.log(
    'PASS: ' +
      report.checks.join('; ') +
      '. Zero runtime errors, missing assets, or WCAG A/AA violations.',
  );
} finally {
  await browser.close();
  if (server) await new Promise((r) => server.close(r));
}
