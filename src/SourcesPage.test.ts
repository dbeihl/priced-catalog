import { describe, expect, it, vi } from "vitest";
import { scrollToHashTarget } from "./SourcesPage";

describe("scrollToHashTarget", () => {
  it("scrolls the row named by an encoded citation fragment into view", () => {
    const row = { scrollIntoView: vi.fn() };
    const lookup = vi.fn((id: string) =>
      id === "HomeGuide, 2026 (ceiling fan)" ? row : null,
    );

    scrollToHashTarget("#HomeGuide%2C%202026%20(ceiling%20fan)", lookup);

    expect(row.scrollIntoView).toHaveBeenCalledOnce();
  });

  it("ignores an empty or malformed fragment instead of throwing", () => {
    const lookup = vi.fn(() => null);

    expect(() => scrollToHashTarget("", lookup)).not.toThrow();
    expect(() => scrollToHashTarget("#%E0%A4%A", lookup)).not.toThrow();
    expect(lookup).not.toHaveBeenCalled();
  });
});
