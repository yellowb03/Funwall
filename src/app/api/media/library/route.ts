import { NextResponse } from "next/server";
import { getDefaultMediaStore } from "@/features/media/media-store";

/**
 * GET /api/media/library — list owner media (memory store in local mode).
 */
export async function GET() {
  const store = getDefaultMediaStore();
  return NextResponse.json({ assets: store.list() });
}
