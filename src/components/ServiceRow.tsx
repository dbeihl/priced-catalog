import type { Category, Service } from "../types";
import { BandRule } from "./BandRule";
import { awaitingPrice, headlinePrice, hoursLabel, unitLabel } from "../lib/format";

const tagColor: Record<Category, string> = {
  water: "var(--tag-water)",
  "smart-home": "var(--tag-comms)",
  general: "var(--tag-electric)",
  flooring: "var(--tag-neutral)",
  carpentry: "var(--tag-neutral)",
  doors: "var(--tag-neutral)",
};

export function ServiceRow({
  service,
  onOpen,
  onAdd,
  inEstimate,
}: {
  service: Service;
  onOpen: () => void;
  onAdd: () => void;
  inEstimate: boolean;
}) {
  return (
    <li className="relative border-b border-rule bg-field">
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: tagColor[service.category] }}
      />
      <div className="grid grid-cols-1 gap-x-6 gap-y-3 py-4 pl-5 pr-4 lg:grid-cols-[minmax(0,1fr)_10rem_5rem_14rem_5.5rem] lg:items-start">
        {/* name + blurb */}
        <div className="min-w-0">
          <button
            type="button"
            onClick={onOpen}
            className="text-left text-[15px] font-semibold leading-snug hover:underline"
          >
            {service.name}
          </button>
          <p className="mt-0.5 text-[13px] leading-snug text-ink-2">
            {service.blurb}
          </p>
          {service.confirmBy && (
            <span className="mt-1.5 inline-block border border-rule px-1.5 py-px text-[10px] uppercase tracking-wide text-ink-2">
              Confirmed by {service.confirmBy}
            </span>
          )}
        </div>

        {/* price */}
        <div className="lg:text-right">
          <span className="fig text-[15px] font-medium">
            {headlinePrice(service)}
          </span>
          {service.pricing.minimumUnits !== undefined && (
            <span className="fig ml-1 block text-[11px] text-ink-2 lg:mt-0.5">
              {service.pricing.minimumUnits} {unitLabel[service.pricing.unit]}{" "}
              minimum
            </span>
          )}
        </div>

        <div className="lg:text-right">
          {service.basis && (
            <>
              <span className="fig text-[13px]">
                {hoursLabel(service.basis.hours)}
              </span>
              {service.basis.pace && (
                <span className="block text-[11px] leading-tight text-ink-2 lg:mt-0.5">
                  {service.basis.pace}
                </span>
              )}
            </>
          )}
        </div>

        <div className="min-w-0">
          {service.marketBand && <BandRule service={service} />}
        </div>

        <div className="lg:text-right">
          {awaitingPrice(service) ? (
            <a
              href="#contact"
              className="inline-block border border-ink px-2.5 py-1 text-[12px] font-medium hover:bg-mark"
            >
              Ask for a quote
            </a>
          ) : (
            <button
              type="button"
              onClick={onAdd}
              className="border border-ink px-2.5 py-1 text-[12px] font-medium hover:bg-mark"
            >
              {inEstimate ? "Add again" : "Add"}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
