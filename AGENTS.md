# Portfolio maintenance

This is Matt's standalone public portfolio at `https://vibecodingmatt.github.io/portfolio/`.

- Change this repository only. Featured game repositories are separate projects.
- `projects.js` is the project catalog. `scripts/template.mjs` renders its cards into the static HTML. `main.js` owns the interactive selector, filters, and preview dialog.
- Preserve stable project IDs and the `#project=id` direct-link format.
- Keep launch links accurate. A source link should exist only if its target is publicly accessible.
- Preserve clear distinctions between promotional artwork and actual gameplay. Do not invent career history, team sizes, results, employers, or development metrics.
- Maintain keyboard access, modal focus restoration, browser history, reduced-motion behavior, and static launch links without JavaScript.
- Keep fonts and media self-hosted. Load no video before a visitor opens a project; only one silent preview may play at a time. Release it on close.
- Run `npm run build`, `npm run test:release`, and `npm test` for changes affecting the release. Browser checks cover desktop, mobile, accessibility, media, and recovery behavior.
- Keep local screenshots, capture scripts, logs, and dependencies out of the release and Git history. `dist/` is generated from an explicit public-file allowlist.
- GitHub Pages deploys through `.github/workflows/pages.yml` after successful checks on `main`. Publishing requires user authorization; creating the portfolio on GitHub Pages was authorized in its initial task.
