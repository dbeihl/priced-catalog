import type { Service, Unit } from "../types";

const usd = (n: number, cents: boolean) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });

/** Whole dollars unless the figure genuinely has cents, e.g. a $4.50 rate. */
export const money = (n: number): string => usd(n, !Number.isInteger(n));

export const moneyRange = (low: number, high: number): string =>
  low === high ? money(low) : `${money(low)} – ${money(high)}`;

export const unitLabel: Record<Unit, string> = {
  project: "project",
  "linear-ft": "linear ft",
  "sq-ft": "sq ft",
  device: "each",
  drop: "drop",
  room: "room",
  day: "day",
};

/** Short unit for a rate suffix: "/linear ft". */
export const perUnit = (unit: Unit): string => `/${unitLabel[unit]}`;

export function hoursLabel(hours: number | [number, number]): string {
  const one = (n: number) => (Number.isInteger(n) ? `${n}` : `${n}`);
  if (Array.isArray(hours)) return `${one(hours[0])}–${one(hours[1])} hr`;
  return `${one(hours)} hr`;
}

/** The headline price for a catalog row. */
export function headlinePrice(service: Service): string {
  const p = service.pricing;
  if (p.model === "quote-only") return "Quote";
  if (p.firstPrice !== undefined) {
    const additional = p.additionalPrice;
    return additional === undefined
      ? money(p.firstPrice)
      : `${money(p.firstPrice)} then ${money(additional)}`;
  }
  if (p.model === "per-unit" && p.rate !== undefined)
    return `${money(p.rate)}${perUnit(p.unit)}`;
  if (p.model === "range" && p.low !== undefined && p.high !== undefined)
    return moneyRange(p.low, p.high);
  if (p.price === 0) return "Free";
  return money(p.price ?? 0);
}

export function marketBandLabel(service: Service): string {
  const { low, high, unit } = service.marketBand;
  const suffix =
    unit === "project" || unit === "room" || unit === "day"
      ? ""
      : perUnit(unit);
  return `${money(low)}–${money(high)}${suffix}`;
}

/**
 * Where his price sits inside the market band, 0–1, clamped.
 * Returns null when there is no single comparable figure to place.
 */
export function bandPosition(service: Service): number | null {
  const p = service.pricing;
  const value =
    p.rate ??
    p.firstPrice ??
    (p.model === "range" && p.low !== undefined && p.high !== undefined
      ? (p.low + p.high) / 2
      : undefined) ??
    p.price;
  if (value === undefined || p.model === "quote-only") return null;
  const { low, high } = service.marketBand;
  if (high <= low) return null;
  return Math.min(1, Math.max(0, (value - low) / (high - low)));
}

/** The comparable figure the notch marks, for the label beside it. */
export function bandValue(service: Service): number | null {
  const p = service.pricing;
  if (p.model === "quote-only") return null;
  if (p.rate !== undefined) return p.rate;
  if (p.firstPrice !== undefined) return p.firstPrice;
  if (p.model === "range" && p.low !== undefined && p.high !== undefined)
    return (p.low + p.high) / 2;
  return p.price ?? null;
}
