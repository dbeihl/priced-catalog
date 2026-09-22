import sourceMarkdown from "../../SOURCES.md?raw";

export type Source = {
  shortName: string;
  finding: string;
  url?: string;
};

function tableCells(row: string): string[] {
  return row
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function sourceRows(markdown: string): Source[] {
  const tableStart = markdown.indexOf("| Short name in the catalog");
  if (tableStart === -1) return [];

  return markdown
    .slice(tableStart)
    .split("\n")
    .slice(2)
    .filter((row) => row.startsWith("|"))
    .map(tableCells)
    .map(([shortName, finding, link]) => ({
      shortName: shortName!,
      finding: finding!,
      ...(link?.startsWith("https://") ? { url: link } : {}),
    }));
}

export const sources = sourceRows(sourceMarkdown);

const sourceNamesByServiceId: Record<string, string> = {
  "softener-existing-loop": "Angi / TapWaterData, 2026",
  "softener-pex-cutin": "Angi / TapWaterData, 2026",
  "softener-copper": "Angi / TapWaterData, 2026",
  "toilet-replacement": "Plumbing By The Book / RateYourPlumber, 2026",
  "faucet-replacement": "HomeGuide, 2026 (faucet)",
  "vanity-faucet-swap": "HomeGuide / Angi, 2026 (vanity)",
  "disposal-replacement": "HomeGuide, 2026 (disposal)",
  "shelly-leak-shutoff": "Angi / HomeGuide, 2026 (smart-home device)",
  "ethernet-drop": "One and Done Prep / Data Wire Solutions, 2026",
  "wifi-ap": "Homewyse, Jan 2026 (networking)",
  "wifi-survey": "HomeGuide, 2026 (whole-home Wi-Fi)",
  "network-rack-cleanup": "Running Cables / Data Wire Solutions, 2026",
  "smart-switch": "HomeGuide / Fixr, 2026 (switches)",
  "video-doorbell": "Angi, 2026 (doorbell)",
  "tv-mount": "Angi / HomeGuide, 2026 (TV mount)",
  "floor-lvp-tile": "D&G Flooring, Apr 2026",
  "subfloor-repair": "HomeGuide, 2026 (subfloor)",
  "baseboard-new": "D&G Flooring, Jun 2026",
  "baseboard-replacement": "D&G Flooring, Jun 2026",
  "shiplap-wall": "HomeGuide / Adnan, 2026",
  "board-batten-wall": "Inch Calculator, 2026",
  "door-casing": "HomeGuide, 2026 (trim)",
  "crown-molding": "HomeGuide, 2026 (trim)",
  "interior-door-slab": "Angi / HomeGuide, 2026 (interior doors)",
  "interior-door-prehung": "Angi / HomeGuide, 2026 (interior doors)",
  "storm-door": "HomeGuide, 2026 (storm door)",
  "small-mount": "HomeGuide / Homewyse, 2026 (small mounts)",
  "fixture-swap": "HomeGuide, 2026 (ceiling fan)",
  "new-fixture-box": "HomeGuide, 2026 (ceiling fan)",
  "punch-list-half": "HomeBlue (Indianapolis), 2026",
  "punch-list-full": "HomeBlue (Indianapolis), 2026",
  walkthrough: "TM International, Apr 2026",
};

export function sourceFor(shortName: string): Source | undefined {
  return sources.find((source) => source.shortName === shortName);
}

export function sourceForService(serviceId: string): Source | undefined {
  const shortName = sourceNamesByServiceId[serviceId];
  return shortName ? sourceFor(shortName) : undefined;
}

export const sourceNotes =
  sourceMarkdown
    .split("## Two bands that are inferences, not published figures")[1]
    ?.split("\n")
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).replaceAll("**", "")) ?? [];
