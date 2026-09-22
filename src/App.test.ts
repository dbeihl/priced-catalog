import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("first-screen navigation", () => {
  it("links the hero actions to the catalog and walkthrough sections", () => {
    const page = renderToStaticMarkup(createElement(App));

    expect(page).toContain('href="#catalog"');
    expect(page).toContain(">Browse services<");
    expect(page).toContain('id="catalog"');
    expect(page).toContain('href="#contact"');
    expect(page).toContain(">Get a walkthrough<");
    expect(page).toContain('id="contact"');
  });
});

describe("launch contact details", () => {
  it("renders the approved email-only walkthrough contact and testimonial", () => {
    const page = renderToStaticMarkup(createElement(App));

    expect(page).toContain('href="mailto:info@kamotec.io"');
    expect(page).toContain("info@kamotec.io");
    expect(page).not.toContain("tel:");
    expect(page).not.toContain("TODO_PHONE");
    expect(page).not.toContain(
      "Draft pricing. These numbers are under review and are not yet a quote.",
    );
    expect(page).not.toContain("<img");
    expect(page).not.toContain("insurance");
    expect(page).not.toContain("licensing");
    expect(page).not.toContain("guarantee");
    expect(page).toContain(
      "Aaron put shiplap in our bedroom and downstairs bathroom and painted it out. It looks awesome, and he did it right the first time.",
    );
    expect(page).toContain("David B.");
  });
});
