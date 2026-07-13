import { NextResponse } from "next/server";
import { searchMedia } from "@/features/media/openverse";

/**
 * GET /api/media/search?q=&page=&pageSize=
 * Server-side media search. Never exposes provider API keys.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? searchParams.get("query") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(
    48,
    Math.max(1, Number(searchParams.get("pageSize") ?? "24") || 24),
  );

  const result = await searchMedia({ query, page, pageSize });
  return NextResponse.json(result);
}
