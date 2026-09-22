import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "./App";
import { EstimateBuilder } from "./components/EstimateBuilder";
import { services } from "./data/services";
import { calculateEstimate } from "./lib/estimate";
import { pricing } from "./site.config";

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

describe("catalog form fields", () => {
  it("omits the mobile estimate bar but keeps the desktop rail before any service is selected", () => {
    const page = renderToStaticMarkup(createElement(App));

    expect(page).not.toContain("0 items");
    expect(page).toContain("Running estimate");
    expect(page).toContain("Nothing on the list yet.");
  });

  it("gives the catalog search a stable id and name", () => {
    const page = renderToStaticMarkup(createElement(App));

    expect(page).toContain('id="catalog-search"');
    expect(page).toContain('name="catalog-search"');
  });

  it("gives every estimate quantity control a stable id and name", () => {
    const selections = [
      {
        key: 17,
        serviceId: "shiplap-wall",
        quantity: 120,
        addOns: [{ id: "box-extenders", quantity: 3 }],
      },
    ];
    const estimate = calculateEstimate(selections, services, {
      visitMinimum: pricing.visitMinimum,
    });
    const page = renderToStaticMarkup(
      createElement(EstimateBuilder, {
        selections,
        estimate,
        services,
        onQuantity: () => undefined,
        onToggleAddOn: () => undefined,
        onAddOnQuantity: () => undefined,
        onRemove: () => undefined,
      }),
    );

    expect(page).toContain('id="estimate-desktop-quantity-17"');
    expect(page).toContain('name="estimate[desktop][17][quantity]"');
    expect(page).toContain('id="estimate-mobile-quantity-17"');
    expect(page).toContain('name="estimate[mobile][17][quantity]"');
    expect(page).toContain(
      'id="estimate-desktop-addon-quantity-17-box-extenders"',
    );
    expect(page).toContain(
      'name="estimate[desktop][17][box-extenders][quantity]"',
    );
    expect(page).toContain(
      'id="estimate-mobile-addon-quantity-17-box-extenders"',
    );
    expect(page).toContain(
      'name="estimate[mobile][17][box-extenders][quantity]"',
    );
  });
});
