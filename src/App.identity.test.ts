import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("business identity", () => {
  it("renders the configured business name and service area without placeholders", () => {
    const page = renderToStaticMarkup(createElement(App));

    expect(page).toContain("Kamotec Services");
    expect(page).toContain("Indiana and Kentucky");
    expect(page).not.toContain("TODO_NAME");
    expect(page).not.toContain("TODO_AREA");
  });
});
