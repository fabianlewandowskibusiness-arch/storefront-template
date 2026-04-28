import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { storefrontConfigSchema } from "../schema";
import { normalizeMediaUrls } from "../normalizeMediaUrls";
import { storefrontConfigTag, storefrontHostConfigTag } from "@/lib/cache/storefrontCacheTags";
import type { StorefrontConfig } from "@/types/storefront";

const DEFAULT_API_URL = "https://api.ecommerce-flow.ai";
const REVALIDATE_SECONDS = 60;

function log(storeId: string, message: string, ...args: unknown[]) {
  console.error(`[storefront][store:${storeId}] ${message}`, ...args);
}

function logHost(host: string, message: string, ...args: unknown[]) {
  console.error(`[storefront][host:${host}] ${message}`, ...args);
}


/**
 * Builds the backend URL used to fetch a storefront's runtime config.
 *
 * Exported as a pure function so it can be unit-tested independently of
 * Next.js runtime internals (headers(), redirect(), etc.).
 *
 * Multi-tenant note: once the backend exposes
 *   GET /storefront-runtime/by-host?host={hostname}
 * this function (or a sibling) will be updated to accept a `host` argument
 * instead of `storeId`, enabling host-based tenant resolution.
 */
export function buildConfigUrl(
  apiUrl: string,
  storeId: string,
  isDraft: boolean,
): string {
  const base = `${apiUrl}/storefront-runtime/${storeId}`;
  return isDraft ? `${base}?mode=draft` : base;
}

type LiveFetchOptions = {
  next: { revalidate: number; tags: string[] };
  headers: { Accept: string };
};

type DraftFetchOptions = {
  cache: "no-store";
  headers: { Accept: string };
};

/**
 * Returns the fetch init options for the config request.
 *
 * - Draft mode: `cache: "no-store"` — bypasses the Data Cache entirely.
 *   No tags are attached because draft responses must never be cached.
 * - Live mode: `next: { revalidate, tags: [tag] }` — ISR-style caching with
 *   a per-store cache tag. The tag enables on-demand invalidation via
 *   `revalidateTag(tag, { expire: 0 })` when the backend publishes changes.
 *
 * Extracted as a pure function so it can be unit-tested without mocking
 * Next.js runtime internals.
 */
export function buildFetchOptions(
  isDraft: boolean,
  tag: string,
): LiveFetchOptions | DraftFetchOptions {
  if (isDraft) {
    return { cache: "no-store", headers: { Accept: "application/json" } };
  }
  return {
    next: { revalidate: REVALIDATE_SECONDS, tags: [tag] },
    headers: { Accept: "application/json" },
  };
}

export async function loadRemoteConfig(): Promise<StorefrontConfig> {
  const storeId = process.env.STORE_ID;
  const apiUrl = (process.env.STOREFRONT_API_URL || DEFAULT_API_URL).replace(/\/$/, "");

  if (!storeId) {
    throw new Error("STORE_ID is required for remote config loading");
  }

  // Draft mode is signalled by the middleware via x-storefront-mode: draft.
  // In draft mode we bypass the CDN cache and fetch the latest saved version.
  const requestHeaders = await headers();
  const isDraft = requestHeaders.get("x-storefront-mode") === "draft";

  const url = buildConfigUrl(apiUrl, storeId, isDraft);
  const fetchOptions = buildFetchOptions(isDraft, storefrontConfigTag(storeId));

  let response: Response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (error) {
    log(storeId, "Network error fetching config:", error);
    redirect("/store-unavailable");
  }

  if (response.status === 404) {
    log(storeId, "Store not found (404)");
    redirect("/store-not-found");
  }

  if (response.status === 401 || response.status === 403) {
    log(storeId, `Unexpected auth error (${response.status}) on public endpoint — check backend configuration`);
    redirect("/store-unavailable");
  }

  if (!response.ok) {
    log(storeId, `API error: ${response.status} ${response.statusText}`);
    redirect("/store-unavailable");
  }

  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    log(storeId, "Response is not valid JSON");
    redirect("/config-error");
  }

  const result = storefrontConfigSchema.safeParse(raw);
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    log(storeId, `Config validation failed:\n${formatted}`);
    redirect("/config-error");
  }

  // Defensive compatibility layer — see normalizeMediaUrls.ts header comment.
  return normalizeMediaUrls(result.data);
}

