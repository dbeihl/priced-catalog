import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { services } from "../data/services";
import { BandRule } from "./BandRule";

describe("BandRule source citation", () => {
  it("links a detail citation when the published registry has a URL", () => {
    const service = services.find((item) => item.id === "faucet-replacement")!;
    const markup = renderToStaticMarkup(
      createElement(BandRule, { service, expanded: true }),
    );

    expect(markup).toContain(
      'href="https://homeguide.com/costs/faucet-installation-cost"',
    );
    expect(markup).toContain("HomeGuide, 2026");
  });

  it("keeps citations without a published URL as plain text", () => {
    const service = services.find(
      (item) => item.id === "softener-existing-loop",
    )!;
    const markup = renderToStaticMarkup(
      createElement(BandRule, { service, expanded: true }),
    );

    expect(markup).toContain("Angi / TapWaterData, 2026");
    expect(markup).not.toContain("<a");
  });
});
