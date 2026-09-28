import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ServiceRow } from "../components/ServiceRow";
import { services } from "./services";

const registry = readFileSync(new URL("../../SOURCES.md", import.meta.url), "utf8");

const renderCatalogRow = (serviceId: string) => {
  const service = services.find((candidate) => candidate.id === serviceId);
  if (!service) throw new Error(`Missing ${serviceId}`);
  return renderToStaticMarkup(
    createElement(ServiceRow, {
      service,
      onOpen: () => undefined,
      onAdd: () => undefined,
      inEstimate: false,
    }),
  );
};

describe("signed-off lead services in the catalog", () => {
  it("renders the approved prices and Add actions without quote-only labels", () => {
    const painting = renderCatalogRow("painting");
    const smallRepairs = renderCatalogRow("small-repairs");

    expect(painting).toContain("Interior bedroom repaint");
    expect(painting).toContain("$510");
    expect(painting).toContain(">Add<");
    expect(painting).not.toContain("Ask for a quote");
    expect(smallRepairs).toContain("Two-hour repair visit");
    expect(smallRepairs).toContain("$170");
    expect(smallRepairs).toContain(">Add<");
    expect(smallRepairs).not.toContain("Ask for a quote");
  });

  it("resolves both published bands to their source-registry rows", () => {
    expect(services.find((service) => service.id === "painting")?.marketBand?.source).toBe(
      "This Old House, Apr 2026",
    );
    expect(registry).toContain("| This Old House, Apr 2026");
    expect(registry).toContain(
      "https://www.thisoldhouse.com/painting/interior-painting-cost",
    );
    expect(services.find((service) => service.id === "small-repairs")?.marketBand?.source).toBe(
      "TM International, Apr 2026 (small repairs)",
    );
    expect(registry).toContain("| TM International, Apr 2026 (small repairs)");
    expect(registry).toContain(
      "https://tmgroupdc.com/blog/handyman-services-in-indianapolis-in-2026-pricing-hiring-guide/",
    );
  });
});

describe("hourly services", () => {
  const hourlyServiceIds = [
    "hourly-work",
    "three-way-switch-rewire",
    "doorbell-system-replacement",
    "dusk-to-dawn-light-repair",
  ];

  it("carries the $85 hourly rate, one-hour minimum, and pass-through materials", () => {
    for (const id of hourlyServiceIds) {
      const service = services.find((candidate) => candidate.id === id);

      expect(service, id).toMatchObject({
        pricing: {
          model: "hourly",
          rate: 85,
          unit: "hour",
          minimumUnits: 1,
        },
        basis: { hours: 1 },
        materials: "pass-through",
      });
    }
  });

  it("renders the hourly terms as one clear customer-facing price", () => {
    const row = renderCatalogRow("hourly-work");

    expect(row).toContain("$85/hr, one-hour minimum, plus materials");
  });

  it("keeps existing listed prices unchanged", () => {
    expect(services.find((service) => service.id === "smart-switch")?.pricing)
      .toMatchObject({ firstPrice: 85, additionalPrice: 65 });
    expect(services.find((service) => service.id === "video-doorbell")?.pricing)
      .toMatchObject({ model: "flat", price: 175, unit: "project" });
    expect(services.find((service) => service.id === "fixture-swap")?.pricing)
      .toMatchObject({ model: "flat", price: 150, unit: "project" });
  });
});
