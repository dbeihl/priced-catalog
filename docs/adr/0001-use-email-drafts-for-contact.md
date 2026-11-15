# Use email drafts for walkthrough requests

Status: accepted for the contact-first layout.

## Context

The catalog is hosted on GitHub Pages and already publishes an email address. The contact-first request authorizes a simple form, with hosted delivery reserved for separate owner review. A static page cannot send email by adding fields alone.

## Decision

Keep contact data in page memory. Use the existing contact formatter to prepare a mailto draft or copyable request text. The visitor sends the email. Bound draft length and retain selectable text when clipboard access fails. Keep estimate selections owned by App and pass current names, quantities, and units into ContactForm. Do not serialize price totals as a quote.

## Consequences

The owner needs no new account or processor. Visitors need an email application or must copy and paste the request into their email service. The page cannot verify delivery. A later hosted endpoint requires explicit approval of its processor, retention, quota, and any cost.

The [contact-first layout plan](../contact-layout-plan.md) records the research and verification boundaries.
