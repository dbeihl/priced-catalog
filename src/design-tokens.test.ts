import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(new URL("./index.css", import.meta.url), "utf8");

function token(name: string): string {
  const match = stylesheet.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`Missing ${name} token`);
  return match[1]!;
}

function luminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4,
    );

  const [red, green, blue] = channels;
  return 0.2126 * red! + 0.7152 * green! + 0.0722 * blue!;
}

function contrast(foreground: string, background: string): number {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort(
    (a, b) => b - a,
  );
  return (lighter! + 0.05) / (darker! + 0.05);
}

describe("colour token contrast", () => {
  it("keeps text and interface boundaries at WCAG AA", () => {
    const pairs = [
      ["--ink", "--paper", 4.5],
      ["--ink", "--field", 4.5],
      ["--ink-2", "--paper", 4.5],
      ["--ink-2", "--field", 4.5],
      ["--rule", "--paper", 3],
      ["--rule", "--field", 3],
      ["--mark", "--paper", 3],
      ["--on-mark", "--mark", 4.5],
    ] as const;

    for (const [foreground, background, minimum] of pairs) {
      expect(contrast(token(foreground), token(background))).toBeGreaterThanOrEqual(
        minimum,
      );
    }
  });
});
