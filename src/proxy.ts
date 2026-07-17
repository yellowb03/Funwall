import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  DEV_SESSION_COOKIE,
  DEV_SESSION_VALUE,
} from "@/features/auth/constants";

/** Protect owner routes while leaving public play account-free. */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isOwnerRoute =
    pathname.startsWith("/activities") || pathname.startsWith("/trash");
  if (!isOwnerRoute) return NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseConfigured =
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnon) &&
    !supabaseUrl?.includes("your-project") &&
    !supabaseAnon?.includes("your-anon");

  let response = NextResponse.next({ request: { headers: request.headers } });

  if (supabaseConfigured && supabaseUrl && supabaseAnon) {
    const supabase = createServerClient(supabaseUrl, supabaseAnon, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request: { headers: request.headers } });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return loginRedirect(request, pathname);
    return response;
  }

  const dev = request.cookies.get(DEV_SESSION_COOKIE)?.value;
  return dev === DEV_SESSION_VALUE
    ? response
    : loginRedirect(request, pathname);
}

function loginRedirect(request: NextRequest, pathname: string) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/activities/:path*", "/trash/:path*"],
};
