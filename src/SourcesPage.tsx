import { SourceRegistry } from "./components/SourceRegistry";
import { site } from "./site.config";

export default function SourcesPage() {
  return (
    <div className="min-h-dvh">
      <div className="mx-auto max-w-[86rem] px-4 pb-28 lg:px-8 lg:pb-8">
        <header className="border-b border-rule py-6 lg:py-8">
          <p className="fig text-[12px] uppercase tracking-[0.18em] text-ink-2">
            {site.serviceArea}
          </p>
          <h1 className="mt-1 text-[28px] font-semibold leading-[1.15] lg:text-[36px]">
            Market band sources
          </h1>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-ink-2">
            Published cost guides behind the market ranges in the service
            catalog.
          </p>
          <a
            href="./"
            className="mt-5 inline-block border border-ink bg-field px-3 py-2 text-[13px] font-medium"
          >
            Back to {site.name}
          </a>
        </header>

        <main>
          <SourceRegistry />
        </main>
      </div>
    </div>
  );
}
