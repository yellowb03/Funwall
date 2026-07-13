import type { MediaSearchResult } from "@/features/media/types";

/**
 * Stock fixture results used when Openverse credentials are absent.
 * Attribution fields are always populated for legal integrity testing.
 */
export const FIXTURE_MEDIA_RESULTS: MediaSearchResult[] = [
  {
    provider: "fixture",
    providerAssetId: "fixture-apple",
    thumbnailUrl:
      "https://images.openverse.org/placeholder-not-used/apple-thumb.jpg",
    fullUrl: "data:image/svg+xml," + encodeURIComponent(svgSwatch("#ff6b6b", "Apple")),
    width: 800,
    height: 600,
    title: "Red apple on a desk",
    altCandidate: "A shiny red apple resting on a wooden desk",
    creatorName: "Funwall Fixtures",
    creatorUrl: null,
    sourcePageUrl: "https://funwall.local/fixtures/apple",
    license: "CC0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    attributionText: "Red apple on a desk — Funwall Fixtures (CC0)",
  },
  {
    provider: "fixture",
    providerAssetId: "fixture-globe",
    thumbnailUrl:
      "https://images.openverse.org/placeholder-not-used/globe-thumb.jpg",
    fullUrl: "data:image/svg+xml," + encodeURIComponent(svgSwatch("#0da9ff", "Globe")),
    width: 1024,
    height: 768,
    title: "Classroom globe",
    altCandidate: "A blue classroom globe showing the Americas",
    creatorName: "Funwall Fixtures",
    creatorUrl: null,
    sourcePageUrl: "https://funwall.local/fixtures/globe",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    attributionText: "Classroom globe — Funwall Fixtures (CC BY 4.0)",
  },
  {
    provider: "fixture",
    providerAssetId: "fixture-pencil",
    thumbnailUrl:
      "https://images.openverse.org/placeholder-not-used/pencil-thumb.jpg",
    fullUrl: "data:image/svg+xml," + encodeURIComponent(svgSwatch("#ffd166", "Pencil")),
    width: 640,
    height: 640,
    title: "Yellow pencil",
    altCandidate: "A yellow wooden pencil with a pink eraser",
    creatorName: "Funwall Fixtures",
    creatorUrl: null,
    sourcePageUrl: "https://funwall.local/fixtures/pencil",
    license: "CC0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    attributionText: "Yellow pencil — Funwall Fixtures (CC0)",
  },
  {
    provider: "fixture",
    providerAssetId: "fixture-book",
    thumbnailUrl:
      "https://images.openverse.org/placeholder-not-used/book-thumb.jpg",
    fullUrl: "data:image/svg+xml," + encodeURIComponent(svgSwatch("#06d6a0", "Book")),
    width: 900,
    height: 1200,
    title: "Open textbook",
    altCandidate: "An open textbook with diagrams on both pages",
    creatorName: "Funwall Fixtures",
    creatorUrl: null,
    sourcePageUrl: "https://funwall.local/fixtures/book",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    attributionText: "Open textbook — Funwall Fixtures (CC BY-SA 4.0)",
  },
  {
    provider: "fixture",
    providerAssetId: "fixture-map",
    thumbnailUrl:
      "https://images.openverse.org/placeholder-not-used/map-thumb.jpg",
    fullUrl: "data:image/svg+xml," + encodeURIComponent(svgSwatch("#118ab2", "Map")),
    width: 1200,
    height: 800,
    title: "Simple world map",
    altCandidate: "A simplified colorful world map for classroom use",
    creatorName: "Funwall Fixtures",
    creatorUrl: null,
    sourcePageUrl: "https://funwall.local/fixtures/map",
    license: "CC0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    attributionText: "Simple world map — Funwall Fixtures (CC0)",
  },
  {
    provider: "fixture",
    providerAssetId: "fixture-frog",
    thumbnailUrl:
      "https://images.openverse.org/placeholder-not-used/frog-thumb.jpg",
    fullUrl: "data:image/svg+xml," + encodeURIComponent(svgSwatch("#2a9d8f", "Frog")),
    width: 700,
    height: 500,
    title: "Green tree frog",
    altCandidate: "A green tree frog sitting on a leaf",
    creatorName: "Funwall Fixtures",
    creatorUrl: null,
    sourcePageUrl: "https://funwall.local/fixtures/frog",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    attributionText: "Green tree frog — Funwall Fixtures (CC BY 4.0)",
  },
];

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
): { results: MediaSearchResult[]; hasMore: boolean } {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? FIXTURE_MEDIA_RESULTS.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.altCandidate.toLowerCase().includes(q) ||
          item.providerAssetId.toLowerCase().includes(q),
      )
    : FIXTURE_MEDIA_RESULTS;

  const start = (page - 1) * pageSize;
  const slice = filtered.slice(start, start + pageSize);
  return {
    results: slice,
    hasMore: start + pageSize < filtered.length,
  };
}
