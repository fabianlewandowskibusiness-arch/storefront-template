/**
 * Cache tag helpers for per-storefront on-demand revalidation.
 *
 * Tags are attached to fetch requests:
 *   fetch(url, { next: { revalidate: 60, tags: [storefrontConfigTag(storeId)] } })
 *
 * And invalidated via the revalidation Route Handler:
 *   revalidateTag(storefrontConfigTag(storeId), { expire: 0 })
 *
 * Design constraints:
 *  - Tags must not exceed 256 characters (Next.js hard limit).
 *  - Values are lowercased so tag lookups are consistent regardless of how
 *    the caller formats the ID or hostname.
 *  - Leading/trailing whitespace is trimmed to prevent accidental mismatches.
 *  - Values are sliced to guarantee the full tag stays within the 256-char limit.
 */

const MAX_TAG_LENGTH = 256;

function normalizeTagValue(value: string, prefix: string): string {
  const maxValueLen = MAX_TAG_LENGTH - prefix.length;
  return value.trim().toLowerCase().slice(0, maxValueLen);
}

/**
 * Returns the cache tag for the STORE_ID-based remote config fetch.
 *
 * Used in the current deployment model (one STORE_ID per deployment) and
 * preserved for the multi-tenant model once the backend starts including
 * storeId in the by-host response.
 *
 * @example storefrontConfigTag("abc123") → "storefront-config:abc123"
 */
export function storefrontConfigTag(storeId: string): string {
  const prefix = "storefront-config:";
  return prefix + normalizeTagValue(storeId, prefix);
}

/**
 * Returns the cache tag for the future host-based remote config fetch.
 * Reserved for Phase 2 host-based (/by-host) config resolution — not used
 * in the current STORE_ID mode. The revalidation route already accepts an
 * optional `host` field so both tags can be invalidated in a single call.
 *
 * @example storefrontHostConfigTag("brand.pl") → "storefront-host:brand.pl"
 */
export function storefrontHostConfigTag(host: string): string {
  const prefix = "storefront-host:";
  return prefix + normalizeTagValue(host, prefix);
}
