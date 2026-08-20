import type { Category } from "./types";

/**
 * Everything that identifies the business lives here and nowhere else.
 * A grep for TODO_ should only ever hit this file.
 */
export const site = {
  name: "TODO_NAME",
  tagline:
    "Published prices, the hours behind them, and what the market charges.",
  serviceArea: "TODO_AREA",
  email: "TODO_EMAIL",
  phone: "TODO_PHONE",
  /** Digits only, for the tel: href. */
  phoneHref: "TODO_PHONE_DIGITS",
} as const;

export const pricing = {
  /** Derivation input only. Never rendered. There is no flag that renders it. */
  effectiveRate: 85,
  visitMinimum: 125,
  materialsPolicy: "pass-through",
  /** Banner stays up until he has signed off on every number. */
  draftPricing: true,
} as const;

export const materialsNote =
  "Materials are passed through at cost, with receipts. They are never folded into the labor number.";

export const disclaimer =
  "Estimates assume normal conditions and are confirmed at a walkthrough. Anything the walkthrough changes gets a written change order before the work starts.";

export const categoryNames: Record<Category, string> = {
  water: "Water & Plumbing",
  "smart-home": "Smart Home & Networking",
  flooring: "Flooring",
  carpentry: "Carpentry & Trim",
  doors: "Doors & Windows",
  general: "General",
};

/**
 * APWA uniform utility-marking colours, the code already painted on the ground
 * at every jobsite. Blue is water, orange is communications, red is electric.
 */
export const categoryOrder: Category[] = [
  "water",
  "smart-home",
  "flooring",
  "carpentry",
  "doors",
  "general",
];