// ── Host-based loader (Phase 2 / multi-tenant) ────────────────────────────────

/**
 * Builds the backend URL for host-based config resolution.
 *
 * Exported as a pure function for unit testing.
 *
 * @example
 *   buildHostConfigUrl("https://api.example.com", "brand.pl", false)
 *   // → "https://api.example.com/storefront-runtime/by-host?host=brand.pl"
 *
 *   buildHostConfigUrl("https://api.example.com", "brand.pl", true)
 *   // → "https://api.example.com/storefront-runtime/by-host?host=brand.pl&mode=draft"
 */
export function buildHostConfigUrl(
  apiUrl: string,
  host: string,
  isDraft: boolean,
): string {
  const base = `${apiUrl}/storefront-runtime/by-host?host=${encodeURIComponent(host)}`;
  return isDraft ? `${base}&mode=draft` : base;
}

/**
 * Loads the storefront config by resolving the request's public hostname.
 *
 * Reads the host from the `x-storefront-host` header (set by proxy.ts from the
 * Vercel `x-forwarded-host` header), falling back to the raw `host` header for
 * local/non-Vercel environments.
 *
 * The resolved host is normalized (trimmed, lowercased) before the API call.
 *
 * Cache strategy:
 *  - LIVE mode:  `next: { revalidate: 60, tags: [storefrontHostConfigTag(host)] }`
 *                Tagged so the revalidation webhook can invalidate by host.
 *  - Draft mode: `cache: "no-store"` — always fetches fresh, no tag attached.
 *
 * On error (network failure, 4xx/5xx, parse failure) it redirects to the
 * appropriate error page — same pattern as `loadRemoteConfig`.
 *
 * IMPORTANT: Does NOT read `STORE_ID`. This loader is exclusively host-based.
 */
export async function loadRemoteConfigByHost(): Promise<StorefrontConfig> {
  const apiUrl = (process.env.STOREFRONT_API_URL || DEFAULT_API_URL).replace(/\/$/, "");

  const requestHeaders = await headers();

  // x-storefront-host is the canonical multi-tenant header, set by proxy.ts
  // from x-forwarded-host (Vercel) or the Host header.
  // Fall back to the raw Host header for environments without the proxy.
  const rawHost =
    requestHeaders.get("x-storefront-host") ??
    requestHeaders.get("host") ??
    "";

  // Basic normalization: trim whitespace + lowercase.
  // Port stripping is handled by the proxy and backend normalizer — we don't
  // need to do it here. If the host is still dirty the backend will normalize it.
  const host = rawHost.trim().toLowerCase();

  if (!host) {
    console.error("[storefront][by-host] No host header found — cannot resolve storefront");
    redirect("/store-unavailable");
  }

  const isDraft = requestHeaders.get("x-storefront-mode") === "draft";

  const url = buildHostConfigUrl(apiUrl, host, isDraft);
  const fetchOptions = buildFetchOptions(isDraft, storefrontHostConfigTag(host));

  let response: Response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (error) {
    logHost(host, "Network error fetching config:", error);
    redirect("/store-unavailable");
  }

  if (response.status === 404) {
    logHost(host, "Store not found (404) — no storefront assigned to this host");
    redirect("/store-not-found");
  }

  if (response.status === 400) {
    logHost(host, "Bad request (400) — host value rejected by backend");
    redirect("/store-unavailable");
  }

  if (response.status === 401 || response.status === 403) {
    logHost(host, `Unexpected auth error (${response.status}) on public endpoint — check backend configuration`);
    redirect("/store-unavailable");
  }

  if (!response.ok) {
    logHost(host, `API error: ${response.status} ${response.statusText}`);
    redirect("/store-unavailable");
  }

  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    logHost(host, "Response is not valid JSON");
    redirect("/config-error");
  }

  const result = storefrontConfigSchema.safeParse(raw);
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    logHost(host, `Config validation failed:\n${formatted}`);
    redirect("/config-error");
  }

  return normalizeMediaUrls(result.data);
}
