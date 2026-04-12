/**
 * ──────────────────────────────────────────────────────────────────────────────
 *  TEMPORARY COMPATIBILITY LAYER — DO NOT TREAT AS THE SOURCE OF TRUTH.
 * ──────────────────────────────────────────────────────────────────────────────
 *
 *  This module rewrites broken media URLs found inside the runtime storefront
 *  config. It exists only to recover from a known backend regression where
 *  storefront media URLs were generated using the local app host
 *  (`http://localhost:8080/...`) instead of the configured public API host.
 *
 *  Behaviour:
 *    • Walks the parsed config tree once per request, after Zod validation.
 *    • Rewrites strings that look like media/storage URLs:
 *        - absolute URLs whose host is localhost / 127.0.0.1
 *        - root-relative paths starting with /api/storage/ or
 *          /api/storefront/media/ or /storefront-media/
 *    • Replaces only the origin (scheme + host), preserving the original
 *      path/query/hash so the upstream proxy still resolves to the right asset.
 *    • Leaves every other string in the config completely untouched —
 *      including localhost values that are NOT media URLs.
 *
 *  The real fix lives in the backend repository (StorefrontMediaController +
 *  the URL generation helper that produced the bad absolute URLs in the first
 *  place). Once the backend stops emitting localhost URLs AND already-persisted
 *  configs are repaired, this module can be deleted.
 * ──────────────────────────────────────────────────────────────────────────────
 */

const MEDIA_PATH_PATTERNS: RegExp[] = [
  /^\/api\/storage\//,
  /^\/api\/storefront\/media\//,
  /^\/storefront-media\//,
];

function isLocalhostHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function isMediaPath(pathname: string): boolean {
  return MEDIA_PATH_PATTERNS.some((re) => re.test(pathname));
}

/**
 * Resolve the public origin (scheme + host + optional port) that should
 * replace any localhost media host. Derived from STOREFRONT_API_URL.
 *
 * Returns `null` if STOREFRONT_API_URL is unset or unparseable — in that
 * case the rewrite is a no-op (e.g. local development with the local
 * config file: nothing to fix).
 */
export function getPublicMediaOrigin(): string | null {
  const apiUrl = process.env.STOREFRONT_API_URL;
  if (!apiUrl) return null;
  try {
    return new URL(apiUrl).origin;
  } catch {
    return null;
  }
}

/**
 * Rewrites a single string IF it is a media URL pointing at localhost,
 * or a relative media path that needs to be made absolute against the
 * public host. Any other input is returned unchanged.
 *
 * Exported for unit tests.
 */
export function rewriteMediaUrl(value: string, publicOrigin: string): string {
  if (!value) return value;

  // Absolute URL — only touch http(s)://
  if (/^https?:\/\//i.test(value)) {
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      return value;
    }
    if (isLocalhostHost(parsed.hostname) && isMediaPath(parsed.pathname)) {
      return `${publicOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    return value;
  }

  // Root-relative media path — prefix with the public origin so the browser
  // does not resolve it against the storefront's own host.
  if (value.startsWith("/") && isMediaPath(value)) {
    return `${publicOrigin}${value}`;
  }

  return value;
}

/**
 * Recursively walks any value (string / array / plain object) and applies
 * `rewriteMediaUrl` to every string it finds. Returns a new structure;
 * the input is not mutated.
 *
 * Exported for unit tests.
 */
export function walkAndRewrite<T>(value: T, publicOrigin: string): T {
  if (typeof value === "string") {
    return rewriteMediaUrl(value, publicOrigin) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => walkAndRewrite(v, publicOrigin)) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = walkAndRewrite(v, publicOrigin);
    }
    return out as unknown as T;
  }
  return value;
}

/**
 * Public entry point. Apply this to the validated config object once,
 * right after Zod parsing, in every config provider.
 *
 * No-op when no public origin can be derived (local-only development).
 */
export function normalizeMediaUrls<T>(config: T): T {
  const publicOrigin = getPublicMediaOrigin();
  if (!publicOrigin) return config;
  return walkAndRewrite(config, publicOrigin);
}
