import type {
  MediaAsset,
  MediaSelectInput,
} from "@/features/media/types";

const STORE_KEY = "__funwall_media_asset_store__";

type Store = Map<string, MediaAsset>;

function getStore(): Store {
  const g = globalThis as typeof globalThis & {
    [STORE_KEY]?: Store;
  };
  if (!g[STORE_KEY]) {
    g[STORE_KEY] = new Map();
  }
  return g[STORE_KEY]!;
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * In-memory media asset library for local/editor mode.
 * Workstream 01 will replace with Supabase Storage + media_assets table.
 */
export class MemoryMediaStore {
  private readonly store: Store;

  constructor(store: Store = getStore()) {
    this.store = store;
  }

  list(includeDeleted = false): MediaAsset[] {
    return [...this.store.values()]
      .filter((a) => includeDeleted || !a.softDeleted)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  get(id: string): MediaAsset | null {
    return this.store.get(id) ?? null;
  }

  selectFromProvider(input: MediaSelectInput): MediaAsset {
    // Reuse existing asset with same provider + provider id when possible.
    for (const existing of this.store.values()) {
      if (
        !existing.softDeleted &&
        existing.provider === input.provider &&
        existing.providerAssetId === input.providerAssetId
      ) {
        return existing;
      }
    }

    const asset: MediaAsset = {
      id: crypto.randomUUID(),
      ownerId: null,
      provider: input.provider,
      providerAssetId: input.providerAssetId,
      url: input.fullUrl,
      thumbnailUrl: input.thumbnailUrl,
      width: input.width,
      height: input.height,
      mimeType: guessMime(input.fullUrl),
      title: input.title,
      defaultAlt: input.alt,
      creatorName: input.creatorName,
      creatorUrl: input.creatorUrl,
      sourcePageUrl: input.sourcePageUrl,
      license: input.license,
      licenseUrl: input.licenseUrl,
      attributionText: input.attributionText,
      createdAt: nowIso(),
      softDeleted: false,
    };
    this.store.set(asset.id, asset);
    return asset;
  }

  createFromUpload(input: {
    fileName: string;
    mimeType: string;
    url: string;
    width: number;
    height: number;
    alt?: string;
  }): MediaAsset {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(input.mimeType)) {
      throw new Error("Use JPEG, PNG, or WebP.");
    }

    const asset: MediaAsset = {
      id: crypto.randomUUID(),
      ownerId: null,
      provider: "upload",
      providerAssetId: null,
      url: input.url,
      thumbnailUrl: input.url,
      width: input.width,
      height: input.height,
      mimeType: input.mimeType,
      title: input.fileName,
      defaultAlt: input.alt?.trim() || input.fileName,
      creatorName: null,
      creatorUrl: null,
      sourcePageUrl: null,
      license: "Owner upload",
      licenseUrl: null,
      attributionText: input.fileName,
      createdAt: nowIso(),
      softDeleted: false,
    };
    this.store.set(asset.id, asset);
    return asset;
  }

  softDelete(id: string): void {
    const asset = this.store.get(id);
    if (asset) {
      this.store.set(id, { ...asset, softDeleted: true });
    }
  }

  clear(): void {
    this.store.clear();
  }
}

function guessMime(url: string): string {
  if (url.startsWith("data:image/png")) return "image/png";
  if (url.startsWith("data:image/webp")) return "image/webp";
  if (url.startsWith("data:image/jpeg") || url.startsWith("data:image/jpg")) {
    return "image/jpeg";
  }
  if (url.endsWith(".png")) return "image/png";
  if (url.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

let defaultStore: MemoryMediaStore | null = null;

export function getDefaultMediaStore(): MemoryMediaStore {
  if (!defaultStore) {
    defaultStore = new MemoryMediaStore();
  }
  return defaultStore;
}

export function resetDefaultMediaStoreForTests(): void {
  defaultStore?.clear();
  defaultStore = null;
  getStore().clear();
}
