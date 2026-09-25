# Matt · Portfolio

**[Explore the portfolio](https://vibecodingmatt.github.io/portfolio/)**

A curated showcase of games, interactive worlds, and creative experiments. Built around a cinematic project selector, a filterable collection, and focused project previews that connect the idea, craft, and live experience.

## Featured work

| Project                      | Experience                                                                 |
| ---------------------------- | -------------------------------------------------------------------------- |
| Dino Defense · Browser       | [Play](https://vibecodingmatt.github.io/dino-defense/)                     |
| Dino Defense · Roblox        | [Play on Roblox](https://www.roblox.com/games/98883356694296/Dino-Defense) |
| War: Survival                | [Play](https://vibecodingmatt.github.io/war-survival/)                     |
| Rex Encounter · Rex: Pursuit | [Play](https://vibecodingmatt.github.io/rex-pursuit/)                      |
| Approach Orlando             | [Explore](https://vibecodingmatt.github.io/approach-orlando/)              |
| Matt’s Angels                | [Watch the music video](https://www.youtube.com/watch?v=6ZtGgA6IDdE)       |

## Run locally

Node 18 or later is sufficient for local development; the release workflow uses Node 24.

```sh
npm ci
npm start
```

Open `http://127.0.0.1:4190/portfolio/`. The development server renders the project catalog into the page on each request. Reload after editing styles or scripts; restart after editing the project catalog or template renderer.

```sh
npm run build
npm run preview
```

The build is a self-contained static site in `dist/`, using relative asset paths for GitHub Pages. Stop the development server before running preview, or set a different `PORT`.

## Design and implementation

- Semantic HTML, custom CSS, and native JavaScript modules. No runtime framework or third-party requests.
- Project cards are rendered into the static HTML at build time. Launch links and the complete collection work without JavaScript.
- The featured project selector supports arrows, Home, and End. It never rotates automatically.
- Native modal dialogs contain project notes, playable snippets, and launch links. Escape, focus restoration, direct links, and browser Back/Forward are supported.
- Previews load only when a visitor opens a project. All excerpts are silent, and only one runs at a time. Closing the dialog releases its media; backgrounding the page pauses it.
- Reduced-motion and data-saving preferences disable automatic preview playback. The play button remains available.
- Self-hosted Manrope, optimized WebP artwork, no analytics, no cookies, no backend.
- Canonical, Open Graph, JSON-LD, favicon, sitemap, and a 1200 × 630 sharing image are included.

## Add or update a project

Edit `projects.js`: titles, descriptions, categories, facts, links, media, and build notes are in one place. Add optimized artwork to `assets/images/` and an optional silent WebM excerpt to `assets/previews/`. Preserve each project's `id` to keep shared `#project=…` URLs working. When adding a seventh project, also update the static collection counts and intro copy in `index.html` and the release count check.

Set `source` to `null` when no public repository exists. Do not expose unpublished project code simply to populate a source link.

## Verification

```sh
npm run build
npm run test:release
npm test
```

Windows tests use installed Google Chrome. On other systems, run `npx playwright-core install --with-deps chromium` once. Set `CHROME_PATH` for another Chromium executable. Set `TEST_URL` to run the same browser checks against a deployed portfolio, including its trailing slash.

Browser checks cover nine viewport sizes, real touch input, all filters and featured selections, five playable previews, modal focus and cleanup, browser history, deep links, clipboard denial, failed media, reduced motion, and no-JavaScript access. Axe checks WCAG A/AA rules on desktop, mobile, and every project dialog. Automated checks do not replace testing on physical devices or a manual accessibility audit.

Local screenshots and verification reports are written to ignored `artifacts/`. The release build includes only public site files and media.

## Deployment

The public repository is `vibecodingmatt/portfolio`. Set GitHub Pages to **GitHub Actions**. Pushes to `main` build, validate assets and metadata, run the browser checks, then deploy `dist/` through `.github/workflows/pages.yml`.

## Media provenance

The site uses artwork from the featured projects. Promotional artwork and actual gameplay are labeled separately. Browser clips were captured from the working games in disposable sessions; the Dino Defense clip stages a representative combat scene. Rex's cover is AI-generated promotional artwork based on the game's jungle chase, open Jeep, mounted gun, and brown T. rex. Its [source artwork and generation prompt](art/rex-pursuit-keyart-v2.md) are preserved, and its video preview remains an actual game capture. The Roblox presentation uses its promotional artwork and links directly to the supplied public experience. The silent Matt’s Angels excerpt comes from the project's animated video material; the full song and video are linked on YouTube.

The September 25 preview refresh uses silent 1280 × 720, 30 fps VP8 WebM edits with versioned filenames. Gameplay is captured frame by frame from disposable local sessions, then played at the simulation's normal speed. Dino Defense stages a defense line and dinosaur waves; War: Survival stages squads and powers across three sectors. Rex uses committed release `a54c88f`: first-person storm combat transitions to third-person night pursuit, with no ending spoilers. Approach Orlando opens with a wide view of the living airport tabletop inside its room, then shows takeoff, cockpit approach, and moving trams. Matt's Angels cuts together four existing animated source clips. These are edited highlights, not uninterrupted playthroughs. Capture scripts, masters, and visual review sheets stay in ignored `artifacts/`.

The Manrope font is distributed under the [SIL Open Font License](assets/fonts/OFL.txt). Project artwork, music, footage, and their respective underlying assets retain their existing rights; this portfolio does not grant a new license to them.
