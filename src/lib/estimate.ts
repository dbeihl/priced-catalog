import type { AddOn, Service } from "../types";

/** Pure. No React, no DOM, no imports from site.config beyond plain numbers passed in. */

export interface AddOnSelection {
  id: string;
  /** Only read for add-ons that carry their own `unit` (see AddOn.unit). */
  quantity?: number;
}

export interface LineSelection {
  serviceId: string;
  /** Units for per-unit services, device/drop count for tiered ones. Defaults to 1. */
  quantity?: number;
  addOns?: AddOnSelection[];
}

export interface EstimateAddOnLine {
  id: string;
  name: string;
  quantity: number;
  low: number;
  high: number;
  quoteRequired: boolean;
}

export interface EstimateLine {
  serviceId: string;
  name: string;
  /** What the customer asked for. */
  quantity: number;
  /** What gets billed, after any minimum-units floor. */
  billedQuantity: number;
  unit: string;
  /** Labor for the service itself, before its add-ons. */
  serviceLow: number;
  serviceHigh: number;
  addOns: EstimateAddOnLine[];
  /** Service plus its add-ons. */
  low: number;
  high: number;
  quoteRequired: boolean;
  /** True when the quantity was floored to `minimumUnits`. */
  minimumUnitsApplied: boolean;
  /** True when the per-unit rate was ignored in favour of `flatBelowPrice`. */
  smallRoomOverride: boolean;
  notes: string[];
}

export interface Estimate {
  lines: EstimateLine[];
  /** Labor after add-ons, before the visit minimum. */
  laborLow: number;
  laborHigh: number;
  /** Top-up added to reach the visit minimum. 0 when it does not bind. */
  visitMinimumApplied: number;
  /** Labor including any visit-minimum top-up. Materials are NOT in here. */
  totalLow: number;
  totalHigh: number;
  /** Always its own line. Never folded into labor. */
  materialsLow: number;
  materialsHigh: number;
  quoteRequired: boolean;
  isRange: boolean;
  isEmpty: boolean;
}

const round = (n: number): number => Math.round(n * 100) / 100;

function priceAddOn(
  addOn: AddOn,
  parentQuantity: number,
  ownQuantity: number,
): EstimateAddOnLine {
  // Neither a price nor a rate means the add-on is quote-only.
  if (addOn.price === undefined && addOn.rate === undefined) {
    return {
      id: addOn.id,
      name: addOn.name,
      quantity: 1,
      low: 0,
      high: 0,
      quoteRequired: true,
    };
  }
  if (addOn.price !== undefined) {
    return {
      id: addOn.id,
      name: addOn.name,
      quantity: 1,
      low: addOn.price,
      high: addOn.price,
      quoteRequired: false,
    };
  }
  const rate = addOn.rate ?? 0;
  // An add-on measured in its OWN unit takes its own quantity. One measured in the
  // parent's unit rides the parent's billed quantity.
  const quantity =
    addOn.unit === undefined ? parentQuantity : Math.max(0, ownQuantity);
  const amount = round(rate * quantity);
  return {
    id: addOn.id,
    name: addOn.name,
    quantity,
    low: amount,
    high: amount,
    quoteRequired: false,
  };
}

