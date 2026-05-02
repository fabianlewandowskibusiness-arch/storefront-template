import { describe, it, expect } from "vitest";
import { assertOriginOnly, joinApiUrl } from "./url";

// ─── assertOriginOnly ──────────────────────────────────────────────────────────

describe("assertOriginOnly", () => {
  describe("throws when URL ends with /api", () => {
    it.each([
      // Standard misconfiguration
      "https://api.ecommerce-flow.ai/api",
      // With trailing slash after /api
      "https://api.ecommerce-flow.ai/api/",
      // Multiple trailing slashes
      "https://api.ecommerce-flow.ai/api//",
      // localhost dev misconfiguration
      "http://localhost:8080/api",
      "http://localhost:8080/api/",
    ])('assertOriginOnly("%s") → throws', (url) => {
      expect(() => assertOriginOnly(url, "STOREFRONT_API_URL")).toThrow(
        /must not include the \/api path segment/,
      );
    });
  });

  describe("passes and returns clean URL for valid origin-only values", () => {
    it.each([
      // Already clean — returned as-is
      ["https://api.ecommerce-flow.ai", "https://api.ecommerce-flow.ai"],
      // Trailing slash stripped
      ["https://api.ecommerce-flow.ai/", "https://api.ecommerce-flow.ai"],
      // localhost clean
      ["http://localhost:8080", "http://localhost:8080"],
      ["http://localhost:8080/", "http://localhost:8080"],
      // /api in mid-path (not trailing segment) — accepted
      ["https://api.ecommerce-flow.ai/api/v2", "https://api.ecommerce-flow.ai/api/v2"],
      // Partial 'api' suffix — not the /api segment
      ["https://myapi.example.com", "https://myapi.example.com"],
    ] as [string, string][])('assertOriginOnly("%s") → "%s"', (input, expected) => {
      expect(assertOriginOnly(input, "STOREFRONT_API_URL")).toBe(expected);
    });
  });

  it("error message contains the env var name", () => {
    expect(() =>
      assertOriginOnly("https://api.ecommerce-flow.ai/api", "STOREFRONT_API_URL"),
    ).toThrow("STOREFRONT_API_URL");
  });

  it("error message contains the invalid value", () => {
    const url = "https://api.ecommerce-flow.ai/api";
    expect(() => assertOriginOnly(url, "STOREFRONT_API_URL")).toThrow(url);
  });

  it("whitespace is trimmed before checking", () => {
    // Surrounding whitespace must not prevent /api detection.
    expect(() =>
      assertOriginOnly("  https://api.ecommerce-flow.ai/api  ", "STOREFRONT_API_URL"),
    ).toThrow();
    expect(assertOriginOnly("  https://api.ecommerce-flow.ai  ", "STOREFRONT_API_URL")).toBe(
      "https://api.ecommerce-flow.ai",
    );
  });

  it("is idempotent — already-clean URL is returned unchanged", () => {
    const url = "https://api.ecommerce-flow.ai";
    expect(assertOriginOnly(url, "STOREFRONT_API_URL")).toBe(url);
    expect(
      assertOriginOnly(assertOriginOnly(url, "STOREFRONT_API_URL"), "STOREFRONT_API_URL"),
    ).toBe(url);
  });
});

// ─── joinApiUrl ────────────────────────────────────────────────────────────────

