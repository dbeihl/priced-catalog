type SiteMetadataInput = {
  name: string;
  tagline: string;
  description: string;
  url: string;
  socialImageUrl: string;
};

type Metadata = {
  title?: string;
  description?: string;
  canonical?: string;
  openGraph: {
    title?: string;
    description?: string;
    url?: string;
    image?: string;
  };
};

function configured(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed && !trimmed.startsWith("TODO_") ? trimmed : undefined;
}

export function buildMetadata(site: SiteMetadataInput): Metadata {
  const title = configured(site.name);
  const description = configured(site.description);
  const canonical = configured(site.url);
  const image = configured(site.socialImageUrl);

  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(canonical ? { canonical } : {}),
    openGraph: {
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...(canonical ? { url: canonical } : {}),
      ...(image ? { image } : {}),
    },
  };
}

function setMeta(
  attribute: "name" | "property",
  key: string,
  content: string | undefined,
) {
  if (!content) return;
  const element = document.createElement("meta");
  element.setAttribute(attribute, key);
  element.content = content;
  document.head.append(element);
}

export function applyMetadata(site: SiteMetadataInput) {
  const metadata = buildMetadata(site);
  if (metadata.title) document.title = metadata.title;
  setMeta("name", "description", metadata.description);
  setMeta("property", "og:title", metadata.openGraph.title);
  setMeta("property", "og:description", metadata.openGraph.description);
  setMeta("property", "og:url", metadata.openGraph.url);
  setMeta("property", "og:image", metadata.openGraph.image);

  if (metadata.canonical) {
    const link = document.createElement("link");
    link.rel = "canonical";
    link.href = metadata.canonical;
    document.head.append(link);
  }
}
