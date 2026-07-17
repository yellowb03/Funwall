import type { MediaSearchResult } from "@/features/media/types";

/**
 * Stock fixture results used when Openverse is unavailable.
 * Attribution fields are always populated for legal integrity testing.
 */
export const FIXTURE_MEDIA_RESULTS: MediaSearchResult[] = [
  makeSwatch({
    id: "fixture-apple",
    color: "#ff6b6b",
    label: "Apple",
    title: "Red apple on a desk",
    alt: "A shiny red apple resting on a wooden desk",
    license: "CC0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  }),
  makeSwatch({
    id: "fixture-globe",
    color: "#0da9ff",
    label: "Globe",
    title: "Classroom globe",
    alt: "A blue classroom globe showing the Americas",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  }),
  makeSwatch({
    id: "fixture-pencil",
    color: "#ffd166",
    label: "Pencil",
    title: "Yellow pencil",
    alt: "A yellow wooden pencil with a pink eraser",
    license: "CC0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  }),
  makeSwatch({
    id: "fixture-book",
    color: "#06d6a0",
    label: "Book",
    title: "Open textbook",
    alt: "An open textbook with diagrams on both pages",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  }),
  makeSwatch({
    id: "fixture-map",
    color: "#118ab2",
    label: "Map",
    title: "Simple world map",
    alt: "A simplified colorful world map for classroom use",
    license: "CC0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  }),
  makeSwatch({
    id: "fixture-frog",
    color: "#2a9d8f",
    label: "Frog",
    title: "Green tree frog",
    alt: "A green tree frog sitting on a leaf",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  }),
  makeSwatch({
    id: "fixture-sun",
    color: "#f4a261",
    label: "Sun",
    title: "Bright sun",
    alt: "A bright yellow sun with simple rays",
    license: "CC0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  }),
  makeSwatch({
    id: "fixture-moon",
    color: "#6c757d",
    label: "Moon",
    title: "Crescent moon",
    alt: "A pale crescent moon on a dark sky",
    license: "CC0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  }),
  makeSwatch({
    id: "fixture-tree",
    color: "#2d6a4f",
    label: "Tree",
    title: "Green tree",
    alt: "A leafy green tree for nature lessons",
    license: "CC0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  }),
  makeSwatch({
    id: "fixture-fish",
    color: "#4ea8de",
    label: "Fish",
    title: "Blue fish",
    alt: "A simple blue fish for ocean topics",
    license: "CC0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  }),
  makeSwatch({
    id: "fixture-star",
    color: "#9b5de5",
    label: "Star",
    title: "Purple star",
    alt: "A five-point purple star shape",
    license: "CC0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  }),
  makeSwatch({
    id: "fixture-heart",
    color: "#e63946",
    label: "Heart",
    title: "Red heart",
    alt: "A solid red heart shape",
    license: "CC0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  }),
];

function makeSwatch(input: {
  id: string;
  color: string;
  label: string;
  title: string;
  alt: string;
  license: string;
  licenseUrl: string;
}): MediaSearchResult {
  const svg = svgSwatch(input.color, input.label);
  const url = "data:image/svg+xml," + encodeURIComponent(svg);
  return {
    provider: "fixture",
    providerAssetId: input.id,
    thumbnailUrl: url,
    fullUrl: url,
    width: 800,
    height: 600,
    title: input.title,
    altCandidate: input.alt,
    creatorName: "Funwall Fixtures",
    creatorUrl: null,
    sourcePageUrl: `https://funwall.local/fixtures/${input.id}`,
    license: input.license,
    licenseUrl: input.licenseUrl,
    attributionText: `${input.title} — Funwall Fixtures (${input.license})`,
  };
}

function svgSwatch(color: string, label: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="${color}"/>
  <text x="200" y="160" text-anchor="middle" font-family="system-ui,sans-serif" font-size="36" fill="#fff">${label}</text>
</svg>`;
}

export function searchFixtureMedia(
  query: string,
  page = 1,
  pageSize = 24,
): { results: MediaSearchResult[]; hasMore: boolean; unmatched: boolean } {
  const q = query.trim().toLowerCase();
  let unmatched = false;
  let filtered = FIXTURE_MEDIA_RESULTS;

  if (q) {
    const matched = FIXTURE_MEDIA_RESULTS.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.altCandidate.toLowerCase().includes(q) ||
        item.providerAssetId.toLowerCase().includes(q) ||
        item.license.toLowerCase().includes(q),
    );
    if (matched.length > 0) {
      filtered = matched;
    } else {
      // Never leave the picker empty — teachers can still pick a sample.
      unmatched = true;
      filtered = FIXTURE_MEDIA_RESULTS;
    }
  }

  const start = (page - 1) * pageSize;
  const slice = filtered.slice(start, start + pageSize);
  return {
    results: slice,
    hasMore: start + pageSize < filtered.length,
    unmatched,
  };
}
