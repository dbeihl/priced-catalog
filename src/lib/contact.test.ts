import { describe, expect, it } from "vitest";
import { services } from "../data/services";
import { site } from "../site.config";
import {
  buildWalkthroughBody,
  walkthroughDrafts,
  isContactConfigured,
  walkthroughSelection,
} from "./contact";
import { unitLabel } from "./format";

const service = (id: string) => services.find((s) => s.id === id)!;

describe("walkthrough email", () => {
  it("formats a visitor request for email and copying without prices", () => {
    const request = {
      name: " Sam ",
      email: "sam@example.com",
      town: " Westfield ",
      message: "Fix the door & trim.\nThe entry is narrow.",
    };
    const selections = [
      { name: "Baseboard", quantity: 120, unit: "linear ft" },
    ];
    const expected =
      "Hi,\n\nI'd like to request a walkthrough for:\nFix the door & trim.\nThe entry is narrow.\n\nName: Sam\nReply email: sam@example.com\nTown or ZIP: Westfield\n\nSelected services:\n- Baseboard: 120 linear ft\n\nThank you.";
    expect(buildWalkthroughBody(selections, request)).toBe(expected);
    const draft = new URL(
      walkthroughDrafts("info@example.com", selections, request).mailto,
    );
    expect(draft.searchParams.get("body")).toBe(expected);
    expect(draft.searchParams.get("subject")).toBe("Walkthrough request");
  });

  it("names the service the visitor was viewing apart from their job details", () => {
    expect(
      buildWalkthroughBody(
        [],
        {
          name: "",
          email: "sam@example.com",
          town: "",
          message: "Bathroom is leaking.",
        },
        "Toilet replacement",
      ),
    ).toBe(
      "Hi,\n\nI'd like to request a walkthrough for:\nBathroom is leaking.\n\nReply email: sam@example.com\nAsked about: Toilet replacement\n\nThank you.",
    );
  });

  it("builds an email with the selected service quantities in their units and no pricing", () => {
    expect(
      walkthroughDrafts("aaron@example.com", [
        { name: "Faucet replacement", quantity: 2, unit: "each" },
        { name: "Baseboard", quantity: 120, unit: "linear ft" },
        { name: "TV mount" },
      ]).mailto,
    ).toBe(
      "mailto:aaron@example.com?subject=Walkthrough%20request&body=Hi%2C%0A%0AI%27d%20like%20to%20request%20a%20walkthrough%20for%3A%0A-%20Faucet%20replacement%3A%202%20each%0A-%20Baseboard%3A%20120%20linear%20ft%0A-%20TV%20mount%0A%0AThank%20you.",
    );
  });
});

describe("web mail compose links", () => {
  it("carry the same recipient, subject and body as the email draft", () => {
    const body =
      "Hi%2C%0A%0AI%27d%20like%20to%20request%20a%20walkthrough%20for%3A%0A-%20TV%20mount%0A%0AThank%20you.";
    const drafts = walkthroughDrafts("aaron@example.com", [
      { name: "TV mount" },
    ]);
    expect(drafts.body).toBe(
      "Hi,\n\nI'd like to request a walkthrough for:\n- TV mount\n\nThank you.",
    );
    expect(drafts.gmail).toBe(
      `https://mail.google.com/mail/?view=cm&to=aaron%40example.com&su=Walkthrough%20request&body=${body}`,
    );
    expect(drafts.outlook).toBe(
      `https://outlook.live.com/mail/0/deeplink/compose?to=aaron%40example.com&subject=Walkthrough%20request&body=${body}`,
    );
  });
});

