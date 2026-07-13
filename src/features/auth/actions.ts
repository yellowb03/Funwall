"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/services/db/factory";
import {
  DEV_SESSION_COOKIE,
  DEV_SESSION_MAX_AGE_SECONDS,
  DEV_SESSION_VALUE,
} from "@/features/auth/constants";
import {
  createSupabaseServerClient,
  isLocalDevAuthEnabled,
} from "@/features/auth/session";

function safeRedirectPath(path: string | null | undefined): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/activities";
  }
  return path;
}

/**
 * Local-dev sign-in: sets dev-owner cookie. Only when Supabase is not configured.
 */
export async function signInLocalDev(formData?: FormData): Promise<void> {
  if (!isLocalDevAuthEnabled()) {
    throw new Error(
      "Local dev auth is disabled when Supabase env is configured.",
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(DEV_SESSION_COOKIE, DEV_SESSION_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DEV_SESSION_MAX_AGE_SECONDS,
  });

  const next = safeRedirectPath(
    formData?.get("next")?.toString() ?? "/activities",
  );
  redirect(next);
}

/**
 * Supabase email/password sign-in when configured.
 */
export async function signInWithPassword(formData: FormData): Promise<{
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured. Use local dev sign-in." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeRedirectPath(formData.get("next")?.toString());

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.message };
  }

  redirect(next);
}

/**
 * Supabase magic-link request when configured.
 */
export async function signInWithMagicLink(formData: FormData): Promise<{
  error?: string;
  ok?: boolean;
}> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured. Use local dev sign-in." };
  }

  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Email is required." };
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  const next = safeRedirectPath(formData.get("next")?.toString());

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    return { error: error.message };
  }
  return { ok: true };
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
    } catch {
      // ignore config errors during sign-out
    }
  }

  const cookieStore = await cookies();
  cookieStore.set(DEV_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  redirect("/login");
}
