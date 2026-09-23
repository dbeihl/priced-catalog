import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { sources } from "../data/sources";
import { SourceRegistry } from "./SourceRegistry";

describe("SourceRegistry", () => {
  const markup = renderToStaticMarkup(createElement(SourceRegistry));

  it("links registry rows that have a published URL", () => {
    expect(markup).toContain(
      'href="https://homeguide.com/costs/faucet-installation-cost"',
    );
  });

  it("renders the unconfirmed whole-home Wi-Fi row without its link", () => {
    expect(markup).toContain("HomeGuide, 2026 (whole-home Wi-Fi)");
    expect(markup).not.toContain("fixr.com/costs/install-wireless-computer-network");
  });

  it("renders every registry row with its source key as a deep-link anchor", () => {
    for (const source of sources) {
      const escapedName = source.shortName.replaceAll("&", "&amp;");

      expect(markup).toContain(escapedName);
      expect(markup).toContain(
        `id="${escapedName}"`,
      );
    }
  });
});
