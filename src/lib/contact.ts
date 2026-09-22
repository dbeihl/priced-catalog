export interface WalkthroughSelection {
  name: string;
  quantity: number;
}

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
    "Hi Aaron,",
    "",
    "I'd like to request a walkthrough for:",
    ...selections.map(({ name, quantity }) => `- ${quantity} × ${name}`),
    "",
    "Thank you.",
  ].join("\n");

  const encode = (value: string) => encodeURIComponent(value).replace(/'/g, "%27");
  return `mailto:${email}?subject=${encode(subject)}&body=${encode(body)}`;
}
