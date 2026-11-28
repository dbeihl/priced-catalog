# Contact layout verification

## Purpose

Verify contact-first behavior on built output while keeping delivery local to an email draft, a web mail compose page or the clipboard. Do not merge, deploy, register a provider, send an email, or change business data.

## Commands

Run npm run typecheck, npm run lint, npm test, npm run build, and npm run test:e2e. Playwright builds the production files and serves them under /priced-catalog/. The browser projects and device settings are defined in `playwright.config.ts`. CI runs Chromium only; local runs also include desktop and phone WebKit. Install the local browser binaries with `npx playwright install chromium webkit` before the first run. The suites also set viewport sizes for individual layout checks.

Compare src/data/services.ts, src/data/sources.ts, src/site.config.ts, and SOURCES.md with origin/master. They must be byte-identical. All 38 services and the existing estimate arithmetic remain available.

## Journeys

Follow every persona in docs/personas.md and verify the actions described in [Contact requests](../README.md#contact-requests). Check required email and job details, optional name and town, native email validation, whitespace-only descriptions, draft wording, web mail compose links carrying the same recipient, subject and body as Copy request, phone detection with synthetic user agents, unchanged tablet and desktop behavior including narrow windows, phone copy-address success and failure without filling in the form, live status feedback including the address on failure, selectable address text, copying, denied clipboard access, long requests, current selection quantities, removal, retained message text, detail-to-contact navigation, the sources page, recent-work photos and their captions, and copied feedback clearing after an estimate change. Browser doubles are allowed only for clipboard, external protocol and web mail boundaries; tests intercept email navigation and web mail compose requests and never reach Google or Microsoft. Source links, including citation deep links and the guide links on the sources page, must open a new tab with an accessible cue and keep all four fields, estimate selections and viewed-service context on the original page. Local storage, session storage and cookies must stay empty. No HTTP form submission or storage write may occur.

Check full-page context at 1440 and 1280, the initial mobile form at 390 and 320, reduced viewport height, and enlarged text. In `e2e/contact.spec.ts`, verify the three phone buttons stack at full width at 320 and 390 pixels and keep their positions while the address-copy label is pending. In `e2e/estimate-and-request.spec.ts`, verify focus stays clear of the fixed estimate bar and sticky filters, a long desktop estimate scrolls to its request link, and pointer Hide preserves the keyboard's place and allows Space or Enter to reopen the sheet. Right-click, middle-click, drag-release, and non-activating keys must leave the contact buttons usable. Check replacement of cleared quantities, visible add-on units, and quote-only market notes. `src/lib/contact.test.ts` covers counted units in request text. In `e2e/sources.spec.ts`, check the sources-page title, the horizontal-scroll cue on narrow screens, and cold citation deep links after fonts load. The independent tester records screenshots and the tested commit. Their evidence must be on the PR before ready.

## Known limits

Headless tests do not prove a physical device opens its default email app, a stubbed desktop compose page does not prove the visitor is signed in to Gmail or Outlook, WebKit is not real Safari, and preparing or copying a request does not prove inbox receipt. No real messages are sent. Production publication remains awaiting separate approval.
