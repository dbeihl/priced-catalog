import type { Service } from "../types";
import { BandRule } from "./BandRule";
import {
  awaitingPrice,
  headlinePrice,
  hoursLabel,
  money,
  unitLabel,
} from "../lib/format";
import { pricing } from "../site.config";

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
    <li className="service-row">
      <div className="service-content">
        <div className="min-w-0">
          <button
            type="button"
            onClick={onOpen}
            className="min-h-11 text-left text-[17px] font-semibold leading-snug hover:underline"
          >
            {service.name}
          </button>
          <p className="mt-0.5 text-[14px] leading-relaxed text-ink-2">
            {service.blurb}
          </p>
          {service.confirmBy && (
            <span className="mt-1.5 inline-block rounded-full bg-field px-2 py-0.5 text-[11px] text-ink-2">
              Confirmed by {service.confirmBy}
            </span>
          )}
        </div>

        <div className="service-price">
          <span className="fig whitespace-nowrap text-[17px] font-semibold">
            {headlinePrice(service)}
            {service.pricing.unit === "hour" && " plus materials"}
          </span>
          {service.pricing.unit === "hour" ? (
            <span className="fig block text-[11px] text-ink-2 lg:mt-0.5">
              {money(pricing.visitMinimum)} minimum visit
            </span>
          ) : (
            service.pricing.minimumUnits !== undefined && (
              <span className="fig block text-[11px] text-ink-2 lg:mt-0.5">
                {service.pricing.minimumUnits} {unitLabel[service.pricing.unit]}{" "}
                minimum
              </span>
            )
          )}
        </div>

        <div className="service-hours">
          {service.basis && (
            <>
              <span className="fig text-[14px]">
                <span className="text-ink-2">Hours: </span>
                {hoursLabel(service.basis.hours)}
              </span>
              {service.basis.pace && (
                <span className="block text-[11px] leading-tight text-ink-2 [text-wrap:balance] lg:mt-0.5">
                  {service.basis.pace}
                </span>
              )}
            </>
          )}
        </div>

        <div className="service-market min-w-0">
          {service.marketBand && <BandRule service={service} />}
        </div>

        <div className="service-action">
          {awaitingPrice(service) ? (
            <a
              href="#contact"
              className="inline-flex min-h-11 items-center rounded-md border border-rule px-3.5 py-1 text-[13px] font-semibold hover:border-mark hover:bg-mark hover:text-on-mark"
            >
              Ask for a quote
            </a>
          ) : (
            <button
              type="button"
              onClick={onAdd}
              className="min-h-11 rounded-md border border-rule px-3.5 py-1 text-[13px] font-semibold hover:border-mark hover:bg-mark hover:text-on-mark"
            >
              {inEstimate ? "Add again" : "Add"}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
