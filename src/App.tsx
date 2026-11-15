import { useMemo, useState } from "react";
import { ContactForm } from "./components/ContactForm";
import type { Category, Service } from "./types";
import { services } from "./data/services";
import { calculateEstimate } from "./lib/estimate";
import { isContactConfigured, walkthroughSelection } from "./lib/contact";
import {
  categoryNames,
  categoryOrder,
  disclaimer,
  pricing,
  site,
} from "./site.config";
import { ServiceRow } from "./components/ServiceRow";
import { DetailPanel } from "./components/DetailPanel";
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
  const walkthroughHref = contactConfigured ? "#contact" : undefined;
  const detailWalkthroughHref =
    contactConfigured && openService ? "#contact" : undefined;

  const add = (serviceId: string) =>
    setSelections((prev) => [
      ...prev,
      { key: nextKey++, serviceId, quantity: 1, addOns: [] },
    ]);

  const patch = (key: number, fn: (s: KeyedSelection) => KeyedSelection) =>
    setSelections((prev) => prev.map((s) => (s.key === key ? fn(s) : s)));

  return (
    <div className="min-h-dvh">
      <div className="mx-auto max-w-[80rem] px-4 pb-28 lg:px-8 lg:pb-8">
        <header className="site-header">
          <a href="#" className="text-[18px] font-semibold">
            {site.name}
          </a>
          <nav
            aria-label="Catalog navigation"
            className="flex gap-5 text-[14px]"
          >
            <a href="#catalog">Services &amp; prices</a>
            <a href="#contact">Contact</a>
          </nav>
        </header>
        <div className="contact-intro">
          <div>
            <p className="text-[13px] text-ink-2">{site.serviceArea}</p>
            <h1 className="mt-2 text-[30px] font-semibold leading-tight lg:text-[42px]">
              Home repairs, with the price explained.
            </h1>
            <p className="mt-3 max-w-lg text-[16px] leading-relaxed text-ink-2">
              Published service prices, with the hours and market rates behind
              them.
            </p>
          </div>
          <ContactForm
            email={site.email}
            selections={selections.flatMap((selection) => {
              const service = services.find(
                (item) => item.id === selection.serviceId,
              );
              return service
                ? [walkthroughSelection(service, selection.quantity)]
                : [];
            })}
          />
          <div className="pricing-intro">
            <div>
              <p>Prices are per project or by the hour.</p>
              <p>Materials are at cost, with receipts.</p>
              <p className="mt-2 text-[14px] text-ink-2">{disclaimer}</p>
            </div>
            <figure className="border-l-2 border-mark pl-4">
              <blockquote className="text-[14px] leading-relaxed">
                Aaron put shiplap in our bedroom and downstairs bathroom and
                painted it out. It looks awesome, and he did it right the first
                time.
              </blockquote>
              <figcaption className="mt-2 text-[13px] text-ink-2">
                David B.
              </figcaption>
            </figure>
          </div>
        </div>
        <div className="catalog-layout">
          <main id="catalog" className="scroll-mt-4 min-w-0">
            <div className="catalog-heading">
              <h2 className="text-[24px] font-semibold">
                Services &amp; prices
              </h2>
              <HowToRead />
            </div>
            {/* ── Filters ── */}
            <div className="-mx-4 border-b border-rule bg-paper px-4 py-3 lg:sticky lg:top-0 lg:z-[5] lg:mx-0 lg:px-0">
              <label className="block">
                <span className="mb-2 block text-[14px]">Search services</span>
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
                            ? "border-ink bg-mark font-medium text-on-mark"
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
                  className="mt-1 block text-right text-[10px] uppercase tracking-wide text-ink-2 md:hidden"
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

        <footer className="mt-10 border-t border-rule py-8 text-[14px] text-ink-2">
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <a href="#contact">Back to contact</a>
            <a className="contact-email" href={`mailto:${site.email}`}>
              {site.email}
            </a>
            <a href="sources.html">How we price</a>
          </div>
          <p className="mt-4">
            {site.serviceArea}. Contact fields stay in this page until you
            choose to open an email draft or copy them. You send the email
            yourself.
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
