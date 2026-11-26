import type { Service } from "../types";
import { needsQuantity } from "./estimate";
import { unitLabel } from "./format";

export type WalkthroughSelection =
  { name: string } | { name: string; quantity: number; unit: string };

export function walkthroughSelection(
  service: Service,
  quantity = 1,
): WalkthroughSelection {
  const count = Math.max(1, Math.trunc(quantity) || 1);
  return needsQuantity(service)
    ? { name: service.name, quantity: count, unit: unitLabel[service.pricing.unit] }
    : { name: service.name };
}

export interface ContactConfig {
  email: string;
}

export function isContactConfigured(contact: ContactConfig) {
  return contact.email.trim().length > 0 && !contact.email.startsWith("TODO_");
}

export interface WalkthroughRequest {
  name: string;
  email: string;
  town: string;
  message: string;
}

export function buildWalkthroughBody(
  selections: WalkthroughSelection[],
  request?: WalkthroughRequest,
  askedAbout?: string,
) {
  return [
    "Hi,",
    "",
    "I'd like to request a walkthrough for:",
    ...(request
      ? [
          request.message.trim(),
          "",
          ...(request.name.trim() ? [`Name: ${request.name.trim()}`] : []),
          `Reply email: ${request.email.trim()}`,
          ...(request.town.trim()
            ? [`Town or ZIP: ${request.town.trim()}`]
            : []),
          ...(askedAbout ? [`Asked about: ${askedAbout}`] : []),
          ...(selections.length ? ["", "Selected services:"] : []),
        ]
      : []),
    ...selections.map((selection) =>
      "quantity" in selection
        ? `- ${selection.name}: ${selection.quantity} ${selection.unit}`
        : `- ${selection.name}`,
    ),
    "",
    "Thank you.",
  ].join("\n");
}

export function buildWalkthroughMailto(
  email: string,
  selections: WalkthroughSelection[],
  request?: WalkthroughRequest,
  askedAbout?: string,
) {
  const subject = "Walkthrough request";
  const body = buildWalkthroughBody(selections, request, askedAbout);
  const encode = (value: string) =>
    encodeURIComponent(value).replace(/'/g, "%27");
  return `mailto:${email}?subject=${encode(subject)}&body=${encode(body)}`;
}
