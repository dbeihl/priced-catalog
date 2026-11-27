# Contact-first catalog plan

## Purpose

Move contact before the catalog and simplify the page while preserving every business number and source. Delivery prepares an email to the existing address. No service sends a request from this website.

| Decision | Reason | Cost |
| --- | --- | --- |
| Keep GitHub Pages and use email drafts with a copy fallback. | The authorized contact channel already exists. No new processor is approved. | Visitors must send the email themselves. |
| Keep fields and interaction state in ContactForm; keep serialization in lib/contact. | App retains estimate selections and passes their current formatted values into the form. | One cohesive component and a small extension to the existing formatter. |
| Keep all hours and market bands visible beneath each service. | Published evidence is the catalog's distinguishing behavior. | The catalog stays longer than a bare price menu. |
| Preserve the data files and estimate engine. | Every published number and source must stay exactly as reviewed. | Visual changes stay in markup and CSS. |
| Replace the dark monospace look with the "Bright & practical" direction chosen on the 2026-11-15 decision board. | The owner found the earlier look too engineer-like. | One new palette, Archivo only, and the IBM Plex Mono dependency removed. |
| Show four owner-supplied job photos as recent work, with plain captions and no prices. | Real work is more trustworthy than an illustration. | About 550 KB of images; the hero photo loads with the page. |
| Commit photos only as metadata-free WebP, enforced by `src/photo-metadata.test.ts`. | The repository is public, and phone photos carry location data. | Every new photo needs a conversion step before it is committed. |

## Redesign (2026-11-26)

The page follows concept B from the decision board. A white page with blue ink and orange actions, a bold Archivo headline, a workshop photo beside it, and one wide request card across the page on desktop. The card puts name, email and town in one column with the job box beside them. On a phone, Name and Email share a row under the headline, followed by Town or ZIP, then the job description. Three checked assurances sit under the card, then three recent-work photos, then the full catalog with its search, filters, running estimate and detail panel restyled in the same palette. The customer note and footer close the page.

Copy feedback such as "Request copied" now belongs to the exact request text it describes. Any later change to the fields, estimate selections or viewed service hides it, so the page never reports a copy of text the visitor no longer sees.

## Pre-change baseline

Before this change, App owned category filtering, open details, and estimate selections. EstimateBuilder and DetailPanel consumed a configured walkthrough link. lib/contact owned email encoding and quantity formatting. The configuration check read every value of the site object, so TODO domain and social-image fields suppressed contact even when email was configured. Browser selection reproduced the hidden action. Contact began at y=11,753 in a 390 by 844 viewport.

The research scout read nine live businesses on 2026-11-15. [Indianapolis Handyman Solutions](https://www.indianapolishandymansolutions.com/) puts call and estimate actions in its hero but currently exposes a placeholder form endpoint. [McClure](https://themcclurehandyman.com/) places its form before services. [Tim's Toolbox](https://timstoolbox.net/) pairs clear pricing with a long intake. [DOM](https://domthehandyman.com/) puts rates and contact near the top. [Team Handy Dan](https://handy-man-nyc.com/contact-us/) showed an unavailable form during research. Those observations support early contact, fewer fields, and a direct email fallback. Competitor promises and prices are not imported.

## Sketch

The component receives the current selections and configured email. The request data shape has name, email, town, and message strings. Name and town are optional. Email and message are required. A request summary is derived from the current selections without overwriting message text. No contact data is persisted.

The [email-draft decision](adr/0001-use-email-drafts-for-contact.md#decision) owns the current formatter contract and component responsibilities.

Two shapes were considered. Keeping the fields in App would mix draft validation and clipboard state with catalog state. A generalized transport system would add provider options that are outside this change. Use a dedicated ContactForm with the existing contact helper instead.

## Agreed public test boundaries

Render App to test contact availability with the actual configured metadata placeholders. Test public request serialization with literal user-visible output. The [verification plan](verification-plan.md) owns the current browser journeys and allowed doubles. No database exists in this static site.

## Sequence

1. Add the missing exploratory-evidence PR template and verify the repository test gate.
2. Commit a failing contact-availability regression test, then fix the email-only check.
3. Add one request-formatting behavior test, implement it, then build and test the four-field form through the browser.
4. Move contact above the catalog, simplify responsive rows, and preserve estimate behavior and source links.
5. Run unit, lint, typecheck, build, and browser suites against built output, including mobile widths. Arrange independent exploratory evidence before the normal gate finishes.
6. Commit and run no-mistakes. Post exact-head signed completion evidence, leave a concrete green PR for production approval, and do not merge or deploy.

## Acceptance

Contact precedes the catalog in reading order. The [contact guidance](../README.md#contact-requests) owns delivery behavior and explains what opening web mail shares with the provider. The [email-draft decision](adr/0001-use-email-drafts-for-contact.md) owns the data-handling constraints.

At 390 by 844 the form heading and first field are initially visible. At 320, 1280, and 1440 pixels, all controls and prices remain reachable without document overflow. Keyboard focus, enlarged text, and the estimate disclosure must not conceal the contact controls. All 38 services, hours, market ranges, source links, and estimate calculations remain available.

The protected baseline files are src/data/services.ts, src/data/sources.ts, src/site.config.ts, and SOURCES.md. Their bytes must remain unchanged. Hosted delivery, phone details, response deadlines, guarantees, new testimonials, merge, and production deployment remain outside this implementation.
