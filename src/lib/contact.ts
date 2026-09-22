import type { Service } from "../types";
import { needsQuantity } from "./estimate";
import { unitLabel } from "./format";

export type WalkthroughSelection =
  | { name: string }
  | { name: string; quantity: number; unit: string };

export function walkthroughSelection(
  service: Service,
  quantity = 1,
): WalkthroughSelection {
  return needsQuantity(service)
    ? { name: service.name, quantity, unit: unitLabel[service.pricing.unit] }
    : { name: service.name };
}

export interface ContactConfig {
  email: string;
}

export function isContactConfigured(contact: ContactConfig) {
  return Object.values(contact).every((value) => !value.startsWith("TODO_"));
}

export function buildWalkthroughMailto(
  email: string,
  selections: WalkthroughSelection[],
) {
  const subject = "Walkthrough request";
  const body = [
    "Hi,",
    "",
    "I'd like to request a walkthrough for:",
    ...selections.map((selection) =>
      "quantity" in selection
        ? `- ${selection.name}: ${selection.quantity} ${selection.unit}`
        : `- ${selection.name}`,
    ),
    "",
    "Thank you.",
  ].join("\n");

  const encode = (value: string) => encodeURIComponent(value).replace(/'/g, "%27");
  return `mailto:${email}?subject=${encode(subject)}&body=${encode(body)}`;
}
