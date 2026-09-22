export type WalkthroughSelection =
  | { name: string }
  | { name: string; quantity: number; unit: string };

export interface ContactConfig {
  email: string;
  phone: string;
  phoneHref: string;
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
