export type PricingModel = "flat" | "range" | "per-unit" | "quote-only";
export type Unit =
  "project" | "linear-ft" | "sq-ft" | "device" | "drop" | "room" | "day";

export type Category =
  "water" | "smart-home" | "flooring" | "carpentry" | "doors" | "general";

export interface AddOn {
  id: string;
  name: string;
  price?: number;
  rate?: number;
  /**
   * Extension to the spec's AddOn shape, needed for correctness rather than
   * flexibility. A rate-bearing add-on measured in the SAME unit as its parent
   * (baseboard paint, per linear foot) multiplies the parent's quantity and
   * leaves `unit` unset. One measured in a DIFFERENT unit (outlet box extenders
   * on a square-foot wall, transitions on a square-foot floor) sets `unit` and
   * takes its own quantity, because multiplying it by the parent's quantity
   * would be wrong by a wide margin.
   */
  unit?: Unit;
  note?: string;
}

export interface Service {
  id: string;
  name: string;
  category: Category;
  blurb: string;
  description: string;

  pricing: {
    model: PricingModel;
    price?: number;
    low?: number;
    high?: number;
    rate?: number;
    unit: Unit;
    minimumUnits?: number;
    flatBelowUnits?: number;
    flatBelowPrice?: [number, number];
    firstPrice?: number;
    additionalPrice?: number;
    assumptions?: string[];
  };

  // The reason this site exists. Required, not optional.
  basis: {
    hours: number | [number, number];
    pace?: string;
    note?: string;
  };
  marketBand: {
    low: number;
    high: number;
    unit: Unit;
    source: string;
    note?: string;
  };

  materials: "client-supplied" | "pass-through" | "included";
  materialsLow?: number;
  materialsHigh?: number;

  includes: string[];
  excludes?: string[];
  addOns?: AddOn[];
  confirmBy?: "walkthrough" | "photos";
  status: "offered" | "coming-soon";
}
