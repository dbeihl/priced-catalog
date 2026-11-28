import type { Service } from "../types";
import { needsQuantity, type AddOnSelection } from "./estimate";
import { countedUnit } from "./format";

type RequestLine =
  { name: string } | { name: string; quantity: number; unit: string };

export type WalkthroughSelection = RequestLine & { addOns?: RequestLine[] };

const wholeCount = (quantity = 1) => Math.max(1, Math.trunc(quantity) || 1);

export function walkthroughSelection(
  service: Service,
  quantity = 1,
  chosen: AddOnSelection[] = [],
): WalkthroughSelection {
  const line: WalkthroughSelection = needsQuantity(service)
    ? {
        name: service.name,
        quantity: wholeCount(quantity),
        unit: countedUnit(service.pricing.unit, wholeCount(quantity)),
      }
    : { name: service.name };
  const addOns = chosen.flatMap(({ id, quantity }) => {
    const addOn = service.addOns?.find((a) => a.id === id);
    if (!addOn) return [];
    return addOn.unit === undefined
      ? [{ name: addOn.name }]
      : [
          {
            name: addOn.name,
            quantity: wholeCount(quantity),
            unit: countedUnit(addOn.unit, wholeCount(quantity)),
          },
        ];
  });
  return addOns.length ? { ...line, addOns } : line;
}

const describe = (line: RequestLine) =>
  "quantity" in line
    ? `${line.name}: ${line.quantity} ${line.unit}`
    : line.name;

export interface ContactConfig {
  email: string;
}

export function isContactConfigured(contact: ContactConfig) {
  return contact.email.trim().length > 0 && !contact.email.startsWith("TODO_");
}

export function isPhoneUserAgent(userAgent: string) {
  return /\b(?:iPhone|iPod|Android)\b/i.test(userAgent) && /\bMobile\b/i.test(userAgent);
}

export interface WalkthroughRequest {
  name: string;
  email: string;
  town: string;
  message: string;
}

// ponytail: no lookbehind, so the bundle still parses on older Safari
const wellFormed = (text: string) =>
  text.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDFFF]/g, (unit) =>
    unit.length === 2 ? unit : "\uFFFD",
  );

export function buildWalkthroughBody(
  selections: WalkthroughSelection[],
  request?: WalkthroughRequest,
  askedAbout?: string,
) {
  const body = [
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
    ...selections.flatMap((selection) => [
      `- ${describe(selection)}`,
      ...(selection.addOns ?? []).map((addOn) => `  + ${describe(addOn)}`),
    ]),
    "",
    "Thank you.",
  ].join("\n");
  return wellFormed(body);
}

export function walkthroughDrafts(
  email: string,
  selections: WalkthroughSelection[],
  request?: WalkthroughRequest,
  askedAbout?: string,
) {
  const subject = "Walkthrough request";
  const body = buildWalkthroughBody(selections, request, askedAbout);
  const encode = (value: string) =>
    encodeURIComponent(value).replace(/'/g, "%27");
  const [to, su, text] = [email, subject, body].map(encode);
  return {
    body,
    mailto: `mailto:${email}?subject=${su}&body=${text}`,
    gmail: `https://mail.google.com/mail/?view=cm&to=${to}&su=${su}&body=${text}`,
    outlook: `https://outlook.live.com/mail/0/deeplink/compose?to=${to}&subject=${su}&body=${text}`,
  };
}
