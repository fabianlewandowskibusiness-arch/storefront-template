import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { storefrontConfigSchema } from "../schema";
import { normalizeMediaUrls } from "../normalizeMediaUrls";
import { storefrontConfigTag } from "@/lib/cache/storefrontCacheTags";
import type { StorefrontConfig } from "@/types/storefront";

const DEFAULT_API_URL = "https://api.ecommerce-flow.ai";
const REVALIDATE_SECONDS = 60;

function log(storeId: string, message: string, ...args: unknown[]) {
  console.error(`[storefront][store:${storeId}] ${message}`, ...args);
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
