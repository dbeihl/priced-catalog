# priced-catalog — plan

A static site that answers one question: what should this job cost, and how do you know? Every price ships next to the hours behind it and the market band around it.

Status: **plan, awaiting approval.** Nothing built yet.

---

## 1. Design tokens

### Colour — 6 values

| Token     | Hex       | Role                                                   | Why it belongs to this brief                                                                                                                                                                                                                                                |
| --------- | --------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--ink`   | `#15181B` | Body text, figures, rules at full weight               | Graphite, not black. The colour of a carpenter's pencil on stock, and it keeps 45 dense cards from vibrating the way pure black does.                                                                                                                                       |
| `--ink-2` | `#5A6169` | Secondary text: pace lines, source attributions, units | 5.4:1 on paper, so the "Angi, Aug 2026" line is legible rather than decorative. Every card has three tiers of information; two ink weights is what separates them without adding colour.                                                                                    |
| `--paper` | `#F2F3F1` | Page ground                                            | Cool off-white with a green-grey cast. Explicitly not cream — this is plan stock and jobsite paper, which is grey, not warm.                                                                                                                                                |
| `--field` | `#FFFFFF` | Card and panel surface                                 | Lifts off `--paper` by value alone, so no shadows are needed. Shadows on a spec sheet read as marketing.                                                                                                                                                                    |
| `--rule`  | `#D3D7D2` | Hairlines, table borders, the band track               | The sheet's ruling. Density is handled by rules, not by whitespace, because whitespace at this information density means scrolling.                                                                                                                                         |
| `--mark`  | `#E8B004` | The price notch, active filter, focus ring             | Level-vial yellow, tape-blade yellow, lumber-crayon yellow. It is the colour of a tool that measures, and it appears in exactly one job: marking where his number falls. Never as text on paper (fails AA); `--ink` on `--mark` is 9.1:1 and is the only permitted pairing. |

Secondary ramp, small surface area only — category tags borrow the APWA uniform utility-marking code, the colour system already painted on the ground at every jobsite: water `#0B63C5`, communications `#E2650B`, electric `#C8102E`, and neutral `--ink-2` for trim, flooring, doors, general. Category colour appears as a 3px left rule on the card and nowhere else. It is trade vernacular that is actually load-bearing, not a palette invented to look industrial.

### Type — two faces

| Face                                            | Role                                                                              | Why                                                                                                                                                                                                                                           |
| ----------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Archivo** (`@fontsource-variable/archivo`)    | Headings, labels, blurbs, description prose                                       | An industrial grotesque with signage lineage. Tight, high x-height, holds up at 13px in a table row, and carries no editorial or luxury connotation. Not Inter, not a serif display.                                                          |
| **IBM Plex Mono** (`@fontsource/ibm-plex-mono`) | Every figure: prices, hours, quantities, band endpoints, linear feet, square feet | The utility face the brief asks for. Tabular figures mean `$4.50` and `$12.75` align down a column, and mono numerals read as _measured_ — an instrument output, not a price tag. `font-variant-numeric: tabular-nums` everywhere it is used. |

Self-hosted via `@fontsource`, no external font request. His domain build must not depend on Google's CDN being reachable.

### Layout concept — the takeoff sheet

A contractor's takeoff sheet, not a card grid. Full-bleed ruled surface: services are **rows in a spec table** on desktop, hairline-separated, 2px corner radius at most, no drop shadows anywhere. Category filter is a left gutter of ruled tags on desktop and a horizontal scroller on mobile. The estimate builder docks as a **running tally** — bottom sheet on mobile, right rail from `lg` up — mirroring the running-total column on a real takeoff. Density is the point: a homeowner comparing three quotes should be able to see eight services at once.

Mobile-first: rows collapse to stacked blocks, figures stay in their mono column so price/hours/band still align vertically.

### Signature element — the band rule

The one risk. Under every price, a **measured scale**: a 4px hairline track spanning that service's market band low-to-high, with his price marked by a solid `--mark` notch at its true position. Endpoints printed in mono at the ends. It turns "is $4.50 fair" into a glance without asking anyone to do arithmetic.

