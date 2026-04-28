import { revalidateTag } from "next/cache";
import { storefrontConfigTag, storefrontHostConfigTag } from "@/lib/cache/storefrontCacheTags";

// This route is always dynamic — it reads request headers and body.
export const dynamic = "force-dynamic";

/**
 * POST /api/revalidate/storefront
 *
 * Webhook endpoint for the backend to trigger immediate cache invalidation
 * after a storefront config is published or updated.
 *
 * Authentication:
 *   Authorization: Bearer <STOREFRONT_REVALIDATION_SECRET>
 *   — or —
 *   x-revalidation-secret: <STOREFRONT_REVALIDATION_SECRET>
 *
 * Request body:
 *   { "storeId": "abc123", "host": "brand.pl" }   ← host is optional (Phase 2)
 *   { "storeId": "abc123" }
 *
 * Success response:
 *   { "revalidated": true, "tag": "storefront-config:abc123", "storeId": "abc123" }
 *   { "revalidated": true, "tag": "...", "storeId": "...", "tags": [...] }  ← when host also provided
 *
 * Uses revalidateTag(tag, { expire: 0 }) for immediate expiration —
 * the correct form for external webhooks per Next.js 16 docs.
 */
export async function POST(request: Request) {
  // ── 1. Secret must be configured ────────────────────────────────────────────
  const secret = process.env.STOREFRONT_REVALIDATION_SECRET;
  if (!secret) {
    console.error("[revalidate/storefront] STOREFRONT_REVALIDATION_SECRET is not set");
    return Response.json(
      { error: "Revalidation endpoint is not configured" },
      { status: 500 },
    );
  }

  // ── 2. Token authentication ──────────────────────────────────────────────────
  // Accept token from either Authorization: Bearer <token>
  // or the simpler x-revalidation-secret header.
  const authHeader = request.headers.get("authorization");
  const secretHeader = request.headers.get("x-revalidation-secret");

  const providedToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : secretHeader;

  if (!providedToken || providedToken !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 3. Parse request body ────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "Body must be a JSON object" }, { status: 400 });
  }

  const { storeId, host } = body as { storeId?: unknown; host?: unknown };

  // ── 4. Validate required fields ──────────────────────────────────────────────
  if (!storeId || typeof storeId !== "string" || !storeId.trim()) {
    return Response.json(
      { error: "storeId is required and must be a non-empty string" },
      { status: 400 },
    );
  }

  const normalizedStoreId = storeId.trim();

  // ── 5. Revalidate store config tag immediately ───────────────────────────────
  // { expire: 0 } causes the tag to expire immediately, so the next request
  // for any page using this tag will be a blocking cache miss (fresh fetch).
  // This is the recommended pattern for external webhook-triggered invalidation.
  const tag = storefrontConfigTag(normalizedStoreId);
  revalidateTag(tag, { expire: 0 });

  const revalidatedTags: string[] = [tag];

  // ── 6. Optionally revalidate host tag (Phase 2 / by-host mode) ───────────────
  // When the backend also knows the public hostname for this store it can
  // pass `host` to invalidate the future by-host cache entry in the same call,
  // ensuring a clean transition when Phase 2 is deployed.
  if (host && typeof host === "string" && host.trim()) {
    const hostTag = storefrontHostConfigTag(host.trim());
    revalidateTag(hostTag, { expire: 0 });
    revalidatedTags.push(hostTag);
  }

  const responseBody =
    revalidatedTags.length > 1
      ? { revalidated: true, tag, storeId: normalizedStoreId, tags: revalidatedTags }
      : { revalidated: true, tag, storeId: normalizedStoreId };

  return Response.json(responseBody);
}
