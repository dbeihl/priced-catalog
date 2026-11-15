# Personas

## David Beihl (owner, primary user)

Owns and maintains the site for Kamotec Services. Edits prices and market bands in `src/data/services.ts` and checks that the published page shows each number with its math.

- Goal: a visitor can price a job themselves and see hours, market band and materials kept separate from labor.
- Task: search for a service, add it to the running estimate, and confirm the labor total and materials range before sending someone to a walkthrough.

Journey: `e2e/david.spec.ts`.

## Homeowner with a known repair

Needs to ask about a job before choosing any catalog service. Enters email and job details in the top form, opens an email draft or copies the request, and sends it from their own email application. Must understand that the website submits nothing.

Journey: `e2e/contact.spec.ts`, direct request, validation, clipboard failure, and long-request fallback.

## Homeowner comparing services

Searches or filters services, checks price, hours, market band, and source, then adds services and quantities to an estimate. Returns to contact with those selections and a preserved message. Can remove selections without losing typed contact details.

Journey: `e2e/contact.spec.ts`, estimate-to-contact, service details, and source navigation.
