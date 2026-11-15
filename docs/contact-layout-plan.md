# Contact-first catalog plan

## Purpose

Move contact before the catalog and simplify the page while preserving every business number and source. Delivery prepares an email to the existing address. No service sends a request from this website.

| Decision | Reason | Cost |
| --- | --- | --- |
| Keep GitHub Pages and use email drafts with a copy fallback. | The authorized contact channel already exists. No new processor is approved. | Visitors must send the email themselves. |
| Keep fields and interaction state in ContactForm; keep serialization in lib/contact. | App retains estimate selections and passes their current formatted values into the form. | One cohesive component and a small extension to the existing formatter. |
| Keep all hours and market bands visible beneath each service. | Published evidence is the catalog's distinguishing behavior. | The catalog stays longer than a bare price menu. |
| Preserve the palette, fonts, data files, and estimate engine. | The requested change concerns hierarchy and contact. | A quieter version of the current brand. |

## Ground

App owns category filtering, open details, and estimate selections. EstimateBuilder and DetailPanel consume a configured walkthrough link. lib/contact owns email encoding and quantity formatting. The current configuration check reads every value of the site object, so TODO domain and social-image fields suppress contact even when email is configured. Browser selection reproduced the hidden action. Contact currently begins at y=11,753 in a 390 by 844 viewport.

The research scout read nine live businesses on 2026-11-15. [Indianapolis Handyman Solutions](https://www.indianapolishandymansolutions.com/) puts call and estimate actions in its hero but currently exposes a placeholder form endpoint. [McClure](https://themcclurehandyman.com/) places its form before services. [Tim's Toolbox](https://timstoolbox.net/) pairs clear pricing with a long intake. [DOM](https://domthehandyman.com/) puts rates and contact near the top. [Team Handy Dan](https://handy-man-nyc.com/contact-us/) showed an unavailable form during research. Those observations support early contact, fewer fields, and a direct email fallback. Competitor promises and prices are not imported.

## Sketch

The component receives the current selections and configured email. The request data shape has name, email, town, and message strings. Name and town are optional. Email and message are required. A request summary is derived from the current selections without overwriting message text. No contact data is persisted.

The existing buildWalkthroughMailto(email, selections) signature remains valid. Add an optional request argument and a public plain-text request formatter for both the email body and copy output. ContactForm owns validation, draft preparation, copy feedback, and selectable fallback text. App owns the selections once.

Two shapes were considered. Keeping the fields in App would mix draft validation and clipboard state with catalog state. A generalized transport system would add provider options that are outside this change. Use a dedicated ContactForm with the existing contact helper instead.

## Agreed public test boundaries

Render App to test contact availability with the actual configured metadata placeholders. Test public request serialization with literal user-visible output and encoded mailto values. Drive the running product with Playwright for validation, current selections, clipboard success and failure, long draft fallback, field preservation, mobile layout, and absence of network submission. Mock only external browser clipboard and protocol-launch boundaries. No database exists in this static site.

## Sequence

1. Add the missing exploratory-evidence PR template and verify the repository test gate.
2. Commit a failing contact-availability regression test, then fix the email-only check.
3. Add one request-formatting behavior test, implement it, then build and test the four-field form through the browser.
4. Move contact above the catalog, simplify responsive rows, and preserve estimate behavior and source links.
5. Run unit, lint, typecheck, build, and browser suites against built output, including mobile widths. Arrange independent exploratory evidence before the normal gate finishes.
6. Commit and run no-mistakes. Post exact-head signed completion evidence, leave a concrete green PR for production approval, and do not merge or deploy.

## Acceptance

Contact precedes the catalog in reading order. The action is labelled Open email draft and explains that visitors must send it themselves. Copy request offers honest success and failure feedback and selectable text. Empty required fields prevent a draft. Selected names, quantities, and units follow the estimate, without prices. Long drafts use copy fallback. No contact data enters browser storage or an HTTP request.

At 390 by 844 the form heading and first field are initially visible. At 320, 1280, and 1440 pixels, all controls and prices remain reachable without document overflow. Keyboard focus, enlarged text, and the estimate disclosure must not conceal the contact controls. All 38 services, hours, market ranges, source links, and estimate calculations remain available.

The protected baseline files are src/data/services.ts, src/data/sources.ts, src/site.config.ts, and SOURCES.md. Their bytes must remain unchanged. Hosted delivery, phone details, response deadlines, guarantees, new testimonials, merge, and production deployment remain outside this implementation.
