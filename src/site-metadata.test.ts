import { describe, expect, it } from "vitest";
import { site } from "./site.config";
import { buildMetadata } from "./site-metadata";

describe("page metadata", () => {
  it("builds title, canonical, and Open Graph fields from complete configuration", () => {
    expect(
      buildMetadata({
        name: "Aaron's Handyman Service",
        tagline: "Clear prices for home repairs.",
        description: "Published pricing customers can check.",
        url: "https://example.com",
        socialImageUrl: "https://example.com/preview.png",
      }),
    ).toEqual({
      title: "Aaron's Handyman Service",
      description: "Published pricing customers can check.",
      canonical: "https://example.com",
      openGraph: {
        title: "Aaron's Handyman Service",
        description: "Published pricing customers can check.",
        url: "https://example.com",
        image: "https://example.com/preview.png",
      },
    });
  });

  it("omits placeholder values instead of publishing TODO metadata", () => {
    expect(buildMetadata(site)).toEqual({
      title: site.name,
      description: site.description,
      openGraph: { title: site.name, description: site.description },
    });
  });
});
