import { searchFixtureMedia } from "@/features/media/fixtures";
import { normalizeOpenverseResult } from "@/features/media/normalize";
import type { MediaSearchResponse } from "@/features/media/types";

/**
 * Server-only Openverse search. Credentials never leave the server.
 * Falls back to fixture stock results when keys are missing.
 */
export async function searchMedia(options: {
  query: string;
  page?: number;
  pageSize?: number;
}): Promise<MediaSearchResponse> {
  const query = options.query.trim();
  const page = options.page ?? 1;
  const pageSize = Math.min(options.pageSize ?? 24, 48);

  const clientId = process.env.OPENVERSE_CLIENT_ID?.trim();
  const clientSecret = process.env.OPENVERSE_CLIENT_SECRET?.trim();
  const baseUrl =
    process.env.OPENVERSE_API_BASE_URL?.trim() ||
    "https://api.openverse.org/v1";

  if (!clientId || !clientSecret) {
    const fixture = searchFixtureMedia(query || "classroom", page, pageSize);
    return {
      results: fixture.results,
      source: "fixture",
      query,
      page,
      pageSize,
      hasMore: fixture.hasMore,
      warning:
        "Using sample images. Add OPENVERSE_CLIENT_ID and OPENVERSE_CLIENT_SECRET for live search.",
    };
  }

  try {
    const token = await getOpenverseToken(baseUrl, clientId, clientSecret);
    const params = new URLSearchParams({
      q: query || "education",
      page: String(page),
      page_size: String(pageSize),
      mature: "false",
    });
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/images/?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      // Avoid caching secrets or personalized results at the edge incorrectly.
      cache: "no-store",
    });

    if (res.status === 429) {
      const fixture = searchFixtureMedia(query || "classroom", page, pageSize);
      return {
        results: fixture.results,
        source: "fixture",
        query,
        page,
        pageSize,
        hasMore: fixture.hasMore,
        warning:
          "Too many searches. Showing sample images; try again in a moment.",
      };
    }

    if (!res.ok) {
      throw new Error(`Openverse responded with ${res.status}`);
    }

    const body = (await res.json()) as {
      results?: Array<Record<string, unknown>>;
      page_count?: number;
      result_count?: number;
    };

    const results = (body.results ?? [])
      .map((item) => normalizeOpenverseResult(item))
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return {
      results,
      source: "openverse",
      query,
      page,
      pageSize,
      hasMore: page < (body.page_count ?? page),
    };
  } catch {
    const fixture = searchFixtureMedia(query || "classroom", page, pageSize);
    return {
      results: fixture.results,
      source: "fixture",
      query,
      page,
      pageSize,
      hasMore: fixture.hasMore,
      warning:
        "Image search is unavailable right now. Showing sample images.",
    };
  }
}

type TokenCache = { accessToken: string; expiresAt: number };

const TOKEN_CACHE_KEY = "__funwall_openverse_token__";

async function getOpenverseToken(
  baseUrl: string,
  clientId: string,
  clientSecret: string,
): Promise<string> {
  const g = globalThis as typeof globalThis & {
    [TOKEN_CACHE_KEY]?: TokenCache;
  };
  const cached = g[TOKEN_CACHE_KEY];
  if (cached && cached.expiresAt > Date.now() + 30_000) {
    return cached.accessToken;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/auth_tokens/token/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Openverse token request failed (${res.status})`);
  }

  const json = (await res.json()) as {
    access_token: string;
    expires_in?: number;
  };

  g[TOKEN_CACHE_KEY] = {
    accessToken: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  };

  return json.access_token;
}
