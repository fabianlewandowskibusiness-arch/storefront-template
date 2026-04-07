import { NextRequest, NextResponse } from "next/server";

/**
 * Detects the `?mode=draft` query parameter and forwards it as an internal
 * `x-storefront-mode` request header so that server components (layout.tsx,
 * page.tsx) can read it via `headers()` from `next/headers`.
 *
 * This is necessary because Next.js App Router layout.tsx does NOT receive
 * `searchParams` — only page.tsx does. The middleware runs before both, so
 * setting a header here makes draft mode universally accessible.
 */
export function middleware(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get("mode");

  if (mode === "draft") {
    const headers = new Headers(request.headers);
    headers.set("x-storefront-mode", "draft");
    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for Next.js internals and static files.
     * Middleware must run on every page route so the header reaches server
     * components during both full-page loads and client navigations.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
