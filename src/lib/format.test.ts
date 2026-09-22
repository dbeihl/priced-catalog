import { describe, expect, it } from "vitest";
import { headlinePrice } from "./format";
import type { Service } from "../types";

describe("headlinePrice", () => {
  it("labels a quote-only service without a dollar figure", () => {
    const service = {
      pricing: { model: "quote-only", unit: "project" },
    } as Service;

    expect(headlinePrice(service)).toBe("Ask for a quote");
  });
});
