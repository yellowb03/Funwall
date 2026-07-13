/**
 * Provider-neutral media contracts.
 * @see agent-work/shared/CONTRACTS.md §15
 * @see docs/adr/ADR-008-media-provider-strategy.md
 */

export type MediaProvider = "openverse" | "pexels" | "upload" | "fixture";

export type ImageFit = "contain" | "cover";

export interface MediaSearchResult {
  provider: MediaProvider;
  providerAssetId: string;
  thumbnailUrl: string;
  fullUrl: string;
  width: number;
  height: number;
  title: string;
  altCandidate: string;
  creatorName: string | null;
  creatorUrl: string | null;
  sourcePageUrl: string | null;
  license: string;
  licenseUrl: string | null;
  attributionText: string;
  /** Opaque token for provider download/selection callbacks when required. */
  selectionToken?: string;
}

export interface MediaAsset {
  id: string;
  ownerId: string | null;
  provider: MediaProvider;
  providerAssetId: string | null;
  /** Display/use URL (blob URL, CDN, or remote derivative). */
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  mimeType: string;
  title: string;
  defaultAlt: string;
  creatorName: string | null;
  creatorUrl: string | null;
  sourcePageUrl: string | null;
  license: string;
  licenseUrl: string | null;
  attributionText: string;
  createdAt: string;
  softDeleted: boolean;
}

export interface MediaSelectInput {
  provider: MediaProvider;
  providerAssetId: string;
  thumbnailUrl: string;
  fullUrl: string;
  width: number;
  height: number;
  title: string;
  alt: string;
  creatorName: string | null;
  creatorUrl: string | null;
  sourcePageUrl: string | null;
  license: string;
  licenseUrl: string | null;
  attributionText: string;
  selectionToken?: string;
  imageFit?: ImageFit;
}

export interface MediaSelectResult {
  asset: MediaAsset;
  imageFit: ImageFit;
  alt: string;
}

export interface MediaSearchResponse {
  results: MediaSearchResult[];
  source: "openverse" | "fixture";
  query: string;
  page: number;
  pageSize: number;
  hasMore: boolean;
  warning?: string;
}

export type MediaModalTab = "search" | "upload" | "library";

export interface MediaInsertion {
  assetId: string;
  alt: string;
  imageFit: ImageFit;
  asset: MediaAsset;
}
