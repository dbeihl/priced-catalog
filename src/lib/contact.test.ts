import { describe, expect, it } from "vitest";
import { services } from "../data/services";
import {
  buildWalkthroughMailto,
  isContactConfigured,
  walkthroughSelection,
} from "./contact";
import { unitLabel } from "./format";

const service = (id: string) => services.find((s) => s.id === id)!;

describe("walkthrough email", () => {
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
  it("withholds actions until every contact value is configured", () => {
    for (const contact of [
      {
        email: "TODO_EMAIL",
        phone: "555-0100",
        phoneHref: "5550100",
      },
      {
        email: "aaron@example.com",
        phone: "TODO_PHONE",
        phoneHref: "5550100",
      },
      {
        email: "aaron@example.com",
        phone: "555-0100",
        phoneHref: "TODO_PHONE_DIGITS",
      },
    ]) {
      expect(isContactConfigured(contact)).toBe(false);
    }
    expect(
      isContactConfigured({
        email: "aaron@example.com",
        phone: "555-0100",
        phoneHref: "5550100",
      }),
    ).toBe(true);
  });
});
