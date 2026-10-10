import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "placeholder-anon-key";

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const isAdmin = claims?.app_metadata?.role === "admin";
  const path = request.nextUrl.pathname;

  const redirectTo = (pathname: string) => {
    const redirect = NextResponse.redirect(new URL(pathname, request.url));
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  if (!claims && (path.startsWith("/portal") || path.startsWith("/admin"))) return redirectTo("/ingresar");
  if (claims && path.startsWith("/admin") && !isAdmin) return redirectTo("/portal");
  if (claims && path.startsWith("/portal") && isAdmin) return redirectTo("/admin");
  if (claims && path.startsWith("/ingresar")) return redirectTo(isAdmin ? "/admin" : "/portal");

  return response;
}

export const config = {
  matcher: ["/portal/:path*", "/admin/:path*", "/ingresar"],
};
