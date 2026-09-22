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
