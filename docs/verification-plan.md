# Contact layout verification

## Purpose

Verify contact-first behavior on built output while keeping delivery local to an email draft or clipboard. Do not merge, deploy, register a provider, send an email, or change business data.

## Commands

Run npm run typecheck, npm run lint, npm test, npm run build, and npm run test:e2e. Playwright builds the production files, serves them under /priced-catalog/, and drives Chromium on desktop and a 390 by 844 mobile viewport. The contact suite also checks widths 320, 1280, and 1440.

Compare src/data/services.ts, src/data/sources.ts, src/site.config.ts, and SOURCES.md with origin/master. They must be byte-identical. All 38 services and the existing estimate arithmetic remain available.

## Journeys

Follow every persona in docs/personas.md. Check required email and job details, optional name and town, native email validation, whitespace-only descriptions, draft wording, copying, denied clipboard access, selectable text, long requests, current selection quantities, removal, retained message text, detail-to-contact navigation, the sources page, recent-work photos and their captions, and copied feedback clearing after an estimate change. Browser doubles are allowed only for clipboard and external protocol boundaries. Source links, including citation deep links, must open a new tab with an accessible cue and keep all four fields, estimate selections and viewed-service context on the original page. Local storage, session storage and cookies must stay empty. No HTTP form submission or storage write may occur.

Check full-page context at 1440 and 1280, the initial mobile form at 390 and 320, keyboard focus, reduced viewport height, enlarged text, and the estimate bar. The independent tester records screenshots and the tested commit. Their evidence must be on the PR before ready.

## Known limits

Headless protocol handling does not prove a physical device opens its mail application, and preparing or copying a request does not prove inbox receipt. No real messages are sent. Production publication remains awaiting separate approval.
