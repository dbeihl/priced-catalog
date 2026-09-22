# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Add durable project-specific notes here as they are discovered through real work.

- Market-band sources are maintained in `SOURCES.md` and published through `src/data/sources.ts`; use `sourceForService` so service citations remain unlinked when the registry has no URL.
- Page metadata is configured in `src/site.config.ts` and applied through `src/site-metadata.ts`; `TODO_` values intentionally produce no metadata tag.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
