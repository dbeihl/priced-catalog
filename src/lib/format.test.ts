import { describe, expect, it } from "vitest";
import { awaitingPrice, headlinePrice } from "./format";
import { services } from "../data/services";
import type { Service } from "../types";

const byId = (id: string) => services.find((service) => service.id === id)!;

describe("headlinePrice", () => {
  it("labels a quote-only service without a dollar figure", () => {
    const service = {
      pricing: { model: "quote-only", unit: "project" },
    } as Service;

    expect(headlinePrice(service)).toBe("Ask for a quote");
  });
});

describe("awaitingPrice", () => {
  it("sends no service to the quote link after the lead prices are signed off", () => {
    expect(services.filter(awaitingPrice).map((service) => service.id)).toEqual(
      [],
    );
  });

  it("keeps existing quote-only services addable to an estimate", () => {
    for (const id of ["subfloor-repair", "new-fixture-box"]) {
      expect(byId(id).pricing.model, id).toBe("quote-only");
      expect(awaitingPrice(byId(id)), id).toBe(false);
    }
  });
});
