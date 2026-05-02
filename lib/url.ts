/**
 * Backend API URL utilities for storefront-template.
 *
 * CONVENTION
 * ----------
 * STOREFRONT_API_URL must be set as ORIGIN ONLY — no /api suffix, ever.
 * API paths (/api/...) are ALWAYS appended by code using joinApiUrl().
 *
 *   Correct:   STOREFRONT_API_URL=https://api.ecommerce-flow.ai    ✓
 *   Incorrect: STOREFRONT_API_URL=https://api.ecommerce-flow.ai/api ✗ (throws)
 *
 * FUNCTIONS
 * ---------
 *   assertOriginOnly(value, envName) — validates URL is origin-only; throws if
 *                                      /api suffix is present. Returns the clean URL.
 *   joinApiUrl(origin, path)         — joins an origin with an /api/... path.
 */

/**
 * Validates that `value` is an origin-only backend URL (no `/api` path suffix).
 *
 * Strips trailing slashes and whitespace before checking. Throws if the result
 * ends with `/api` — this is a misconfiguration that must be fixed in the env
 * var, not silently corrected by code.
 *
 * Returns the URL with trailing slashes and whitespace stripped.
 *
 * @param value   The env var value to validate (e.g. process.env.STOREFRONT_API_URL).
 * @param envName The env var name used in the error message (e.g. "STOREFRONT_API_URL").
 * @throws Error when value ends with `/api` after stripping trailing slashes.
 *
 * @example
 *   assertOriginOnly("https://api.ecommerce-flow.ai",      "STOREFRONT_API_URL") // ✓ returns clean URL
 *   assertOriginOnly("https://api.ecommerce-flow.ai/",     "STOREFRONT_API_URL") // ✓ strips trailing slash
 *   assertOriginOnly("http://localhost:8080",              "STOREFRONT_API_URL") // ✓
 *   assertOriginOnly("https://api.ecommerce-flow.ai/api",  "STOREFRONT_API_URL") // ✗ throws
 *   assertOriginOnly("http://localhost:8080/api",          "STOREFRONT_API_URL") // ✗ throws
 */
export function assertOriginOnly(value: string, envName: string): string {
  const result = value.trim().replace(/\/+$/, "");
  if (result.endsWith("/api")) {
    throw new Error(
      `${envName} must not include the /api path segment. ` +
        `Set it to the origin only — e.g. https://api.ecommerce-flow.ai ` +
        `(not https://api.ecommerce-flow.ai/api). ` +
        `Current value: "${value.trim()}"`,
    );
  }
  return result;
}

/**
 * Joins a backend origin URL with an API path, producing a well-formed URL.
 *
 * - Strips trailing slashes from `origin`.
 * - Ensures `path` starts with `/`.
 *
 * The `origin` MUST be an origin-only value (no `/api` suffix).
 * Always pass the result of `assertOriginOnly()` as the origin.
 *
 * @example
 *   joinApiUrl("https://api.ecommerce-flow.ai", "/api/storefront-runtime/abc123")
 *   // → "https://api.ecommerce-flow.ai/api/storefront-runtime/abc123"
 *
 *   joinApiUrl("https://api.ecommerce-flow.ai/", "/api/storefront-runtime/by-host?host=brand.pl")
 *   // → "https://api.ecommerce-flow.ai/api/storefront-runtime/by-host?host=brand.pl"
 *
 *   joinApiUrl("http://localhost:8080", "/api/storefront-runtime/abc123/commerce/handoff")
 *   // → "http://localhost:8080/api/storefront-runtime/abc123/commerce/handoff"
 */
export function joinApiUrl(origin: string, path: string): string {
  const base = origin.trim().replace(/\/+$/, "");
  const p = path.trim();
  return base + (p.startsWith("/") ? p : `/${p}`);
}
