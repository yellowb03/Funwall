import { searchFixtureMedia } from "@/features/media/fixtures";
import { normalizeOpenverseResult } from "@/features/media/normalize";
import type { MediaSearchResponse } from "@/features/media/types";

/**
 * Server-only Openverse search. Credentials never leave the server.
 *
 * Strategy:
 * 1. Prefer registered app credentials when present (higher rate limits).
 * 2. Otherwise call the public Openverse API anonymously (works without keys).
 * 3. Fall back to built-in sample images if the network/API fails or is rate-limited.
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

  // Anonymous search works without keys; credentials only raise rate limits.
  const live = await tryOpenverseSearch({
    baseUrl,
    query,
    page,
    pageSize,
    clientId: clientId || null,
    clientSecret: clientSecret || null,
  });

  if (live) {
    return live;
  }

  const fixture = searchFixtureMedia(query, page, pageSize);
  return {
    results: fixture.results,
    source: "fixture",
    query,
    page,
    pageSize,
    hasMore: fixture.hasMore,
    warning: fixture.unmatched
      ? "No exact matches in sample images — showing the full sample set. Add OPENVERSE credentials for broader live search."
      : "Showing free sample images you can use right away. Live Openverse search is temporarily unavailable.",
  };
}

async function tryOpenverseSearch(options: {
  baseUrl: string;
  query: string;
  page: number;
  pageSize: number;
  clientId: string | null;
  clientSecret: string | null;
}): Promise<MediaSearchResponse | null> {
  const { baseUrl, query, page, pageSize, clientId, clientSecret } = options;
  // Openverse rejects empty q — use a classroom-friendly default for browse.
  const searchQuery = query || "classroom education";

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (clientId && clientSecret) {
      try {
        const token = await getOpenverseToken(baseUrl, clientId, clientSecret);
        headers.Authorization = `Bearer ${token}`;
      } catch {
        // Fall through to anonymous request.
      }
    }

    const params = new URLSearchParams({
      q: searchQuery,
      page: String(page),
      // Anonymous tier historically caps page size; keep conservative.
      page_size: String(Math.min(pageSize, 20)),
      mature: "false",
    });

    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/images/?${params}`, {
      headers,
      cache: "no-store",
    });

    if (res.status === 429) {
      return null;
    }

    if (!res.ok) {
      return null;
    }

    const body = (await res.json()) as {
      results?: Array<Record<string, unknown>>;
      page_count?: number;
    };

    const results = (body.results ?? [])
      .map((item) => normalizeOpenverseResult(item))
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (results.length === 0) {
      // Prefer sample gallery over a dead empty state when live returns nothing.
      return null;
    }

    return {
      results,
      source: "openverse",
      query,
      page,
      pageSize,
      hasMore: page < (body.page_count ?? page),
      warning:
        clientId && clientSecret
          ? undefined
          : "Live free images from Openverse. Register OPENVERSE_CLIENT_ID / OPENVERSE_CLIENT_SECRET for higher rate limits.",
    };
  } catch {
    return null;
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
