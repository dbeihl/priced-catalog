import { useMemo, useState } from "react";
import type { Category, Service } from "./types";
import { services } from "./data/services";
import { calculateEstimate } from "./lib/estimate";
import {
  buildWalkthroughMailto,
  isContactConfigured,
  walkthroughSelection,
} from "./lib/contact";
import {
  categoryNames,
  categoryOrder,
  disclaimer,
  pricing,
  site,
} from "./site.config";
import { ServiceRow } from "./components/ServiceRow";
import { DetailPanel } from "./components/DetailPanel";
import { SourceRegistry } from "./components/SourceRegistry";
import {
  EstimateBuilder,
  type KeyedSelection,
} from "./components/EstimateBuilder";

let nextKey = 1;

function HowToRead() {
  return (
    <div className="mt-5 border border-rule bg-field p-4 lg:mt-0">
      <details>
        <summary className="cursor-pointer text-[11px] uppercase tracking-wider text-ink-2 marker:text-ink">
          How to read a row
        </summary>
        <dl className="mt-3 space-y-3 border-t border-rule pt-3 text-[12px] leading-snug">
          <div className="flex gap-3">
            <dt className="fig w-[7rem] shrink-0 font-medium">
              $4.50/linear ft
            </dt>
            <dd className="text-ink-2">what he charges</dd>
          </div>
          <div className="flex gap-3">
            <dt className="fig w-[7rem] shrink-0">25 ft an hour</dt>
            <dd className="text-ink-2">
              the pace behind it, so you can do the division yourself
            </dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-[7rem] shrink-0 pt-1">
              <span aria-hidden="true" className="relative block h-2 w-full">
                <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-rule" />
                <span className="absolute left-0 top-0 bottom-0 w-px bg-rule" />
                <span className="absolute right-0 top-0 bottom-0 w-px bg-rule" />
                <span
                  className="absolute top-0 bottom-0 w-[3px] -translate-x-1/2 bg-mark ring-1 ring-ink/80"
                  style={{ left: "30%" }}
                />
              </span>
            </dt>
            <dd className="text-ink-2">
              what the going rate is for the same job, with his price marked
              inside it
            </dd>
          </div>
        </dl>
      </details>
      <p className="mt-3 border-t border-rule pt-3 text-[12px] leading-snug text-ink-2">
        Nothing here is a quote until a walkthrough confirms it.
      </p>
    </div>
  );
}

