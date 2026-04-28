import { NextRequest, NextResponse } from "next/server";

/**
 * Runs on every non-static request and sets two internal headers used by
 * server components via `headers()` from `next/headers`:
 *
 * x-storefront-host   — The incoming hostname (e.g. "store.ecommerce-flow.ai"
 *                       or "customerbrand.pl"). This lays the groundwork for
 *                       multi-tenant host-based tenant resolution: once the
 *                       backend exposes a `GET /storefront-runtime/by-host`
 *                       endpoint, the config provider can use this header
 *                       instead of the STORE_ID env var.
 *
 * x-storefront-mode   — Set to "draft" when `?mode=draft` is present in the
 *                       query string so that layout.tsx (which does not receive
 *                       searchParams) can detect draft mode.
 */
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);

  // Prefer x-forwarded-host (set by Vercel / reverse proxies) over the raw
  // Host header so the value is always the public-facing hostname.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host") ?? request.nextUrl.hostname;
  headers.set("x-storefront-host", host);

  const mode = request.nextUrl.searchParams.get("mode");
  if (mode === "draft") {
    headers.set("x-storefront-mode", "draft");
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for Next.js internals and static files.
     * The proxy runs on every page route so the headers reach server components
     * during both full-page loads and client navigations.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
