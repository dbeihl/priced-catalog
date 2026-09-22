import { describe, expect, it } from "vitest";
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
});