export default function App() {
  const [category, setCategory] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [selections, setSelections] = useState<KeyedSelection[]>([]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter((s) => {
      if (category !== "all" && s.category !== category) return false;
      if (!q) return true;
      return `${s.name} ${s.blurb} ${s.description}`.toLowerCase().includes(q);
    });
  }, [category, query]);

  const estimate = useMemo(
    () =>
      calculateEstimate(selections, services, {
        visitMinimum: pricing.visitMinimum,
      }),
    [selections],
  );

  const openService: Service | null = openId
    ? (services.find((s) => s.id === openId) ?? null)
    : null;
  const inEstimate = new Set(selections.map((s) => s.serviceId));
  const contactConfigured = isContactConfigured(site);
  const walkthroughHref = contactConfigured
    ? buildWalkthroughMailto(
        site.email,
        selections.flatMap((selection) => {
          const service = services.find((item) => item.id === selection.serviceId);
          return service
            ? [walkthroughSelection(service, selection.quantity)]
            : [];
        }),
      )
    : undefined;
  const detailWalkthroughHref =
    contactConfigured && openService
      ? buildWalkthroughMailto(site.email, [{ name: openService.name }])
      : undefined;

  const add = (serviceId: string) =>
    setSelections((prev) => [
      ...prev,
      { key: nextKey++, serviceId, quantity: 1, addOns: [] },
    ]);

  const patch = (key: number, fn: (s: KeyedSelection) => KeyedSelection) =>
    setSelections((prev) => prev.map((s) => (s.key === key ? fn(s) : s)));

  return (
    <div className="min-h-dvh">
      <div className="mx-auto max-w-[86rem] px-4 pb-28 lg:px-8 lg:pb-8">
        {/* ── Hero ── */}
        <header className="border-b border-rule py-6 lg:py-8">
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-end lg:gap-10">
            <div>
              <p className="fig text-[12px] uppercase tracking-[0.18em] text-ink-2">
                {site.serviceArea}
              </p>
              <h1 className="mt-1 max-w-3xl text-[28px] font-semibold leading-[1.15] lg:text-[36px]">
                {site.name}
              </h1>
              <ol className="mt-4 max-w-2xl space-y-1 text-[14px] leading-relaxed lg:text-[15px]">
                <li className="border-l-2 border-ink pl-3">
                  Prices are per project, not per hour.
                </li>
                <li className="border-l-2 border-ink pl-3">
                  Materials are at cost, with receipts.
                </li>
                <li className="border-l-2 border-mark pl-3">
                  Every number shows its math: the hours behind it, and what the
                  market charges for the same job.
                </li>
              </ol>
              <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-ink-2">
                Publishing the market band means you can see when a price sits
                at the bottom of it and when it sits at the top. That is the
                point. You should be able to check the number, not just trust
                it.
              </p>
              <nav
                aria-label="Catalog navigation"
                className="mt-5 flex flex-wrap gap-3"
              >
                <a
                  href="#catalog"
                  className="border border-ink bg-mark px-3 py-2 text-[13px] font-medium"
                >
                  Browse services
                </a>
                <a
                  href="#contact"
                  className="border border-ink bg-field px-3 py-2 text-[13px] font-medium"
                >
                  Get a walkthrough
                </a>
              </nav>
            </div>
            <HowToRead />
          </div>
        </header>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
          <main id="catalog" className="scroll-mt-4">
            {/* ── Filters ── */}
            <div className="-mx-4 border-b border-rule bg-paper px-4 py-3 lg:sticky lg:top-0 lg:z-[5] lg:mx-0 lg:px-0">
              <label className="block">
                <span className="sr-only">Search services</span>
                <input
                  type="search"
                  id="catalog-search"
                  name="catalog-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search the catalog"
                  className="w-full border border-rule bg-field px-3 py-2 text-[14px]"
                />
              </label>
              <div className="mt-2">
                <div
                  role="group"
                  aria-label="Filter by category"
                  className="flex gap-1.5 overflow-x-auto pb-1"
                >
                  {(["all", ...categoryOrder] as const).map((c) => {
                    const active = category === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setCategory(c)}
                        className={`min-h-11 shrink-0 border px-2.5 py-1 text-[12px] ${
                          active
                            ? "border-ink bg-mark font-medium"
                            : "border-rule bg-field text-ink-2"
                        }`}
                      >
                        {c === "all" ? "Everything" : categoryNames[c]}
                      </button>
                    );
                  })}
                </div>
                <span
                  aria-hidden="true"
                  className="mt-1 block text-right text-[10px] uppercase tracking-wide text-ink-2 lg:hidden"
                >
                  Swipe for more categories →
                </span>
              </div>
            </div>

            {/* ── Catalog ── */}
            <div className="min-h-[70dvh]">
              <p className="fig py-3 text-[11px] uppercase tracking-wider text-ink-2">
                {visible.length} of {services.length} services
              </p>
              <ul className="border-t border-rule">
                {visible.map((service) => (
                  <ServiceRow
                    key={service.id}
                    service={service}
                    onOpen={() => setOpenId(service.id)}
                    onAdd={() => add(service.id)}
                    inEstimate={inEstimate.has(service.id)}
                  />
                ))}
              </ul>
              {visible.length === 0 && (
                <p className="py-8 text-[14px] text-ink-2">
                  Nothing matches that. Clear the search or pick a different
                  category.
                </p>
              )}
            </div>
          </main>

          <EstimateBuilder
            selections={selections}
            estimate={estimate}
            services={services}
            onQuantity={(key, quantity) =>
              patch(key, (s) => ({ ...s, quantity }))
            }
            onToggleAddOn={(key, addOnId) =>
              patch(key, (s) => {
                const current = s.addOns ?? [];
                return current.some((a) => a.id === addOnId)
                  ? { ...s, addOns: current.filter((a) => a.id !== addOnId) }
                  : {
                      ...s,
                      addOns: [...current, { id: addOnId, quantity: 1 }],
                    };
              })
            }
            onAddOnQuantity={(key, addOnId, quantity) =>
              patch(key, (s) => ({
                ...s,
                addOns: (s.addOns ?? []).map((a) =>
                  a.id === addOnId ? { ...a, quantity } : a,
                ),
              }))
            }
            onRemove={(key) =>
              setSelections((prev) => prev.filter((s) => s.key !== key))
            }
            walkthroughHref={walkthroughHref}
          />
        </div>

        <SourceRegistry />

        {/* ── Contact ── */}
        <footer id="contact" className="mt-10 border-t border-rule py-8 scroll-mt-4">
          <figure className="max-w-2xl border-l-2 border-mark pl-4">
            <blockquote className="text-[15px] leading-relaxed text-ink">
              Aaron put shiplap in our bedroom and downstairs bathroom and
              painted it out. It looks awesome, and he did it right the first
              time.
            </blockquote>
            <figcaption className="mt-2 text-[13px] text-ink-2">
              David B.
            </figcaption>
          </figure>
          <h2 className="mt-8 text-[20px] font-semibold">Get a walkthrough</h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-2">
            {disclaimer}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={`mailto:${site.email}`}
              className="fig border border-ink px-3 py-2 text-[13px] hover:bg-mark"
            >
              {site.email}
            </a>
          </div>
          <p className="fig mt-6 text-[11px] uppercase tracking-wider text-ink-2">
            {site.serviceArea} · No forms, no tracking, nothing collected on
            this site.
          </p>
        </footer>
      </div>

      <DetailPanel
        service={openService}
        onClose={() => setOpenId(null)}
        onAdd={(id) => {
          add(id);
          setOpenId(null);
        }}
        walkthroughHref={detailWalkthroughHref}
      />
    </div>
  );
}
