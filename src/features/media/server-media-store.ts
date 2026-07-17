import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { MemoryMediaStore } from "@/features/media/media-store";
import type {
  MediaAsset,
  MediaSelectInput,
} from "@/features/media/types";

const MEDIA_PATH = path.join(process.cwd(), ".data", "media.json");
const SINGLETON_KEY = "__funwall_server_media_store__";

type GlobalStore = typeof globalThis & {
  [SINGLETON_KEY]?: MemoryMediaStore;
};

function canUseFilePersist(): boolean {
  if (process.env.VERCEL) return false;
  if (process.env.NODE_ENV === "test" || process.env.VITEST) return false;
  return true;
}

function loadFromDisk(): MemoryMediaStore {
  if (!canUseFilePersist() || !existsSync(MEDIA_PATH)) {
    return new MemoryMediaStore(new Map());
  }
  try {
    const assets = JSON.parse(readFileSync(MEDIA_PATH, "utf8")) as MediaAsset[];
    return new MemoryMediaStore(
      new Map(assets.map((asset) => [asset.id, asset])),
    );
  } catch {
    return new MemoryMediaStore(new Map());
  }
}

/**
 * Process-wide media store. Required on Vercel where per-request file IO is
 * useless and the filesystem is often read-only.
 */
function getSharedStore(): MemoryMediaStore {
  const g = globalThis as GlobalStore;
  if (!g[SINGLETON_KEY]) {
    g[SINGLETON_KEY] = loadFromDisk();
  }
  return g[SINGLETON_KEY]!;
}

function persist(store: MemoryMediaStore): void {
  if (!canUseFilePersist()) return;
  try {
    const dir = path.dirname(MEDIA_PATH);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(MEDIA_PATH, JSON.stringify(store.list(true), null, 2), "utf8");
  } catch {
    // Read-only host — keep in-memory singleton only.
  }
}

export function listServerMediaAssets(): MediaAsset[] {
  return getSharedStore().list();
}

export function getServerMediaAsset(id: string): MediaAsset | null {
  return getSharedStore().get(id);
}

export function selectServerMediaAsset(input: MediaSelectInput): MediaAsset {
  const store = getSharedStore();
  const asset = store.selectFromProvider(input);
  persist(store);
  return asset;
}

export function createServerUploadMediaAsset(input: {
  fileName: string;
  mimeType: string;
  url: string;
  width: number;
  height: number;
  alt?: string;
}): MediaAsset {
  const store = getSharedStore();
  const asset = store.createFromUpload(input);
  persist(store);
  return asset;
}

/** Test helper */
export function resetServerMediaStoreForTests(): void {
  const g = globalThis as GlobalStore;
  g[SINGLETON_KEY]?.clear();
  g[SINGLETON_KEY] = undefined;
}
