# Lessons

Corrections David gives during this build, appended verbatim in the order they arrive.

_None yet._

## 2026-08-20

> this looks okay, now but on a phone it would be damn near impossible to see the items you are selecting. I would make the Estimate area collapse/expandable. Show the total, then if you want to see more you expand

It already collapsed, and closed was already the default. The screenshot I sent had it expanded, which is what read as "always open."

The real defect was the affordance, not the behaviour: a bar showing only a total does not look tappable, so the collapse may as well not exist. Fixed with a caret that rotates on open, an explicit Show/Hide word, and a drop shadow so it reads as a sheet over the page rather than part of it. Expanded height capped at 48dvh (was 60) so catalog rows stay visible behind it.

**The lesson:** demonstrate the default state, not the state I happened to leave the page in. A screenshot of an expanded panel is evidence about the expanded panel and nothing else.