function priceService(
  service: Service,
  requestedQuantity: number,
): {
  low: number;
  high: number;
  billedQuantity: number;
  quoteRequired: boolean;
  minimumUnitsApplied: boolean;
  smallRoomOverride: boolean;
  notes: string[];
} {
  const p = service.pricing;
  const notes: string[] = [];
  const quantity = Math.max(0, requestedQuantity);

  // Rule 6 — quote-only contributes nothing and flags the whole estimate.
  if (p.model === "quote-only") {
    return {
      low: 0,
      high: 0,
      billedQuantity: quantity,
      quoteRequired: true,
      minimumUnitsApplied: false,
      smallRoomOverride: false,
      notes: ["Quote required. This line contributes $0 until it is quoted."],
    };
  }

  // Rule 4 — same-visit tiering. First unit at firstPrice, the rest at additionalPrice.
  if (p.firstPrice !== undefined) {
    const additional = p.additionalPrice ?? p.firstPrice;
    const amount =
      quantity <= 0 ? 0 : round(p.firstPrice + (quantity - 1) * additional);
    if (quantity > 1) {
      notes.push(
        `First at $${p.firstPrice}, ${quantity - 1} more at $${additional} each on the same visit.`,
      );
    }
    return {
      low: amount,
      high: amount,
      billedQuantity: quantity,
      quoteRequired: false,
      minimumUnitsApplied: false,
      smallRoomOverride: false,
      notes,
    };
  }

  if (p.model === "per-unit") {
    // Rule 2 — small-room override. Strictly BELOW the threshold the rate is ignored
    // entirely. At the threshold the rate applies. This is a rule, not a rounding.
    if (
      p.flatBelowUnits !== undefined &&
      p.flatBelowPrice !== undefined &&
      quantity < p.flatBelowUnits
    ) {
      notes.push(
        `Under ${p.flatBelowUnits} ${service.pricing.unit} this is priced flat, not by the ${service.pricing.unit}. Mobilisation is a fixed cost and the per-unit rate cannot express it.`,
      );
      return {
        low: p.flatBelowPrice[0],
        high: p.flatBelowPrice[1],
        billedQuantity: quantity,
        quoteRequired: false,
        minimumUnitsApplied: false,
        smallRoomOverride: true,
        notes,
      };
    }

    // Rule 1 — minimum units floor.
    let billedQuantity = quantity;
    let minimumUnitsApplied = false;
    if (p.minimumUnits !== undefined && quantity < p.minimumUnits) {
      billedQuantity = p.minimumUnits;
      minimumUnitsApplied = true;
      notes.push(`Billed at the ${p.minimumUnits} ${p.unit} minimum.`);
    }
    const amount = round((p.rate ?? 0) * billedQuantity);
    return {
      low: amount,
      high: amount,
      billedQuantity,
      quoteRequired: false,
      minimumUnitsApplied,
      smallRoomOverride: false,
      notes,
    };
  }

  if (p.model === "range") {
    const low = p.low ?? p.price ?? 0;
    const high = p.high ?? p.price ?? 0;
    return {
      low,
      high,
      billedQuantity: quantity,
      quoteRequired: false,
      minimumUnitsApplied: false,
      smallRoomOverride: false,
      notes,
    };
  }

  // flat
  const price = p.price ?? 0;
  const amount = round(price * Math.max(1, quantity));
  return {
    low: amount,
    high: amount,
    billedQuantity: quantity,
    quoteRequired: false,
    minimumUnitsApplied: false,
    smallRoomOverride: false,
    notes,
  };
}

export function calculateEstimate(
  selections: LineSelection[],
  services: Service[],
  config: { visitMinimum: number },
): Estimate {
  const byId = new Map(services.map((s) => [s.id, s]));
  const lines: EstimateLine[] = [];

  for (const selection of selections) {
    const service = byId.get(selection.serviceId);
    if (!service) continue;

    const quantity = selection.quantity ?? 1;
    const priced = priceService(service, quantity);

    const addOnLines: EstimateAddOnLine[] = [];
    for (const chosen of selection.addOns ?? []) {
      const addOn = service.addOns?.find((a) => a.id === chosen.id);
      if (!addOn) continue;
      addOnLines.push(
        priceAddOn(addOn, priced.billedQuantity, chosen.quantity ?? 1),
      );
    }

    const addOnLow = addOnLines.reduce((sum, a) => sum + a.low, 0);
    const addOnHigh = addOnLines.reduce((sum, a) => sum + a.high, 0);

    lines.push({
      serviceId: service.id,
      name: service.name,
      quantity,
      billedQuantity: priced.billedQuantity,
      unit: service.pricing.unit,
      serviceLow: priced.low,
      serviceHigh: priced.high,
      addOns: addOnLines,
      low: round(priced.low + addOnLow),
      high: round(priced.high + addOnHigh),
      quoteRequired:
        priced.quoteRequired || addOnLines.some((a) => a.quoteRequired),
      minimumUnitsApplied: priced.minimumUnitsApplied,
      smallRoomOverride: priced.smallRoomOverride,
      notes: priced.notes,
    });
  }

  // Rule 3 — the visit minimum applies to the labor subtotal AFTER add-ons.
  const laborLow = round(lines.reduce((sum, l) => sum + l.low, 0));
  const laborHigh = round(lines.reduce((sum, l) => sum + l.high, 0));

  // It binds only when there is priced work to bind to. A basket of quote-only
  // lines, or a free walkthrough, does not conjure a $125 charge.
  const binds = laborHigh > 0 && laborLow < config.visitMinimum;
  const visitMinimumApplied = binds ? round(config.visitMinimum - laborLow) : 0;
  const totalLow = binds ? config.visitMinimum : laborLow;
  const totalHigh = binds
    ? Math.max(laborHigh, config.visitMinimum)
    : laborHigh;

  // Rule 5 — materials never enter the labor subtotal.
  let materialsLow = 0;
  let materialsHigh = 0;
  for (const line of lines) {
    const service = byId.get(line.serviceId);
    if (!service) continue;
    materialsLow += service.materialsLow ?? 0;
    materialsHigh += service.materialsHigh ?? 0;
  }

  return {
    lines,
    laborLow,
    laborHigh,
    visitMinimumApplied,
    totalLow,
    totalHigh,
    materialsLow: round(materialsLow),
    materialsHigh: round(materialsHigh),
    quoteRequired: lines.some((l) => l.quoteRequired),
    isRange: totalLow !== totalHigh,
    isEmpty: lines.length === 0,
  };
}
