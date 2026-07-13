import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseConfigError";
  }
}

export function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new SupabaseConfigError(
      "Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.example). Unit tests do not require Supabase.",
    );
  }

  if (url.includes("your-project") || anonKey.includes("your-anon")) {
    throw new SupabaseConfigError(
      "Supabase env still has placeholder values from .env.example. Replace them with a real project or run in mock mode.",
    );
  }

  return { url, anonKey };
}

/**
 * Browser Supabase client. Throws a clear error when env is missing
 * so local contract development can proceed without credentials.
 */
export function createBrowserSupabaseClient(): SupabaseClient {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
