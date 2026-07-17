import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { MemoryMediaStore } from "@/features/media/media-store";
import type {
  MediaAsset,
  MediaSelectInput,
} from "@/features/media/types";

const MEDIA_PATH = path.join(process.cwd(), ".data", "media.json");

function openStore(): MemoryMediaStore {
  if (!existsSync(MEDIA_PATH)) return new MemoryMediaStore(new Map());
  try {
    const assets = JSON.parse(readFileSync(MEDIA_PATH, "utf8")) as MediaAsset[];
    return new MemoryMediaStore(
      new Map(assets.map((asset) => [asset.id, asset])),
    );
  } catch {
    return new MemoryMediaStore(new Map());
  }
}

function persist(store: MemoryMediaStore): void {
  const dir = path.dirname(MEDIA_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(MEDIA_PATH, JSON.stringify(store.list(true), null, 2), "utf8");
}

export function listServerMediaAssets(): MediaAsset[] {
  return openStore().list();
}

export function getServerMediaAsset(id: string): MediaAsset | null {
  return openStore().get(id);
}

export function selectServerMediaAsset(input: MediaSelectInput): MediaAsset {
  const store = openStore();
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
  const store = openStore();
  const asset = store.createFromUpload(input);
  persist(store);
  return asset;
}
