import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { services } from "../data/services";
import { calculateEstimate } from "../lib/estimate";
import { pricing } from "../site.config";
import { DetailPanel } from "./DetailPanel";
import { EstimateBuilder } from "./EstimateBuilder";

const service = services.find((item) => item.id === "tv-mount")!;
const selections = [{ key: 1, serviceId: service.id, quantity: 1, addOns: [] }];
const estimate = calculateEstimate(selections, services, {
  visitMinimum: pricing.visitMinimum,
});
const onQuantity = () => undefined;
const onToggleAddOn = () => undefined;
const onAddOnQuantity = () => undefined;
const onRemove = () => undefined;
const walkthroughHref = "mailto:aaron@example.com?subject=Walkthrough%20request";

describe("walkthrough actions", () => {
  it("renders them only when a configured contact href is supplied", () => {
    expect(
      renderToStaticMarkup(
        createElement(DetailPanel, {
          service,
          onClose: () => undefined,
          onAdd: () => undefined,
        }),
      ),
    ).not.toContain("Request a walkthrough");
    expect(
      renderToStaticMarkup(
        createElement(DetailPanel, {
          service,
          onClose: () => undefined,
          onAdd: () => undefined,
          walkthroughHref,
        }),
      ),
    ).toContain("Request a walkthrough");

    expect(
      renderToStaticMarkup(
        createElement(EstimateBuilder, {
          selections,
          estimate,
          services,
          onQuantity,
          onToggleAddOn,
          onAddOnQuantity,
          onRemove,
        }),
      ),
    ).not.toContain("Request a walkthrough");
    expect(
      renderToStaticMarkup(
        createElement(EstimateBuilder, {
          selections,
          estimate,
          services,
          onQuantity,
          onToggleAddOn,
          onAddOnQuantity,
          onRemove,
          walkthroughHref,
        }),
      ),
    ).toContain("Request a walkthrough");
  });
});
