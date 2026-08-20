import { useEffect, useRef } from "react";
import type { Service } from "../types";
import { BandRule } from "./BandRule";
import { headlinePrice, hoursLabel, money, unitLabel } from "../lib/format";
import { materialsNote } from "../site.config";

const materialsCopy: Record<Service["materials"], string> = {
  "client-supplied": "You buy the parts. I will tell you exactly what to get.",
  "pass-through":
    "Materials at cost, with receipts. Never marked up, never inside the labor number.",
  included: "Materials are included in the price above.",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-rule pt-3">
      <h3 className="mb-1.5 text-[11px] uppercase tracking-wider text-ink-2">
        {title}
      </h3>
      {children}
    </section>
  );
}

/**
 * Native <dialog> so Escape, the backdrop, and initial focus come from the
 * platform instead of a hand-rolled focus trap.
 */
export function DetailPanel({
  service,
  onClose,
  onAdd,
}: {
  service: Service | null;
  onClose: () => void;
  onAdd: (id: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (service && !el.open) el.showModal();
    if (!service && el.open) el.close();
  }, [service]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-0 max-h-[86dvh] w-full max-w-none bg-field p-0 text-ink backdrop:bg-ink/40 mt-auto lg:ml-auto lg:mr-0 lg:my-0 lg:h-dvh lg:max-h-none lg:w-[30rem]"
    >
      {service && (
        <div className="flex h-full flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-rule px-5 py-4">
            <div className="min-w-0">
              <h2 className="text-[17px] font-semibold leading-snug">
                {service.name}
              </h2>
              <p className="fig mt-1 text-[15px]">
                {headlinePrice(service)}
                <span className="ml-2 text-[13px] text-ink-2">
                  {hoursLabel(service.basis.hours)}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 border border-ink px-2 py-1 text-[12px] hover:bg-mark"
            >
              Close
            </button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <p className="text-[14px] leading-relaxed">{service.description}</p>

            <Section title="Where this number comes from">
              <p className="text-[14px] leading-relaxed">
                {hoursLabel(service.basis.hours)} of work.
                {service.basis.pace ? ` Pace is ${service.basis.pace}.` : ""}
              </p>
              {service.basis.note && (
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">
                  {service.basis.note}
                </p>
              )}
            </Section>

            <Section title="What the market charges">
              <BandRule service={service} expanded />
            </Section>

            {service.pricing.assumptions &&
              service.pricing.assumptions.length > 0 && (
                <Section title="Assumes">
                  <ul className="space-y-1 text-[14px] leading-snug">
                    {service.pricing.assumptions.map((a) => (
                      <li
                        key={a}
                        className="pl-3 -indent-3 before:pr-1.5 before:content-['—']"
                      >
                        {a}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

            <Section title="Includes">
              <ul className="space-y-1 text-[14px] leading-snug">
                {service.includes.map((i) => (
                  <li
                    key={i}
                    className="pl-3 -indent-3 before:pr-1.5 before:content-['—']"
                  >
                    {i}
                  </li>
                ))}
              </ul>
            </Section>

            {service.excludes && service.excludes.length > 0 && (
              <Section title="Not included">
                <ul className="space-y-1 text-[14px] leading-snug text-ink-2">
                  {service.excludes.map((i) => (
                    <li
                      key={i}
                      className="pl-3 -indent-3 before:pr-1.5 before:content-['—']"
                    >
                      {i}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {service.addOns && service.addOns.length > 0 && (
              <Section title="Add-ons">
                <ul className="space-y-2 text-[14px] leading-snug">
                  {service.addOns.map((a) => (
                    <li key={a.id} className="flex justify-between gap-4">
                      <span>
                        {a.name}
                        {a.note && (
                          <span className="block text-[12px] text-ink-2">
                            {a.note}
                          </span>
                        )}
                      </span>
                      <span className="fig shrink-0">
                        {a.price !== undefined
                          ? `+${money(a.price)}`
                          : a.rate !== undefined
                            ? `+${money(a.rate)}/${unitLabel[a.unit ?? service.pricing.unit]}`
                            : "Quote"}
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section title="Materials">
              <p className="text-[14px] leading-relaxed">
                {materialsCopy[service.materials]}
              </p>
              {service.materialsLow !== undefined &&
                service.materialsHigh !== undefined && (
                  <p className="fig mt-1 text-[13px] text-ink-2">
                    Typically {money(service.materialsLow)}–
                    {money(service.materialsHigh)} on this job.
                  </p>
                )}
              <p className="mt-1.5 text-[12px] leading-snug text-ink-2">
                {materialsNote}
              </p>
            </Section>
          </div>

          <footer className="border-t border-rule px-5 py-3">
            <button
              type="button"
              onClick={() => onAdd(service.id)}
              className="w-full border border-ink bg-mark px-3 py-2 text-[13px] font-semibold hover:bg-transparent"
            >
              Add to estimate
            </button>
          </footer>
        </div>
      )}
    </dialog>
  );
}