It belongs here because it _is_ the product — the derivation rendered as measurement, in the vernacular of the tape and the level, and it is the one element that a brochure could not have.

Constraints that keep it from becoming noise across ~30 cards: 4px at rest, no axis, no gridlines, no labels beyond the two endpoints; expands in the detail panel with the source line and band note. The notch position is never the only signal — the price and both endpoints are always printed adjacent, so it degrades to plain numbers for anyone who cannot read the position. It does not animate under `prefers-reduced-motion`.

---

## 2. Decisions taken, and what they cost

| #   | Fork                                           | Chosen                                                                        | Cost                                                                                                                                                                                   |
| --- | ---------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `draftPricing` initial value                   | `true` (per prompt), overriding `draftPricing: false` in the catalog file     | Banner on every page until he signs off. Correct default; the catalog file's `false` looks like a leftover.                                                                            |
| 2   | `showEffectiveRate` flag from the catalog file | Dropped                                                                       | A toggle for a value that is never rendered is dead config and a future leak. `effectiveRate` is a derivation input in `site.config.ts`, referenced only by comments in `services.ts`. |
| 3   | Bathroom floor vs LVP as two catalog rows      | **One** service carrying `flatBelowUnits: 100` + `flatBelowPrice: [475, 650]` | Loses a card a homeowner might search for. Buys one source of truth: two rows would be two prices for one job, drifting the first time one is edited.                                  |
| 4   | Node                                           | Node 22 locally, `engines: ">=20"`                                            | None. Vite 5 supports both.                                                                                                                                                            |
| 5   | Total always a range                           | See open question A below                                                     | —                                                                                                                                                                                      |

---

## 3. Open questions — need your call before I build

**A. "Totals always render as a range, never a single number."** The catalog gives point prices for most flat items (toilet $185, TV mount $225). An estimate of two flat items is genuinely `$410`, and rendering it `$410 – $410` is theatre. Three options:

1. Range when the estimate contains any `confirmBy` or `range` service; single figure plus the standing disclaimer when every line is flat. _(my recommendation — honest, and the disclaimer already carries the caveat)_
2. Declare explicit `low`/`high` on every service, derived from its hours range × the effective rate. Real derivation, but I would be inventing hour ranges for the ~15 services the catalog gives a single hours figure for.
3. Literal compliance: always two numbers, equal when equal.

**B. Missing market bands.** `marketBand` is required on every service and the catalog file sources only six of them (softener, ethernet drop, LVP/sq ft, baseboard, shiplap, minimum service fee). The other ~24 have no band and no source. I will not write a plausible-looking `source: 'Angi, 2026'` next to a number I did not look up — that is the one thing this site cannot do. Plan:

- Phase 2 researches the missing bands with real 2026 sources (roughly 10 batched searches covering toilet/faucet/disposal/vanity, TV mount/doorbell/smart switch/AP, interior + storm doors, crown/casing, ceiling fan, handyman day rates).
- Any service that still has no defensible sourced band after that ships `status: 'coming-soon'` rather than a fabricated one. It renders in the catalog, greyed, without a price.

Confirm you want the research phase — it is the longest single stretch of this build.

---

## 4. Build phases

### Phase 0 — scaffold

- [ ] `~/personal/priced-catalog`, git init, private repo under `dbeihl` (`gh auth switch --user dbeihl` first). Pages not enabled.
- [ ] Vite + React 18 + TS strict + Tailwind 3. `@fontsource-variable/archivo`, `@fontsource/ibm-plex-mono`, Vitest.
- [ ] `vite.config.ts`: `base: process.env.VITE_BASE_PATH ?? '/priced-catalog/'`.
- [ ] Scripts: `dev`, `build`, `typecheck`, `lint`, `test`. `tsconfig` strict, `noUncheckedIndexedAccess`.
- [ ] `tasks/lessons.md` created empty.

### Phase 1 — data layer

