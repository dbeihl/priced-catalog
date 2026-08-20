import type { Service } from "../types";
import type { Estimate, LineSelection } from "../lib/estimate";
import { money, moneyRange, unitLabel } from "../lib/format";
import { disclaimer, materialsNote, pricing } from "../site.config";

export interface KeyedSelection extends LineSelection {
  key: number;
}

interface Props {
  selections: KeyedSelection[];
  estimate: Estimate;
  services: Service[];
  onQuantity: (key: number, quantity: number) => void;
  onToggleAddOn: (key: number, addOnId: string) => void;
  onAddOnQuantity: (key: number, addOnId: string, quantity: number) => void;
  onRemove: (key: number) => void;
}

const needsQuantity = (s: Service) =>
  s.pricing.model === "per-unit" || s.pricing.firstPrice !== undefined;

function Total({ estimate }: { estimate: Estimate }) {
  if (estimate.isEmpty)
    return <span className="fig text-[15px] text-ink-2">$0</span>;
  return (
    <span className="fig text-[17px] font-medium">
      {estimate.isRange
        ? moneyRange(estimate.totalLow, estimate.totalHigh)
        : money(estimate.totalLow)}
    </span>
  );
}

function Body({
  selections,
  estimate,
  services,
  onQuantity,
  onToggleAddOn,
  onAddOnQuantity,
  onRemove,
}: Props) {
  const byId = new Map(services.map((s) => [s.id, s]));

  if (estimate.isEmpty) {
    return (
      <p className="px-4 py-5 text-[13px] leading-snug text-ink-2">
        Nothing on the list yet. Add a service and the arithmetic runs here,
        line by line.
      </p>
    );
  }

  return (
    <div className="max-h-[48dvh] overflow-y-auto lg:max-h-none">
      <ul>
        {selections.map((selection, index) => {
          const service = byId.get(selection.serviceId);
          const line = estimate.lines[index];
          if (!service || !line) return null;
          const chosen = new Set((selection.addOns ?? []).map((a) => a.id));

          return (
            <li key={selection.key} className="border-b border-rule px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[13px] font-medium leading-snug">
                  {service.name}
                </span>
                <span className="fig shrink-0 text-[13px]">
                  {line.quoteRequired && line.low === 0
                    ? "Quote"
                    : moneyRange(line.low, line.high)}
                </span>
              </div>

              {needsQuantity(service) && (
                <label className="mt-2 flex items-center gap-2 text-[12px] text-ink-2">
                  <span>{unitLabel[service.pricing.unit]}</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={selection.quantity ?? 1}
                    onChange={(e) =>
                      onQuantity(selection.key, Number(e.target.value))
                    }
                    className="fig w-20 border border-rule bg-paper px-1.5 py-0.5 text-[12px] text-ink"
                  />
                  {line.minimumUnitsApplied && (
                    <span className="fig text-ink">
                      billed at {line.billedQuantity} minimum
                    </span>
                  )}
                  {line.smallRoomOverride && (
                    <span className="fig text-ink">
                      flat, under the threshold
                    </span>
                  )}
                </label>
              )}

              {service.addOns && service.addOns.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {service.addOns.map((addOn) => {
                    const on = chosen.has(addOn.id);
                    const ownQuantity =
                      selection.addOns?.find((a) => a.id === addOn.id)
                        ?.quantity ?? 1;
                    return (
                      <li
                        key={addOn.id}
                        className="flex flex-wrap items-center gap-2"
                      >
                        <label className="flex items-center gap-1.5 text-[12px]">
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() =>
                              onToggleAddOn(selection.key, addOn.id)
                            }
                            className="accent-mark"
                          />
                          <span className={on ? "" : "text-ink-2"}>
                            {addOn.name}
                          </span>
                        </label>
                        {on && addOn.unit !== undefined && (
                          <input
                            type="number"
                            min={0}
                            step={1}
                            aria-label={`${addOn.name}, ${unitLabel[addOn.unit]}`}
                            value={ownQuantity}
                            onChange={(e) =>
                              onAddOnQuantity(
                                selection.key,
                                addOn.id,
                                Number(e.target.value),
                              )
                            }
                            className="fig w-16 border border-rule bg-paper px-1.5 py-0.5 text-[12px]"
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {line.notes.map((note) => (
                <p
                  key={note}
                  className="mt-1.5 text-[11px] leading-snug text-ink-2"
                >
                  {note}
                </p>
              ))}

              <button
                type="button"
                onClick={() => onRemove(selection.key)}
                className="mt-2 text-[11px] uppercase tracking-wide text-ink-2 underline"
              >
                Remove
              </button>
            </li>
          );
        })}
      </ul>

      <dl className="space-y-1.5 border-b border-rule px-4 py-3 text-[13px]">
        <div className="flex justify-between gap-3">
          <dt className="text-ink-2">Labor subtotal</dt>
          <dd className="fig">
            {moneyRange(estimate.laborLow, estimate.laborHigh)}
          </dd>
        </div>
        {estimate.visitMinimumApplied > 0 && (
          <div className="flex justify-between gap-3">
            <dt className="text-ink-2">Minimum visit charge applied</dt>
            <dd className="fig">+{money(estimate.visitMinimumApplied)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-3 border-t border-rule pt-1.5 font-medium">
          <dt>Labor total</dt>
          <dd className="fig">
            {estimate.isRange
              ? moneyRange(estimate.totalLow, estimate.totalHigh)
              : money(estimate.totalLow)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink-2">Materials, estimated</dt>
          <dd className="fig text-ink-2">
            {estimate.materialsHigh > 0
              ? moneyRange(estimate.materialsLow, estimate.materialsHigh)
              : "client-supplied"}
          </dd>
        </div>
      </dl>

      <div className="space-y-2 px-4 py-3 text-[11px] leading-snug text-ink-2">
        {estimate.visitMinimumApplied > 0 && (
          <p>
            The visit minimum is {money(pricing.visitMinimum)}. It is shown as
            its own line rather than hidden inside the price, because a short
            job still costs a trip.
          </p>
        )}
        <p>{materialsNote}</p>
        {estimate.quoteRequired && (
          <p className="border border-ink bg-mark px-2 py-1.5 text-ink">
            One or more lines are quote-only and contribute $0 here. This
            estimate is not complete until those are quoted in writing.
          </p>
        )}
        <p>{disclaimer}</p>
      </div>
    </div>
  );
}

export function EstimateBuilder(props: Props) {
  const count = props.selections.length;
  return (
    <>
      {/* desktop: a running tally in the right rail */}
      <aside className="hidden lg:block">
        <div className="sticky top-4 border border-rule bg-field">
          <header className="flex items-baseline justify-between gap-3 border-b border-rule px-4 py-3">
            <h2 className="text-[12px] uppercase tracking-wider text-ink-2">
              Running estimate
            </h2>
            <Total estimate={props.estimate} />
          </header>
          <Body {...props} />
        </div>
      </aside>

      {/*
       * mobile: a bottom sheet, closed by default. Native <details>, so the
       * open/close behaviour and the keyboard path come from the platform.
       * The caret and the Show/Hide word are there because a bar that only
       * shows a total does not read as tappable.
       */}
      <details className="group fixed inset-x-0 bottom-0 z-10 border-t border-ink bg-field shadow-[0_-6px_16px_-8px_rgba(21,24,27,0.35)] lg:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
          <svg
            aria-hidden="true"
            viewBox="0 0 12 12"
            className="h-3 w-3 shrink-0 transition-transform group-open:rotate-90"
          >
            <path
              d="M4 2l5 4-5 4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="square"
            />
          </svg>
          <span className="text-[12px] uppercase tracking-wider text-ink-2">
            {count} {count === 1 ? "item" : "items"}
          </span>
          <span className="ml-auto flex items-baseline gap-2">
            <Total estimate={props.estimate} />
            <span className="text-[11px] uppercase tracking-wide text-ink-2">
              <span className="group-open:hidden">Show</span>
              <span className="hidden group-open:inline">Hide</span>
            </span>
          </span>
        </summary>
        <Body {...props} />
      </details>
    </>
  );
}
