import { NextResponse } from "next/server";
import { selectServerMediaAsset } from "@/features/media/server-media-store";
import type { MediaSelectInput } from "@/features/media/types";

/**
 * POST /api/media/select
 * Records provider/license/attribution and returns an owner media asset id.
 * Local mode uses MemoryMediaStore; 01 will persist to media_assets.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const input = body as Partial<MediaSelectInput>;
  if (
    !input.provider ||
    !input.providerAssetId ||
    !input.fullUrl ||
    !input.thumbnailUrl
  ) {
    return NextResponse.json(
      { error: "provider, providerAssetId, fullUrl, and thumbnailUrl are required" },
      { status: 400 },
    );
  }

  const asset = selectServerMediaAsset({
    provider: input.provider,
    providerAssetId: input.providerAssetId,
    thumbnailUrl: input.thumbnailUrl,
    fullUrl: input.fullUrl,
    width: input.width ?? 0,
    height: input.height ?? 0,
    title: input.title ?? "Image",
    alt: input.alt ?? input.title ?? "Image",
    creatorName: input.creatorName ?? null,
    creatorUrl: input.creatorUrl ?? null,
    sourcePageUrl: input.sourcePageUrl ?? null,
    license: input.license ?? "Unknown",
    licenseUrl: input.licenseUrl ?? null,
    attributionText:
      input.attributionText ??
      `${input.title ?? "Image"} (${input.license ?? "Unknown"})`,
    selectionToken: input.selectionToken,
    imageFit: input.imageFit,
  });

  return NextResponse.json({
    asset,
    imageFit: input.imageFit ?? "contain",
    alt: input.alt ?? asset.defaultAlt,
  });
}
