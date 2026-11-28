# Use email drafts for walkthrough requests

Status: accepted for the contact-first layout.

## Context

The catalog is hosted on GitHub Pages and already publishes an email address. The contact-first request authorizes a simple form, with hosted delivery reserved for separate owner review. A static page cannot send email by adding fields alone.

## Decision

Keep contact data in page memory. `walkthroughDrafts` in `src/lib/contact.ts` produces a shared body and mailto, Gmail, and Outlook compose URLs with the same recipient and subject. ContactForm owns validation, draft opening, copy feedback, and selectable fallback text. It bounds each URL's length before opening it. Keep estimate selections owned by App and pass current names, quantities, and units into ContactForm. Do not serialize price totals as a quote. See [Contact requests](../../README.md#contact-requests) for the visitor's actions and fallback guidance.

## Consequences

The owner needs no new account or processor. Visitors send the request through their own email service. The page cannot verify delivery. A later hosted endpoint requires explicit approval of its processor, retention, quota, and any cost.

Pricing source links open in a new tab with an accessible cue. The original page keeps the typed request, estimate selections and viewed-service context in memory. Browser storage and cookies stay unused. Reloading the catalog clears that state.

## Amendment, 2026-11-26: web mail compose links

The email-draft button opened nothing for a visitor without a default mail app. Web mail compose links provide a path for that visitor without a hosted form backend or third-party script. The website sends no email. The [contact guidance](../../README.md#contact-requests) describes what opening web mail shares with the provider.

## Amendment, 2026-11-27: phone email actions

On phones, remove the Gmail and Outlook buttons and offer Open email draft, Copy email address, and Copy request. A web page cannot reliably determine whether another app opened, so use the default `mailto:` path without custom app schemes or timer fallbacks. Keep the existing Gmail and Outlook web compose buttons on desktop.

The [contact-first layout plan](../contact-layout-plan.md) records the research and verification boundaries.
