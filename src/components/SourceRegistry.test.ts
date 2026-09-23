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

  it("renders the confirmed Fixr whole-home Wi-Fi row with its figures and link", () => {
    expect(markup).toContain("Fixr, Sep 2026 (whole-home Wi-Fi)");
    expect(markup).toContain("Whole-home Wi-Fi $300–$500, national average $350");
    expect(markup).toContain(
      'href="https://www.fixr.com/costs/install-wireless-computer-network"',
    );
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
