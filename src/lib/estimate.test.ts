import { describe, expect, it } from "vitest";
import { calculateEstimate } from "./estimate";
import { services } from "../data/services";
import type { Service } from "../types";
import { pricing } from "../site.config";

const config = { visitMinimum: pricing.visitMinimum };
const run = (selections: Parameters<typeof calculateEstimate>[0]) =>
  calculateEstimate(selections, services, config);

describe("empty state", () => {
  it("returns zeroes and does not conjure a visit minimum", () => {
    const e = run([]);
    expect(e.isEmpty).toBe(true);
    expect(e.lines).toHaveLength(0);
    expect(e.laborLow).toBe(0);
    expect(e.totalLow).toBe(0);
    expect(e.totalHigh).toBe(0);
    expect(e.visitMinimumApplied).toBe(0);
    expect(e.materialsLow).toBe(0);
    expect(e.quoteRequired).toBe(false);
  });
});

describe("rule 1 — per-unit minimum floor", () => {
  it("bills 20 linear ft of baseboard at the 40 ft minimum", () => {
    const e = run([{ serviceId: "baseboard-new", quantity: 20 }]);
    const line = e.lines[0]!;
    expect(line.quantity).toBe(20);
    expect(line.billedQuantity).toBe(40);
    expect(line.minimumUnitsApplied).toBe(true);
    expect(line.low).toBe(180); // 40 × $4.50, not 20 × $4.50
    expect(e.totalLow).toBe(180);
  });

  it("leaves a quantity above the minimum alone", () => {
    const e = run([{ serviceId: "baseboard-new", quantity: 60 }]);
    const line = e.lines[0]!;
    expect(line.billedQuantity).toBe(60);
    expect(line.minimumUnitsApplied).toBe(false);
    expect(line.low).toBe(270);
  });

  it("bills exactly at the minimum without flagging it", () => {
    const line = run([{ serviceId: "baseboard-new", quantity: 40 }]).lines[0]!;
    expect(line.minimumUnitsApplied).toBe(false);
    expect(line.low).toBe(180);
  });
});

describe("rule 2 — small-room override at the flatBelowUnits boundary", () => {
  it("a 40 sq ft bathroom returns the flat range, not the per-sq-ft product", () => {
    const line = run([{ serviceId: "floor-lvp-tile", quantity: 40 }]).lines[0]!;
    expect(line.smallRoomOverride).toBe(true);
    expect(line.low).toBe(475);
    expect(line.high).toBe(650);
    expect(line.low).not.toBe(130); // 40 × $3.25 — the number the rule exists to prevent
  });

  it("99 sq ft is still flat", () => {
    const line = run([{ serviceId: "floor-lvp-tile", quantity: 99 }]).lines[0]!;
    expect(line.smallRoomOverride).toBe(true);
    expect(line.low).toBe(475);
    expect(line.high).toBe(650);
  });

  it("exactly 100 sq ft crosses to the per-sq-ft rate", () => {
    const line = run([{ serviceId: "floor-lvp-tile", quantity: 100 }])
      .lines[0]!;
    expect(line.smallRoomOverride).toBe(false);
    expect(line.low).toBe(325); // 100 × $3.25
    expect(line.high).toBe(325);
  });

  it("101 sq ft stays on the rate", () => {
    const line = run([{ serviceId: "floor-lvp-tile", quantity: 101 }])
      .lines[0]!;
    expect(line.smallRoomOverride).toBe(false);
    expect(line.low).toBe(328.25);
  });
});

describe("rule 4 — same-visit tiering", () => {
  it("prices one Shelly at the first-unit price, then the visit minimum tops it up", () => {
    const e = run([{ serviceId: "shelly-leak-shutoff", quantity: 1 }]);
    expect(e.laborLow).toBe(95);
    expect(e.visitMinimumApplied).toBe(30);
    expect(e.totalLow).toBe(125);
  });

  it("prices two as first plus one", () => {
    expect(
      run([{ serviceId: "shelly-leak-shutoff", quantity: 2 }]).totalLow,
    ).toBe(160);
  });

  it("prices five as first plus four", () => {
    expect(
      run([{ serviceId: "shelly-leak-shutoff", quantity: 5 }]).totalLow,
    ).toBe(355);
  });

  it("applies the same shape to ethernet drops", () => {
    expect(run([{ serviceId: "ethernet-drop", quantity: 3 }]).totalLow).toBe(
      525,
    ); // 225 + 150 + 150
  });
});

describe("rule 3 — visit minimum", () => {
  it("tops a single small mount up to the minimum and names the top-up", () => {
    const e = run([{ serviceId: "small-mount", quantity: 1 }]);
    expect(e.laborLow).toBe(65);
    expect(e.visitMinimumApplied).toBe(60);
    expect(e.totalLow).toBe(125);
  });

  it("does not bind once add-ons push the subtotal across it", () => {
    const e = run([
      {
        serviceId: "small-mount",
        quantity: 1,
        addOns: [{ id: "tile-drilling", quantity: 2 }],
      },
    ]);
    expect(e.laborLow).toBe(155); // $65 + 2 × $45
    expect(e.visitMinimumApplied).toBe(0);
    expect(e.totalLow).toBe(155);
  });

  it("binds on the subtotal AFTER add-ons, not before", () => {
    const e = run([
      {
        serviceId: "small-mount",
        quantity: 1,
        addOns: [{ id: "tile-drilling", quantity: 1 }],
      },
    ]);
    expect(e.laborLow).toBe(110); // $65 + $45, still short
    expect(e.visitMinimumApplied).toBe(15);
    expect(e.totalLow).toBe(125);
  });

  it("does not apply to a free walkthrough on its own", () => {
    const e = run([{ serviceId: "walkthrough" }]);
    expect(e.laborHigh).toBe(0);
    expect(e.visitMinimumApplied).toBe(0);
    expect(e.totalLow).toBe(0);
  });
});

