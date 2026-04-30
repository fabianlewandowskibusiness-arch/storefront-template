import { headers } from "next/headers";

export const dynamic = "force-dynamic";

/**
 * Identity ping route for shared-runtime deployment verification.
 *
 * The backend's DefaultStorefrontPingChecker calls this route during deployment
 * status refresh (refreshDeploymentStatusSharedRuntime) to confirm that this
 * hostname is actually serving the expected storefront via the shared Vercel
 * runtime. The backend compares the returned X-ECF-Store-Id header against the
 * project's pipelineSessionId and promotes DEPLOYING → DEPLOYED on a match.
 *
 * Resolution flow:
 *   1. Read the public hostname from x-forwarded-host (set by Vercel) or the
 *      x-storefront-host header injected by middleware (proxy.ts).
 *   2. Ask the backend to resolve which storefront owns this host via the
 *      /api/storefront-runtime/by-host endpoint (looks up storefront_domains).
 *   3. Echo the resolved storeId in the X-ECF-Store-Id response header.
 *
 * This route works for both system domains (store-{id}.{baseDomain}) and
 * verified custom domains — the by-host endpoint handles both via the same
 * storefront_domains table lookup.
 *
 * Protocol (as expected by DefaultStorefrontPingChecker):
 *   GET https://{domain}/ecf-ping
 *   → 200 OK
 *   → X-ECF-Store-Id: {pipelineSessionId}
 */
export async function GET() {
  const requestHeaders = await headers();

  // Prefer x-forwarded-host (always set by Vercel edge) over x-storefront-host
  // (set by our proxy middleware from x-forwarded-host — same value, but
  // middleware may not run before this route handler in some edge cases).
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("x-storefront-host") ??
    requestHeaders.get("host");

  if (!host) {
    return new Response(JSON.stringify({ error: "Missing host header" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiUrl = (
    process.env.STOREFRONT_API_URL ?? "https://api.ecommerce-flow.ai"
  ).replace(/\/$/, "");

  let storeId: string | undefined;
  try {
    // by-host resolves the storefront that owns this hostname.
    // The system domain is registered as ASSIGNED immediately after
    // deploySharedRuntime() commits, so this lookup succeeds as soon as the
    // Vercel runtime starts serving the domain — which is what we want to confirm.
    const res = await fetch(
      `${apiUrl}/storefront-runtime/by-host?host=${encodeURIComponent(host)}`,
      {
        // Never serve a cached response for a liveness check.
        cache: "no-store",
        headers: { Accept: "application/json" },
      },
    );

    if (res.status === 404) {
      // Host not registered yet — domain row may still be propagating.
      return new Response(
        JSON.stringify({ error: "Store not found for host", host }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        },
      );
    }

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "Backend error", status: res.status }),
        {
          status: 502,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const data = (await res.json()) as { storeId?: string };
    storeId = data.storeId;
  } catch {
    return new Response(JSON.stringify({ error: "Backend unreachable" }), {
      status: 503,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }

  if (!storeId) {
    // Unexpected: by-host returned 200 but no storeId field.
    return new Response(
      JSON.stringify({ error: "No storeId in by-host response" }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  return new Response(JSON.stringify({ storeId, status: "ok" }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      // X-ECF-Store-Id is the single header the backend ping checker reads.
      // It must match project.getPipelineSessionId() exactly for PingResult.Ok.
      "X-ECF-Store-Id": storeId,
      "Cache-Control": "no-store",
    },
  });
}
