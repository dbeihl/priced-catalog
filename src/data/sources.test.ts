import { describe, expect, it } from "vitest";
import { services } from "./services";
import { sourceFor } from "./sources";

describe("source citations", () => {
  it("returns the published URL for a citation that has one", () => {
    expect(sourceFor("HomeGuide, 2026 (faucet)")?.url).toBe(
      "https://homeguide.com/costs/faucet-installation-cost",
    );
  });

  it("keeps a source with no published URL unlinked", () => {
    expect(sourceFor("Angi / TapWaterData, 2026")?.url).toBeUndefined();
  });

  it("resolves every service's source key to a registry row", () => {
    const missing = services
      .filter(({ marketBand }) => marketBand?.sourceKey)
      .filter(({ marketBand }) => !sourceFor(marketBand!.sourceKey!))
      .map(({ id }) => id);

    expect(missing).toEqual([]);
  });
});
