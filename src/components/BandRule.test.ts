import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { services } from "../data/services";
import { BandRule } from "./BandRule";

describe("BandRule source citation", () => {
  it("links a detail citation to its source registry anchor", () => {
    const service = services.find((item) => item.id === "faucet-replacement")!;
    const markup = renderToStaticMarkup(
      createElement(BandRule, { service, expanded: true }),
    );

    expect(markup).toContain(
      'href="sources.html#HomeGuide%2C%202026%20(faucet)"',
    );
    expect(markup).toContain("HomeGuide, 2026");
  });

  it("links citations without a published URL to their registry rows", () => {
    const service = services.find(
      (item) => item.id === "softener-existing-loop",
    )!;
    const markup = renderToStaticMarkup(
      createElement(BandRule, { service, expanded: true }),
    );

    expect(markup).toContain("Angi / TapWaterData, 2026");
    expect(markup).toContain(
      'href="sources.html#Angi%20%2F%20TapWaterData%2C%202026"',
    );
  });

  it("keeps the unconfirmed wifi-survey citation unlinked", () => {
    const service = services.find((item) => item.id === "wifi-survey")!;
    const markup = renderToStaticMarkup(
      createElement(BandRule, { service, expanded: true }),
    );

    expect(markup).toContain("HomeGuide, 2026");
    expect(markup).not.toContain("<a");
  });
});
