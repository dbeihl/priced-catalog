import { describe, expect, it } from "vitest";
import { buildWalkthroughMailto, isContactConfigured } from "./contact";

describe("walkthrough email", () => {
  it("builds an email with the selected service quantities and no pricing", () => {
    expect(
      buildWalkthroughMailto("aaron@example.com", [
        { name: "Faucet replacement", quantity: 2 },
        { name: "TV mount", quantity: 1 },
      ]),
    ).toBe(
      "mailto:aaron@example.com?subject=Walkthrough%20request&body=Hi%20Aaron%2C%0A%0AI%27d%20like%20to%20request%20a%20walkthrough%20for%3A%0A-%202%20%C3%97%20Faucet%20replacement%0A-%201%20%C3%97%20TV%20mount%0A%0AThank%20you.",
    );
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
