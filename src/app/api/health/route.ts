import { NextResponse } from "next/server";
import {
  getActivityRepositoryMode,
  isSupabaseConfigured,
  shouldUseCookieActivityStore,
} from "@/services/db";

export function GET() {
  const supabase = isSupabaseConfigured();
  return NextResponse.json({
    ok: true,
    storage: supabase
      ? "supabase"
      : shouldUseCookieActivityStore()
        ? "cookie"
        : getActivityRepositoryMode(),
    auth: supabase ? "supabase" : "local-dev",
    vercel: Boolean(process.env.VERCEL),
  });
}
