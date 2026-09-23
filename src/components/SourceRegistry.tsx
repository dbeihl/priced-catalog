import { sourceNotes, sources } from "../data/sources";

export function SourceRegistry() {
  return (
    <section id="sources" className="mt-10 border-t border-rule py-8">
      <div className="max-w-3xl space-y-2 text-[14px] leading-relaxed text-ink-2">
        <p>
          Every market range in the service catalog comes from one of these
          published cost guides. Where a guide is online, the link is here so you can
          check the range yourself.
        </p>
        <p>
          Most figures were pulled in August 2026. The source name records a
          later check where one has occurred. Bands drift, so re-check anything
          older than a year before quoting from it.
        </p>
      </div>

      <div className="mt-5 overflow-x-auto border border-rule bg-field">
        <table className="w-full min-w-[46rem] border-collapse text-left text-[12px] leading-snug">
          <thead className="border-b border-rule bg-paper text-[11px] uppercase tracking-wider text-ink-2">
            <tr>
              <th className="px-3 py-2 font-medium">Source</th>
              <th className="px-3 py-2 font-medium">What it says</th>
              <th className="px-3 py-2 font-medium">Link</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr
                key={source.shortName}
                id={source.shortName}
                className="border-b border-rule last:border-0"
              >
                <td className="px-3 py-2 align-top font-medium">
                  {source.shortName}
                </td>
                <td className="px-3 py-2 align-top text-ink-2">
                  {source.finding}
                </td>
                <td className="px-3 py-2 align-top break-all text-ink-2">
                  {source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-rule underline-offset-2 hover:decoration-ink"
                    >
                      {source.url}
                    </a>
                  ) : (
                    "No public link"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 max-w-3xl border-l-2 border-mark pl-4 text-[14px] leading-relaxed text-ink-2">
        <h3 className="font-medium text-ink">
          Two bands that are inferences, not published figures
        </h3>
        <p className="mt-1">
          Both are noted next to their range so nobody mistakes them for a
          quoted figure.
        </p>
        <ul className="mt-2 space-y-2">
          {sourceNotes.map((note) => (
            <li key={note} className="pl-3 -indent-3 before:pr-1.5 before:content-['—']">
              {note}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
