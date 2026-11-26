import { useEffect, useMemo, useRef, useState } from "react";
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
import workshopBuild from "./assets/work/workshop-build.webp";
import bathroomFan from "./assets/work/bathroom-fan.webp";
import minisplitOne from "./assets/work/minisplit-install-1.webp";
import minisplitTwo from "./assets/work/minisplit-install-2.webp";

const recentWork = [
  {
    src: bathroomFan,
    alt: "A square white bathroom exhaust fan in a beadboard ceiling",
    caption: "Bathroom fan",
  },
  {
    src: minisplitOne,
    alt: "A mini-split outdoor unit mounted beside a metal-sided building",
    caption: "Mini-split install, photo 1 of 2",
  },
  {
    src: minisplitTwo,
    alt: "A mini-split indoor unit on a plywood panel above a workbench",
    caption: "Mini-split install, photo 2 of 2",
  },
];

function HouseMark() {
  return (
    <svg
      viewBox="0 0 36 36"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d="M5 16 18 5l13 11v15H5Z" />
      <path d="M14 31V20h8v11M10 15h5m7 0h5" />
    </svg>
  );
}

let nextKey = 1;
// ponytail: fixed band a little taller than the closed estimate bar; measure the bar if its height ever varies.
const barBand = 80;

function HowToRead() {
  return (
    <div className="rounded-lg border border-line bg-field p-4">
      <details>
        <summary className="cursor-pointer text-[11px] uppercase tracking-wider text-ink-2 marker:text-ink">
          How to read a row
        </summary>
        <dl className="mt-3 space-y-3 border-t border-line pt-3 text-[12px] leading-snug">
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
      <p className="mt-3 border-t border-line pt-3 text-[12px] leading-snug text-ink-2">
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
  const [askedAboutId, setAskedAboutId] = useState<string | null>(null);
  const [barCoversContact, setBarCoversContact] = useState(false);
  const pills = useRef<HTMLDivElement>(null);
  const [pillsOverflow, setPillsOverflow] = useState(false);

  useEffect(() => {
    const el = pills.current;
    if (!el) return;
    const watch = new ResizeObserver(() =>
      setPillsOverflow(el.scrollWidth > el.clientWidth),
    );
    for (const box of [el, ...el.children]) watch.observe(box);
    return () => watch.disconnect();
  }, []);

  useEffect(() => {
    const contact = document.getElementById("contact");
    if (!contact) return;
    const check = () => {
      const { top, bottom } = contact.getBoundingClientRect();
      setBarCoversContact(top < innerHeight && bottom > innerHeight - barBand);
    };
    const grows = new ResizeObserver(check);
    grows.observe(contact);
    addEventListener("scroll", check, { passive: true });
    addEventListener("resize", check);
    return () => {
      grows.disconnect();
      removeEventListener("scroll", check);
      removeEventListener("resize", check);
    };
  }, []);

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
  const askedAbout = askedAboutId
    ? services.find((s) => s.id === askedAboutId)?.name
    : undefined;
  const contactConfigured = isContactConfigured(site);
  const walkthroughHref = contactConfigured ? "#contact" : undefined;
  const detailWalkthroughHref =
    contactConfigured && openService ? "#contact" : undefined;

  const add = (serviceId: string) => {
    setAskedAboutId((prev) => (prev === serviceId ? null : prev));
    setSelections((prev) => [
      ...prev,
      { key: nextKey++, serviceId, quantity: 1, addOns: [] },
    ]);
  };

  const patch = (key: number, fn: (s: KeyedSelection) => KeyedSelection) =>
    setSelections((prev) => prev.map((s) => (s.key === key ? fn(s) : s)));

  const [brand, ...brandRest] = site.name.split(" ");

  return (
    <div className="min-h-dvh">
      <div className="shell">
        <header className="site-header">
          <a href="#" className="brand">
            <HouseMark />
            <span>
              {brand}
              <small>{brandRest.join(" ")}</small>
            </span>
          </a>
          <nav aria-label="Main navigation" className="site-nav">
            <a href="#catalog">Services &amp; prices</a>
            <a href="#contact" className="talk">
              Let&apos;s talk
            </a>
          </nav>
        </header>
        <div className="hero">
          <div className="hero-copy">
            <p className="eyebrow">
              {site.name} · {site.serviceArea}
            </p>
            <h1>
              Let&apos;s get that
              <br />
              list done.
            </h1>
            <p className="lead">
              From a new faucet to a room that needs a refresh. Tell us what
              needs doing, or find your job below.
            </p>
          </div>
          <figure className="hero-photo">
            <img
              src={workshopBuild}
              alt="A cream metal-sided workshop with a side door and two garage doors"
              width={1280}
              height={960}
            />
            <figcaption>Recent work: workshop build</figcaption>
          </figure>
          <ContactForm
            email={site.email}
            askedAbout={askedAbout}
            onLeaveOut={() => setAskedAboutId(null)}
            selections={selections.flatMap((selection) => {
              const service = services.find(
                (item) => item.id === selection.serviceId,
              );
              return service
                ? [
                    walkthroughSelection(
                      service,
                      selection.quantity,
                      selection.addOns,
                    ),
                  ]
                : [];
            })}
          />
        </div>
        <ul className="assurances">
          <li>Published prices</li>
          <li>Materials at cost, with receipts</li>
          <li>Confirmed at a walkthrough</li>
        </ul>
        <section className="work" aria-labelledby="work-heading">
          <p className="eyebrow">Photos from recent jobs</p>
          <h2 id="work-heading" className="section-title">
            Recent work
          </h2>
          <div className="work-grid">
            {recentWork.map((photo) => (
              <figure key={photo.caption} className="m-0">
                <img
                  src={photo.src}
                  alt={photo.alt}
                  width={900}
                  height={1200}
                  loading="lazy"
                />
                <figcaption>{photo.caption}</figcaption>
              </figure>
            ))}
          </div>
        </section>
        <div className="catalog-layout">
          <main id="catalog" className="scroll-mt-4 min-w-0">
            <div className="catalog-heading">
              <div className="catalog-title">
                <p className="eyebrow">Services &amp; prices</p>
                <h2 className="section-title">
                  Small jobs. A real difference.
                </h2>
              </div>
              <p className="intro">
                Prices are per project or by the hour. Each one keeps the hours
                and market range behind it. {disclaimer}
              </p>
              <HowToRead />
            </div>
            {/* ── Filters ── */}
            <div className="filter-bar relative bg-paper py-3 lg:sticky lg:top-0 lg:z-[5]">
              <label className="block">
                <span className="mb-2 block text-[13px] font-semibold">
                  Search services
                </span>
                <input
                  type="search"
                  id="catalog-search"
                  name="catalog-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search the catalog"
                  className="w-full rounded-md border border-rule bg-paper px-3 py-2 text-[16px]"
                />
              </label>
              <div className="mt-2">
                <div
                  ref={pills}
                  role="group"
                  aria-label="Filter by category"
                  className="-m-1 flex gap-1 overflow-x-auto p-1 min-[900px]:flex-wrap"
                >
                  {(["all", ...categoryOrder] as const).map((c) => {
                    const active = category === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setCategory(c)}
                        className={`min-h-11 shrink-0 rounded-full border px-2.5 py-1 text-[12.5px] ${
                          active
                            ? "border-ink bg-ink font-semibold text-paper"
                            : "border-line bg-field text-ink"
                        }`}
                      >
                        {c === "all" ? "Everything" : categoryNames[c]}
                      </button>
                    );
                  })}
                </div>
                {pillsOverflow && (
                  <span
                    aria-hidden="true"
                    className="mt-1 block text-right text-[10px] uppercase tracking-wide text-ink-2"
                  >
                    Swipe for more categories →
                  </span>
                )}
              </div>
            </div>

            {/* ── Catalog ── */}
            <div className="min-h-[70dvh]">
              <p className="fig py-3 text-[11px] uppercase tracking-wider text-ink-2">
                {visible.length} of {services.length} services
              </p>
              <ul className="border-t border-line">
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
            hideBar={barCoversContact}
          />
        </div>

        <figure className="review">
          <p className="eyebrow">A note from a customer</p>
          <div>
            <blockquote>
              Aaron put shiplap in our bedroom and downstairs bathroom and
              painted it out. It looks awesome, and he did it right the first
              time.
            </blockquote>
            <figcaption>David B.</figcaption>
          </div>
        </figure>

        <footer className="site-footer">
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <span>
              {site.name} · {site.serviceArea}
            </span>
            <a href="sources.html" target="_blank" rel="noopener">
              How we price<span className="sr-only"> (opens in a new tab)</span>
            </a>
            <a className="contact-email" href={`mailto:${site.email}`}>
              {site.email}
            </a>
          </div>
          <p className="mt-3">
            Nothing is sent until you open an email draft and send it yourself.
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
        onContact={(id) => {
          setAskedAboutId(inEstimate.has(id) ? null : id);
          setOpenId(null);
        }}
        walkthroughHref={detailWalkthroughHref}
      />
    </div>
  );
}
