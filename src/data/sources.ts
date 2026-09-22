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

export function sourceFor(shortName: string): Source | undefined {
  return sources.find((source) => source.shortName === shortName);
}


export const sourceNotes =
  sourceMarkdown
    .split("## Two bands that are inferences, not published figures")[1]
    ?.split("\n")
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).replaceAll("**", "")) ?? [];
