import { describe, expect, it } from "vitest";
import { services } from "../data/services";
import { site } from "../site.config";
import {
  buildWalkthroughMailto,
  buildWalkthroughBody,
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
      buildWalkthroughMailto("info@example.com", selections, request),
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
      buildWalkthroughMailto("aaron@example.com", [
        { name: "Faucet replacement", quantity: 2, unit: "each" },
        { name: "Baseboard", quantity: 120, unit: "linear ft" },
        { name: "TV mount" },
      ]),
    ).toBe(
      "mailto:aaron@example.com?subject=Walkthrough%20request&body=Hi%2C%0A%0AI%27d%20like%20to%20request%20a%20walkthrough%20for%3A%0A-%20Faucet%20replacement%3A%202%20each%0A-%20Baseboard%3A%20120%20linear%20ft%0A-%20TV%20mount%0A%0AThank%20you.",
    );
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
