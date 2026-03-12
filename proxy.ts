import { NextResponse, type NextRequest } from "next/server";

const BASE_DOMAINS = ["benefits.acolyteai.com", "localhost"];

function isBaseDomain(host: string): boolean {
  return BASE_DOMAINS.some(
    (d) => host === d || host.startsWith(`${d}:`)
  );
}

function extractSubdomain(host: string): string | null {
  const parts = host.split(".");
  if (parts.length > 2) {
    const sub = parts[0];
    if (sub !== "www") return sub;
  }
  return null;
}

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname, searchParams } = request.nextUrl;

  const subdomain = extractSubdomain(host);
  const employerSlug =
    subdomain ??
    searchParams.get("employer") ??
    process.env.NEXT_PUBLIC_DEFAULT_EMPLOYER ??
    null;

  const isAdminRoute = pathname.startsWith("/admin");
  const isContentApi = pathname.startsWith("/api/content");

  if (isAdminRoute || isContentApi) {
    const token =
      request.headers.get("x-admin-token") ??
      searchParams.get("token") ??
      request.cookies.get("admin_token")?.value;

    const expected = process.env.ADMIN_TOKEN;

    if (expected && token !== expected) {
      if (isContentApi) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      return NextResponse.redirect(loginUrl);
    }
  }

  const resHeaders = new Headers(request.headers);
  if (employerSlug) {
    resHeaders.set("x-employer-slug", employerSlug);
  }

  const response = NextResponse.next({ request: { headers: resHeaders } });

  // Persist admin token as a cookie when provided via query param so
  // subsequent client-side fetches are also authenticated.
  const qToken = searchParams.get("token");
  const expected = process.env.ADMIN_TOKEN;
  if (qToken && expected && qToken === expected && !request.cookies.get("admin_token")) {
    response.cookies.set("admin_token", qToken, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|images|icons|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|eot)).*)",
  ],
};
