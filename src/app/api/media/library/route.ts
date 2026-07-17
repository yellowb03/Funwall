import { NextResponse } from "next/server";
import { listServerMediaAssets } from "@/features/media/server-media-store";

/**
 * GET /api/media/library — list owner media (memory store in local mode).
 */
export async function GET() {
  return NextResponse.json({ assets: listServerMediaAssets() });
}