- [ ] `src/types.ts` — the model from the prompt verbatim, plus `Category` union: `water` · `smart-home` · `flooring` · `carpentry` · `doors` · `general`.
- [ ] `src/site.config.ts` — identity + contact as `TODO_` placeholders, `pricing` block per decision 1 and 2, service area, category display names.
- [ ] `src/data/services.ts` — ~30 services transcribed from the catalog file. `↳` rows become `addOns`. Confirm-by comes from the Tier column (`photo-confirmed` → `photos`, `walkthrough` → `walkthrough`). True quote-only rows: subfloor repair, fixture swap with no existing box.
- [ ] Typecheck gate: `basis` and `marketBand` non-optional, so a service missing either fails the build rather than shipping.

### Phase 2 — market bands (see open question B)

- [ ] Research the ~24 missing bands, real sources, dated.
- [ ] Anything unsourced → `status: 'coming-soon'`, no price rendered.

### Phase 3 — calculator, tests first

- [ ] `src/lib/estimate.ts`, pure, zero React imports. Rules 1–6 from the prompt.
- [ ] `src/lib/estimate.test.ts` — the six required cases: below-`minimumUnits` quantity; small-room override at exactly `flatBelowUnits` (100 → per-sq-ft, 99 → flat); tiering at 1 / 2 / 5; quote-only mixed with priced; add-ons pushing a subtotal across the visit minimum; empty state. Plus: materials never inside the labor subtotal.
- [ ] Order of operations pinned in a test, since it is where the silent bug lives: per-unit floor → small-room override → tiering → add-ons → visit minimum → materials as a separate line.

### Phase 4 — UI

- [ ] Hero: who he is, service area, three lines of premise.
- [ ] Catalog: takeoff-sheet rows, category filter, text filter. Name, blurb, price, **hours**, **band rule**, `confirmBy` badge. Filter changes must not shift layout — reserve the row container height.
- [ ] Detail: drawer under `lg`, side panel above. Full description, includes, excludes, assumptions, add-ons, materials handling, expanded band rule with source, basis note in full.
- [ ] Estimate builder: add, quantity on per-unit items, add-on toggles. Live. Visit-minimum line named. Materials on their own line. Quote-required flag.
- [ ] Disclaimer attached to every total.
- [ ] Contact: `mailto:` and `tel:` from config. No form, no backend, no PII.
- [ ] Draft-pricing banner, cleared by one flag.

### Phase 5 — quality floor

- [ ] Visible keyboard focus (`--mark` ring), full keyboard path through filter → row → detail → add to estimate.
- [ ] AA contrast checked on every pairing, `--mark` as fill only.
- [ ] `prefers-reduced-motion` honoured on drawer and notch.
- [ ] No layout shift on filter change.

### Phase 6 — README

Written for someone who has never opened a terminal. Numbered, with before/after snippets: change a price · change hours or market band · add a service · hide a service. Plus **Before this goes live**: general liability insurance (a homeowner's policy excludes business pursuits), Indiana LLC via INBiz, attorney-reviewed contract template (Home Improvement Contracts Act — residential work over $150, required terms, three-day cancellation notice, written and signed change orders, violations are deceptive acts under the DCSA which shifts attorney's fees), and Westfield / Hamilton County registration thresholds confirmed with the building department.

### Phase 7 — verify

- [ ] `npm run typecheck && npm run lint && npm run test && npm run build`
- [ ] Screenshots at 390px and 1440px, real browser, not a description.
- [ ] Done-when checks run by hand: 20 lf baseboard bills at 40 · 40 sq ft floor returns `$475–$650` not `$130` · three Shellys price `$95 + $65 + $65` · materials outside the labor subtotal · banner clears on one flag.

---

## 5. Handoff seams

- `base` from `VITE_BASE_PATH`, defaulting to `/priced-catalog/`. His domain build sets it to `/`.
- All identity and contact in `site.config.ts`. Never in a component — a grep for the placeholder strings must only hit that one file.
- No "we", no second name, nothing implying a joint business. His site.

## 6. Not in v1

Shareable estimate URLs · print stylesheet · localStorage persistence · CI/CD workflow · photo galleries.