describe("text that cannot be encoded", () => {
  it("never breaks the request, and the links carry exactly what is copied", () => {
    const lone = "\uD83D";
    const trailing = "\uDE00";
    const request = {
      name: `Sam${lone}`,
      email: `sam${trailing}@example.com`,
      town: `West${lone}field`,
      message: `Fix the door ${trailing}${lone} 🔧`,
    };
    const drafts = walkthroughDrafts("info@example.com", [], request, `Faucet${lone}`);
    expect(drafts.body).toContain("Name: Sam\uFFFD");
    expect(drafts.body).toContain("Reply email: sam\uFFFD@example.com");
    expect(drafts.body).toContain("Town or ZIP: West\uFFFDfield");
    expect(drafts.body).toContain("Fix the door \uFFFD\uFFFD 🔧");
    expect(drafts.body).toContain("Asked about: Faucet\uFFFD");
    for (const link of [drafts.mailto, drafts.gmail, drafts.outlook]) {
      expect(new URL(link).searchParams.get("body")).toBe(drafts.body);
    }
  });
});

describe("walkthrough selection", () => {
  it("omits quantity for services without a quantity input", () => {
    expect(walkthroughSelection(service("punch-list-half"), 1)).toEqual({
      name: "Punch list — half day",
    });
  });

  it("keeps the chosen quantity and unit for per-unit services", () => {
    const perUnit = services.find((s) => s.pricing.model === "per-unit")!;
    expect(walkthroughSelection(perUnit, 120)).toEqual({
      name: perUnit.name,
      quantity: 120,
      unit: unitLabel[perUnit.pricing.unit],
    });
  });

  it("names chosen add-ons, with whole counts and units where they have one", () => {
    const floor = service("floor-lvp-tile");
    const tv = service("tv-mount");
    expect(
      walkthroughSelection(floor, 120, [{ id: "transitions", quantity: 12.7 }]),
    ).toEqual({
      name: floor.name,
      quantity: 120,
      unit: "sq ft",
      addOns: [
        { name: "Transitions and quarter round", quantity: 12, unit: "linear ft" },
      ],
    });
    expect(
      buildWalkthroughBody([
        walkthroughSelection(tv, 1, [{ id: "in-wall-conceal" }]),
        walkthroughSelection(floor, 120, [{ id: "transitions", quantity: -3 }]),
      ]),
    ).toContain(
      "- TV mount\n  + In-wall cable concealment\n- Floor install — LVP or tile: 120 sq ft\n  + Transitions and quarter round: 1 linear ft\n",
    );
    expect(
      buildWalkthroughBody([walkthroughSelection(tv, 1, [{ id: "in-wall-conceal" }])]),
    ).not.toContain("$");
  });

  it("counts every unit that takes a quantity the way it reads aloud", () => {
    const line = (id: string, quantity: number) =>
      buildWalkthroughBody([walkthroughSelection(service(id), quantity)])
        .split("\n")
        .find((l) => l.startsWith("- "));
    expect(
      [
        ["ethernet-drop", 1],
        ["ethernet-drop", 2],
        ["floor-lvp-tile", 2],
        ["smart-switch", 2],
        ["baseboard-new", 2],
        ["hourly-work", 2],
      ].map(([id, quantity]) => line(id as string, quantity as number)),
    ).toEqual([
      "- Ethernet drop: 1 drop",
      "- Ethernet drop: 2 drops",
      "- Floor install — LVP or tile: 2 sq ft",
      "- Smart switch or dimmer swap: 2 each",
      "- Baseboard — new install: 2 linear ft",
      "- Hourly work: something not listed: 2 hr",
    ]);
  });

  it("never names a negative, zero or fractional count", () => {
    const perUnit = services.find((s) => s.pricing.model === "per-unit")!;
    const count = (quantity: number) => {
      const selection = walkthroughSelection(perUnit, quantity);
      return "quantity" in selection ? selection.quantity : undefined;
    };
    expect([-4, 0, 2.5, Number.NaN, 3].map(count)).toEqual([1, 1, 2, 1, 3]);
  });
});

describe("contact configuration", () => {
  it("keeps a configured email available when optional metadata is unfinished", () => {
    expect(isContactConfigured(site)).toBe(true);
  });

  it("withholds actions until the email is configured", () => {
    expect(isContactConfigured({ email: "TODO_EMAIL" })).toBe(false);
    expect(isContactConfigured({ email: "aaron@example.com" })).toBe(true);
  });
});
