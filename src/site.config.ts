import type { Category } from "./types";

/**
 * Everything that identifies the business lives here, except the static
 * <title> in index.html, which repeats `name`.
 * Contact actions remain hidden until src/lib/contact.ts finds a configured
 * email address.
 */
export const site = {
  name: "Kamotec Services",
  tagline:
    "Published prices, the hours behind them, and what the market charges.",
  description:
    "Published prices, the hours behind them, and the market band for each job.",
  serviceArea: "Indiana and Kentucky",
  email: "info@kamotec.io",
  url: "TODO_DOMAIN",
  socialImageUrl: "TODO_SOCIAL_IMAGE",
} as const;

export const pricing = {
  /** Derivation input only. Never rendered. There is no flag that renders it. */
  effectiveRate: 85,
  visitMinimum: 125,
  materialsPolicy: "pass-through",
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
