# Use email drafts for walkthrough requests

Status: accepted for the contact-first layout.

## Context

The catalog is hosted on GitHub Pages and already publishes an email address. The contact-first request authorizes a simple form, with hosted delivery reserved for separate owner review. A static page cannot send email by adding fields alone.

## Decision

Keep contact data in page memory. Use the existing contact formatter to prepare a mailto draft or copyable request text. The visitor sends the email. Bound draft length and retain selectable text when clipboard access fails. Keep estimate selections owned by App and pass current names, quantities, and units into ContactForm. Do not serialize price totals as a quote.

## Consequences

The owner needs no new account or processor. Visitors need an email application or must copy and paste the request into their email service. The page cannot verify delivery. A later hosted endpoint requires explicit approval of its processor, retention, quota, and any cost.

Pricing source links open in a new tab with an accessible cue. The original page keeps the typed request, estimate selections and viewed-service context in memory. Browser storage and cookies stay unused. Reloading the catalog clears that state.

## Amendment, 2026-11-26: web mail compose links

A mailto link does nothing on a device with no default mail app, so a visitor on such a device saw the email-draft button open nothing. "Open in Gmail" and "Open in Outlook" now sit beside it. They open each provider's compose page in a new tab with the same recipient, subject and body that the mail draft and Copy request use, all built by `walkthroughDrafts` in `src/lib/contact.ts`. They share the draft button's validation and length limit, and the visible note tells the visitor to copy the request into any email to the shown address if nothing opens. The page still sends nothing, loads no third-party script and stores nothing. A hosted form backend remains unchosen.

The [contact-first layout plan](../contact-layout-plan.md) records the research and verification boundaries.
