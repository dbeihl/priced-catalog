import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("..", import.meta.url));
const imageExtensions = /\.(webp|jpe?g|png|gif|heic|heif|tiff?|avif|bmp)$/i;
const pixelChunks = new Set(["VP8 ", "VP8L", "VP8X", "ALPH", "ANIM", "ANMF"]);

function imagesUnder(dir: string): string[] {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return imagesUnder(path);
    return imageExtensions.test(entry.name) ? [path] : [];
  });
}

function metadataProblems(name: string, bytes: Uint8Array): string[] {
  if (extname(name).toLowerCase() !== ".webp")
    return ["not WebP: commit photos as metadata-free WebP"];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (at: number) =>
    String.fromCharCode(...bytes.subarray(at, at + 4));
  if (bytes.length < 12 || tag(0) !== "RIFF" || tag(8) !== "WEBP")
    return ["not a RIFF WebP file"];
  const problems: string[] = [];
  for (let at = 12; at + 8 <= bytes.length;) {
    const chunk = tag(at);
    if (!pixelChunks.has(chunk)) problems.push(`${chunk.trim()} chunk`);
    if (chunk === "VP8X" && (bytes[at + 8]! & 0b101100) !== 0)
      problems.push("VP8X declares ICC, EXIF or XMP metadata");
    const size = view.getUint32(at + 4, true);
    at += 8 + size + (size % 2);
  }
  return problems;
}

function webp(...chunks: [string, number[]][]) {
  const body = chunks.flatMap(([fourcc, data]) => {
    const padded = data.length % 2 ? [...data, 0] : data;
    const size = data.length;
    return [
      ...[...fourcc].map((c) => c.charCodeAt(0)),
      size & 255,
      (size >> 8) & 255,
      (size >> 16) & 255,
      size >>> 24,
      ...padded,
    ];
  });
  const size = body.length + 4;
  return new Uint8Array([
    ..."RIFF".split("").map((c) => c.charCodeAt(0)),
    size & 255,
    (size >> 8) & 255,
    (size >> 16) & 255,
    size >>> 24,
    ..."WEBP".split("").map((c) => c.charCodeAt(0)),
    ...body,
  ]);
}

describe("committed photo metadata", () => {
  it("accepts a WebP holding only pixel data", () => {
    expect(metadataProblems("a.webp", webp(["VP8 ", [1, 2, 3]]))).toEqual([]);
  });

  it("rejects EXIF and XMP chunks and other formats", () => {
    expect(
      metadataProblems(
        "a.webp",
        webp(
          ["VP8X", [0b1000, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
          ["VP8 ", [1]],
          ["EXIF", [9, 9]],
          ["XMP ", [7]],
        ),
      ),
    ).toEqual([
      "VP8X declares ICC, EXIF or XMP metadata",
      "EXIF chunk",
      "XMP chunk",
    ]);
    expect(metadataProblems("a.jpg", new Uint8Array([0xff, 0xd8]))).toEqual([
      "not WebP: commit photos as metadata-free WebP",
    ]);
  });

  it("finds the recent-work photos and none carries metadata", () => {
    const images = [join(root, "src"), join(root, "public")].flatMap(
      imagesUnder,
    );
    expect(images.length).toBeGreaterThanOrEqual(4);
    const problems = images.flatMap((path) =>
      metadataProblems(path, readFileSync(path)).map(
        (problem) => `${relative(root, path)}: ${problem}`,
      ),
    );
    expect(problems).toEqual([]);
  });
});