describe("joinApiUrl", () => {
  describe("joins origin and /api/... path correctly", () => {
    it.each([
      // Clean origin + /api path
      [
        "https://api.ecommerce-flow.ai",
        "/api/storefront-runtime/abc123",
        "https://api.ecommerce-flow.ai/api/storefront-runtime/abc123",
      ],
      // Trailing slash on origin is stripped
      [
        "https://api.ecommerce-flow.ai/",
        "/api/storefront-runtime/abc123",
        "https://api.ecommerce-flow.ai/api/storefront-runtime/abc123",
      ],
      // by-host lookup path
      [
        "https://api.ecommerce-flow.ai",
        "/api/storefront-runtime/by-host?host=brand.pl",
        "https://api.ecommerce-flow.ai/api/storefront-runtime/by-host?host=brand.pl",
      ],
      // Commerce handoff path
      [
        "https://api.ecommerce-flow.ai",
        "/api/storefront-runtime/abc123/commerce/handoff",
        "https://api.ecommerce-flow.ai/api/storefront-runtime/abc123/commerce/handoff",
      ],
      // localhost
      [
        "http://localhost:8080",
        "/api/storefront-runtime/by-host?host=localhost",
        "http://localhost:8080/api/storefront-runtime/by-host?host=localhost",
      ],
      // Path without leading slash — gets one added
      [
        "https://api.ecommerce-flow.ai",
        "api/storefront-runtime/abc123",
        "https://api.ecommerce-flow.ai/api/storefront-runtime/abc123",
      ],
    ] as [string, string, string][])(
      'joinApiUrl("%s", "%s") → "%s"',
      (origin, path, expected) => {
        expect(joinApiUrl(origin, path)).toBe(expected);
      },
    );
  });

  it("result never contains /api/api for origin-only bases", () => {
    const origins = [
      "https://api.ecommerce-flow.ai",
      "https://api.ecommerce-flow.ai/",
      "http://localhost:8080",
    ];
    const paths = [
      "/api/storefront-runtime/abc123",
      "/api/storefront-runtime/by-host?host=brand.pl",
      "/api/storefront-runtime/abc123/commerce/handoff",
    ];
    for (const origin of origins) {
      for (const path of paths) {
        expect(joinApiUrl(origin, path)).not.toContain("/api/api");
      }
    }
  });

  // ── /ecf-ping scenario ────────────────────────────────────────────────────

  it("ecf-ping by-host URL hits /api/storefront-runtime/by-host", () => {
    const origin = assertOriginOnly(
      "https://api.ecommerce-flow.ai",
      "STOREFRONT_API_URL",
    );
    const host = "store-abc123.test-storefront.ecommerceflow.io";
    const url = joinApiUrl(
      origin,
      `/api/storefront-runtime/by-host?host=${encodeURIComponent(host)}`,
    );

    expect(url).toBe(
      `https://api.ecommerce-flow.ai/api/storefront-runtime/by-host?host=${encodeURIComponent(host)}`,
    );
    expect(url).toContain("/api/storefront-runtime/by-host");
    expect(url).not.toContain("/api/api");
  });

  it("ecf-ping URL contains exactly one /api/ segment before storefront-runtime", () => {
    const origin = assertOriginOnly(
      "https://api.ecommerce-flow.ai",
      "STOREFRONT_API_URL",
    );
    const url = joinApiUrl(
      origin,
      `/api/storefront-runtime/by-host?host=brand.pl`,
    );
    // Split on /api/storefront-runtime — there must be exactly one occurrence.
    const parts = url.split("/api/storefront-runtime");
    expect(parts).toHaveLength(2);
  });

  // ── env with /api suffix → assertOriginOnly rejects before joinApiUrl runs ─

  it("env var ending in /api is rejected before URL construction", () => {
    const misconfigured = "https://api.ecommerce-flow.ai/api";
    expect(() => {
      const origin = assertOriginOnly(misconfigured, "STOREFRONT_API_URL"); // throws here
      joinApiUrl(origin, "/api/storefront-runtime/by-host?host=brand.pl"); // never reached
    }).toThrow(/must not include the \/api path segment/);
  });

  // ── loadRemoteConfig / buildConfigUrl scenario ─────────────────────────────

  it("config fetch URL for a storeId includes /api/storefront-runtime", () => {
    const origin = assertOriginOnly(
      "https://api.ecommerce-flow.ai",
      "STOREFRONT_API_URL",
    );
    const storeId = "abc-123";
    const url = joinApiUrl(origin, `/api/storefront-runtime/${storeId}`);

    expect(url).toBe(`https://api.ecommerce-flow.ai/api/storefront-runtime/${storeId}`);
    expect(url).not.toContain("/api/api");
  });

  // ── commerce handoff scenario ──────────────────────────────────────────────

  it("commerce handoff URL includes /api/storefront-runtime and storeId", () => {
    const origin = assertOriginOnly(
      "https://api.ecommerce-flow.ai",
      "STOREFRONT_API_URL",
    );
    const storeId = "pipeline-session-uuid";
    const url = joinApiUrl(
      origin,
      `/api/storefront-runtime/${storeId}/commerce/handoff`,
    );

    expect(url).toBe(
      `https://api.ecommerce-flow.ai/api/storefront-runtime/${storeId}/commerce/handoff`,
    );
    expect(url).not.toContain("/api/api");
  });
});
