import { headers } from "next/headers";
import { assertOriginOnly, joinApiUrl } from "@/lib/url";

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
 *      x-storefront-host header injected by proxy.ts, falling back to host.
 *      The raw value is normalized: take the first element if comma-separated,
 *      strip port, lowercase, trim.
 *   2. Ask the backend to resolve which storefront owns this host via the
 *      /storefront-runtime/by-host endpoint (looks up storefront_domains).
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

/**
 * Normalizes a raw Host / x-forwarded-host header value for use as a backend
 * lookup key.
 *
 * Vercel can set x-forwarded-host to a comma-separated list when the request
 * passes through multiple proxy layers (e.g.
 * "store-uuid.domain.io, store-uuid.domain.io"). The backend domain table
 * stores bare hostnames without ports, so we:
 *   1. Take the first element of a comma-separated list.
 *   2. Strip any port suffix (e.g. ":443").
 *   3. Trim whitespace and lowercase.
 */
function normalizeHost(raw: string): string {
  // Take the first value if comma-separated (multiple proxy hops).
  const first = raw.split(",")[0];
  // Strip port suffix.
  const withoutPort = first.replace(/:\d+$/, "");
  return withoutPort.trim().toLowerCase();
}

export async function GET() {
  const requestHeaders = await headers();

  // Prefer x-forwarded-host (always set by Vercel edge) over x-storefront-host
  // (set by proxy.ts from x-forwarded-host — same value, but proxy may not run
  // before this route handler in some edge cases), then fall back to host.
  const rawHost =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("x-storefront-host") ??
    requestHeaders.get("host");

  if (!rawHost) {
    console.error("[ecf-ping] Missing host header — cannot resolve storefront");
    return new Response(JSON.stringify({ error: "Missing host header" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  const host = normalizeHost(rawHost);

  if (!host) {
    console.error("[ecf-ping] Host header present but empty after normalization:", rawHost);
    return new Response(JSON.stringify({ error: "Invalid host header" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  // Validate: throws immediately if STOREFRONT_API_URL ends with /api.
  // Convention: STOREFRONT_API_URL must be origin-only — /api/ is appended by code.
  const apiUrl = assertOriginOnly(
    process.env.STOREFRONT_API_URL ?? "https://api.ecommerce-flow.ai",
    "STOREFRONT_API_URL",
  );

  const backendUrl = joinApiUrl(
    apiUrl,
    `/api/storefront-runtime/by-host?host=${encodeURIComponent(host)}`,
  );

  console.log("[ecf-ping] Resolving host:", host, "→", backendUrl);

  let storeId: string | undefined;
  try {
    // by-host resolves the storefront that owns this hostname.
    // The system domain is registered as ASSIGNED immediately after
    // deploySharedRuntime() commits, so this lookup succeeds as soon as the
    // Vercel runtime starts serving the domain — which is what we want to confirm.
    const res = await fetch(backendUrl, {
      // Never serve a cached response for a liveness check.
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    console.log("[ecf-ping] Backend response status:", res.status, "for host:", host);

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
      console.error("[ecf-ping] Backend error:", res.status, "for host:", host);
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
  } catch (err) {
    console.error("[ecf-ping] Backend unreachable for host:", host, err);
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
    console.error("[ecf-ping] by-host returned 200 but storeId is missing for host:", host);
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

  console.log("[ecf-ping] Resolved storeId:", storeId, "for host:", host);

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
