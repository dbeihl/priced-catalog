# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Add durable project-specific notes here as they are discovered through real work.

- Market-band sources are maintained in `SOURCES.md` and published through `src/data/sources.ts`; each `marketBand.sourceKey` names its registry row exactly, and `null` keeps a citation unlinked until its source is confirmed.
- Committed images must be metadata-free WebP (`src/photo-metadata.test.ts` enforces it); the repository is public and phone photos carry GPS. Never commit an original or unstripped conversion, even in an intermediate commit.
- Page metadata is configured in `src/site.config.ts` and applied through `src/site-metadata.ts`; `TODO_` values intentionally produce no metadata tag.
- `playwright.config.ts` adds WebKit desktop and phone projects outside CI only, because CI installs Chromium alone; run `npx playwright test` locally to catch WebKit focus defects. Playwright WebKit Tab skips buttons and links, so e2e tests press `tabKey(browserName)`.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
