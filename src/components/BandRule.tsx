import type { Service } from "../types";
import {
  bandPosition,
  bandValue,
  money,
  marketBandLabel,
  perUnit,
} from "../lib/format";

/**
 * The signature element: a measured scale spanning the market band, with his
 * price marked by a notch at its true position.
 *
 * The notch is never the only signal — his price and both endpoints are always
 * printed adjacent, so this degrades cleanly to plain numbers.
 */
export function BandRule({
  service,
  expanded = false,
}: {
  service: Service;
  expanded?: boolean;
}) {
  const position = bandPosition(service);
  const value = bandValue(service);
  const { low, high, unit, source, note } = service.marketBand;
  const suffix =
    unit === "project" || unit === "room" || unit === "day"
      ? ""
      : perUnit(unit);

  if (position === null || value === null) {
    return (
      <p className="fig text-[11px] leading-tight text-ink-2">
        Market {marketBandLabel(service)} · {source}
      </p>
    );
  }

  return (
    <div className={expanded ? "pt-1" : ""}>
      <div
        aria-hidden="true"
        className={`relative w-full ${expanded ? "h-3 mb-2" : "h-2 mb-1"}`}
      >
        {/* the track */}
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-rule" />
        {/* end ticks */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-rule" />
        <div className="absolute right-0 top-0 bottom-0 w-px bg-rule" />
        {/* his price */}
        <div
          className="absolute top-0 bottom-0 w-[3px] -translate-x-1/2 bg-mark ring-1 ring-ink/80"
          style={{ left: `${position * 100}%` }}
        />
      </div>

      <p className="fig flex flex-wrap items-baseline gap-x-1.5 text-[11px] leading-tight text-ink-2">
        <span>{money(low)}</span>
        <span aria-hidden="true">–</span>
        <span>
          {money(high)}
          {suffix}
        </span>
        <span className="text-ink-2/70">market</span>
        <span className="text-ink">
          · his {money(value)}
          {suffix}
        </span>
      </p>

      {expanded && (
        <p className="mt-1.5 text-[12px] leading-snug text-ink-2">
          Source: {source}
          {note ? `. ${note}` : ""}
        </p>
      )}
    </div>
  );
}