describe("rule 6 — quote-only", () => {
  it("contributes $0 and flags the whole estimate", () => {
    const e = run([{ serviceId: "subfloor-repair" }]);
    expect(e.lines[0]!.low).toBe(0);
    expect(e.quoteRequired).toBe(true);
    expect(e.totalLow).toBe(0);
  });

  it("mixes with priced items without altering their total", () => {
    const e = run([
      { serviceId: "toilet-replacement" },
      { serviceId: "subfloor-repair" },
    ]);
    expect(e.laborLow).toBe(185);
    expect(e.totalLow).toBe(185);
    expect(e.quoteRequired).toBe(true);
  });

  it("flags the estimate when a quote-only ADD-ON is chosen", () => {
    // No catalog service currently carries a price-less add-on. This pins the
    // branch so one added later cannot contribute a silent $0.
    const withQuoteAddOn: Service[] = [
      {
        ...services.find((s) => s.id === "tv-mount")!,
        addOns: [{ id: "unknown-wall", name: "Masonry wall — quote" }],
      },
    ];
    const e = calculateEstimate(
      [{ serviceId: "tv-mount", addOns: [{ id: "unknown-wall" }] }],
      withQuoteAddOn,
      config,
    );
    expect(e.lines[0]!.addOns[0]!.low).toBe(0);
    expect(e.quoteRequired).toBe(true);
    expect(e.totalLow).toBe(225);
  });

  it("ignores a selection whose service id is not in the catalog", () => {
    const e = run([{ serviceId: "no-such-service" }, { serviceId: "tv-mount" }]);
    expect(e.lines).toHaveLength(1);
    expect(e.totalLow).toBe(225);
  });
});

describe("rule 5 — materials never enter the labor subtotal", () => {
  it("keeps a toilet swap material range off the labor number", () => {
    const e = run([{ serviceId: "toilet-replacement" }]);
    expect(e.laborLow).toBe(185);
    expect(e.totalLow).toBe(185);
    expect(e.materialsLow).toBe(15);
    expect(e.materialsHigh).toBe(40);
    expect(e.totalHigh).toBe(e.laborHigh); // materials sit outside the total entirely
  });

  it("sums materials across lines without touching labor", () => {
    const e = run([
      { serviceId: "toilet-replacement" }, // 15–40
      { serviceId: "faucet-replacement" }, // 15–35
    ]);
    expect(e.laborLow).toBe(350);
    expect(e.totalLow).toBe(350);
    expect(e.materialsLow).toBe(30);
    expect(e.materialsHigh).toBe(75);
  });
});

describe("add-ons", () => {
  it("rides the parent quantity when it shares the parent unit", () => {
    const e = run([
      {
        serviceId: "baseboard-new",
        quantity: 60,
        addOns: [{ id: "paint-stain" }],
      },
    ]);
    const addOn = e.lines[0]!.addOns[0]!;
    expect(addOn.quantity).toBe(60);
    expect(addOn.low).toBe(90); // 60 × $1.50
    expect(e.totalLow).toBe(360);
  });

  it("rides the FLOORED quantity, not the requested one", () => {
    const e = run([
      {
        serviceId: "baseboard-new",
        quantity: 20,
        addOns: [{ id: "paint-stain" }],
      },
    ]);
    expect(e.lines[0]!.addOns[0]!.low).toBe(60); // 40 × $1.50, matching the billed length
  });

  it("takes its own quantity when it carries its own unit", () => {
    const e = run([
      {
        serviceId: "shiplap-wall",
        quantity: 120,
        addOns: [{ id: "box-extenders", quantity: 3 }],
      },
    ]);
    const addOn = e.lines[0]!.addOns[0]!;
    expect(addOn.quantity).toBe(3);
    expect(addOn.low).toBe(45); // 3 × $15, NOT 120 × $15
  });

  it("adds a flat add-on once regardless of quantity", () => {
    const e = run([
      { serviceId: "tv-mount", addOns: [{ id: "in-wall-conceal" }] },
    ]);
    expect(e.totalLow).toBe(320); // 225 + 95
  });
});

describe("range behaviour", () => {
  it("reports a range when a small-room override is in play", () => {
    const e = run([{ serviceId: "floor-lvp-tile", quantity: 40 }]);
    expect(e.isRange).toBe(true);
    expect(e.totalLow).toBe(475);
    expect(e.totalHigh).toBe(650);
  });

  it("reports a single figure when every line is flat", () => {
    const e = run([
      { serviceId: "toilet-replacement" },
      { serviceId: "tv-mount" },
    ]);
    expect(e.isRange).toBe(false);
    expect(e.totalLow).toBe(410);
  });
});

describe("catalog integrity", () => {
  it("every service carries a basis and a market band", () => {
    for (const service of services) {
      expect(service.basis, service.id).toBeTruthy();
      expect(service.basis.hours, service.id).toBeDefined();
      expect(service.marketBand.source, service.id).toBeTruthy();
      expect(service.marketBand.high, service.id).toBeGreaterThan(
        service.marketBand.low,
      );
    }
  });

  it("has no duplicate ids", () => {
    const ids = services.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("never renders the effective rate anywhere in the catalog copy", () => {
    const blob = JSON.stringify(services);
    expect(blob).not.toContain("$85/hr");
    expect(blob).not.toContain("$85 an hour");
  });
});
