import { NextResponse, type NextRequest } from "next/server";

// Only use subdomain as employer when host is under one of these (e.g. rs-h.benefits.acolyteai.com).
// On other hosts (e.g. dbh-demosite.vercel.app) we ignore subdomain and use ?employer= or env only.
const BASE_DOMAINS = ["benefits.acolyteai.com", "localhost"];

function isBaseDomain(host: string): boolean {
  const hostname = host.split(":")[0];
  return BASE_DOMAINS.some(
    (d) => hostname === d || hostname.endsWith("." + d)
  );
}

/** Returns employer subdomain only when host is under a BASE_DOMAIN (e.g. rs-h.benefits.acolyteai.com). */
function extractSubdomain(host: string): string | null {
  const hostname = host.split(":")[0];
  if (!isBaseDomain(hostname)) return null;
  for (const base of BASE_DOMAINS) {
    if (hostname === base || !hostname.endsWith("." + base)) continue;
    const sub = hostname.slice(0, -base.length - 1);
    if (sub && sub !== "www") return sub;
  }
  return null;
}

function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname, searchParams } = request.nextUrl;

  // Multi-tenant: employer from subdomain (e.g. rs-h.benefits.acolyteai.com), ?employer=, or env default.
  // x-employer-slug is passed to all routes including /admin so client-specific admin loads correct content.
  const subdomain = extractSubdomain(host);
  const isRootOnMainDomain = pathname === "/" && !subdomain && !searchParams.has("employer");

  const employerSlug = isRootOnMainDomain
    ? null
    : subdomain ??
      searchParams.get("employer") ??
      request.cookies.get("employer_slug")?.value ??
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
      // Preserve employer (and any other) query params so after login we can redirect to the correct client admin
      if (searchParams.has("employer")) {
        loginUrl.searchParams.set("employer", searchParams.get("employer")!);
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  const resHeaders = new Headers(request.headers);
  if (employerSlug) {
    resHeaders.set("x-employer-slug", employerSlug);
  }

  const response = NextResponse.next({ request: { headers: resHeaders } });

  // Persist employer slug as a cookie so internal links on non-subdomain 
  // hosts (e.g. vercel.app) maintain context without ?employer= param.
  if (employerSlug && !subdomain) {
    const currentCookie = request.cookies.get("employer_slug")?.value;
    if (currentCookie !== employerSlug) {
      response.cookies.set("employer_slug", employerSlug, {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
      });
    }
  }

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

export default proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|images|icons|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|eot)).*)",
  ],
};
