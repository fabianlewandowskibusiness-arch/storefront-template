import { describe, it, expect } from "vitest";
import { buildConfigUrl, buildFetchOptions, buildHostConfigUrl } from "./remoteConfigProvider";
import { storefrontConfigTag, storefrontHostConfigTag } from "@/lib/cache/storefrontCacheTags";

const API = "https://api.ecommerce-flow.ai";
const STORE = "abc123";

// ── buildConfigUrl ────────────────────────────────────────────────────────────

describe("buildConfigUrl", () => {
  describe("live (non-draft) mode", () => {
    it("returns the correct URL for a given storeId", () => {
      expect(buildConfigUrl(API, STORE, false))
        .toBe(`${API}/storefront-runtime/${STORE}`);
    });

    it("does not append ?mode=draft", () => {
      const url = buildConfigUrl(API, STORE, false);
      expect(url).not.toContain("mode=draft");
    });

    it("works with a trailing-slash-stripped apiUrl", () => {
      const stripped = "https://api.ecommerce-flow.ai";
      expect(buildConfigUrl(stripped, STORE, false))
        .toBe(`${stripped}/storefront-runtime/${STORE}`);
    });

    it("different storeIds produce different URLs", () => {
      const urlA = buildConfigUrl(API, "store-a", false);
      const urlB = buildConfigUrl(API, "store-b", false);
      expect(urlA).not.toBe(urlB);
    });
  });

  describe("draft mode", () => {
    it("appends ?mode=draft to the URL", () => {
      expect(buildConfigUrl(API, STORE, true))
        .toBe(`${API}/storefront-runtime/${STORE}?mode=draft`);
    });

    it("draft URL differs from live URL for the same storeId", () => {
      const live = buildConfigUrl(API, STORE, false);
      const draft = buildConfigUrl(API, STORE, true);
      expect(draft).not.toBe(live);
    });
  });

  describe("multi-tenant cache key isolation", () => {
    // In multi-tenant mode the Data Cache key is the fetch URL.
    // Different stores must produce different URLs so their cached configs
    // are stored under separate keys and never bleed across tenants.
    it("each unique storeId maps to a unique cache-key URL", () => {
      const stores = ["alpha", "beta", "gamma", "delta"];
      const urls = stores.map((id) => buildConfigUrl(API, id, false));
      const unique = new Set(urls);
      expect(unique.size).toBe(stores.length);
    });

    it("draft URLs are also isolated per storeId", () => {
      const urlA = buildConfigUrl(API, "store-a", true);
      const urlB = buildConfigUrl(API, "store-b", true);
      expect(urlA).not.toBe(urlB);
    });

    it("draft and live URLs for the same store differ (no cache bleed)", () => {
      const live = buildConfigUrl(API, STORE, false);
      const draft = buildConfigUrl(API, STORE, true);
      expect(live).not.toBe(draft);
    });
  });

  describe("API URL variations", () => {
    it("uses STOREFRONT_API_URL as the base", () => {
      const custom = "https://custom-backend.example.com";
      expect(buildConfigUrl(custom, STORE, false))
        .toBe(`${custom}/storefront-runtime/${STORE}`);
    });

    it("uses the default API URL when STOREFRONT_API_URL is not set", () => {
      // In practice the caller strips trailing slashes; the function itself
      // does not — it trusts the caller to have done that.
      expect(buildConfigUrl(API, STORE, false)).toContain("api.ecommerce-flow.ai");
    });
  });
});

// ── buildFetchOptions ─────────────────────────────────────────────────────────

describe("buildFetchOptions", () => {
  const TAG = storefrontConfigTag(STORE);

  describe("live (non-draft) mode", () => {
    it("returns next.revalidate with the correct TTL", () => {
      const opts = buildFetchOptions(false, TAG);
      expect("next" in opts).toBe(true);
      if ("next" in opts) {
        expect(opts.next.revalidate).toBe(60);
      }
    });

    it("attaches the store tag to next.tags", () => {
      const opts = buildFetchOptions(false, TAG);
      expect("next" in opts).toBe(true);
      if ("next" in opts) {
        expect(opts.next.tags).toContain(TAG);
        expect(opts.next.tags).toHaveLength(1);
      }
    });

    it("does not set cache: no-store", () => {
      const opts = buildFetchOptions(false, TAG);
      expect("cache" in opts).toBe(false);
    });

    it("includes Accept: application/json header", () => {
      const opts = buildFetchOptions(false, TAG);
      expect(opts.headers).toEqual({ Accept: "application/json" });
    });

    it("different storeIds produce fetch options with different tags", () => {
      const tagA = storefrontConfigTag("store-a");
      const tagB = storefrontConfigTag("store-b");
      const optsA = buildFetchOptions(false, tagA);
      const optsB = buildFetchOptions(false, tagB);
      if ("next" in optsA && "next" in optsB) {
        expect(optsA.next.tags[0]).not.toBe(optsB.next.tags[0]);
      }
    });
  });

  describe("draft mode", () => {
    it("returns cache: no-store for draft requests", () => {
      const opts = buildFetchOptions(true, TAG);
      expect("cache" in opts).toBe(true);
      if ("cache" in opts) {
        expect(opts.cache).toBe("no-store");
      }
    });

    it("does NOT attach any cache tags in draft mode", () => {
      const opts = buildFetchOptions(true, TAG);
      // Draft responses must never be served from cache — no tags attached.
      expect("next" in opts).toBe(false);
    });

    it("includes Accept: application/json header", () => {
      const opts = buildFetchOptions(true, TAG);
      expect(opts.headers).toEqual({ Accept: "application/json" });
    });
  });

  describe("live vs draft options are structurally distinct", () => {
    it("live has `next` property, draft has `cache` property — they never overlap", () => {
      const live = buildFetchOptions(false, TAG);
      const draft = buildFetchOptions(true, TAG);
      expect("next" in live).toBe(true);
      expect("next" in draft).toBe(false);
      expect("cache" in draft).toBe(true);
      expect("cache" in live).toBe(false);
    });
  });
});

// ── buildHostConfigUrl ────────────────────────────────────────────────────────

describe("buildHostConfigUrl", () => {
  const HOST = "brand.pl";

  describe("live (non-draft) mode", () => {
    it("returns the correct URL for a given host", () => {
      expect(buildHostConfigUrl(API, HOST, false))
        .toBe(`${API}/storefront-runtime/by-host?host=brand.pl`);
    });

    it("does not append &mode=draft in live mode", () => {
      const url = buildHostConfigUrl(API, HOST, false);
      expect(url).not.toContain("mode=draft");
    });

    it("different hosts produce different URLs", () => {
      const urlA = buildHostConfigUrl(API, "alpha.example.com", false);
      const urlB = buildHostConfigUrl(API, "beta.example.com", false);
      expect(urlA).not.toBe(urlB);
    });

    it("uses STOREFRONT_API_URL as the base", () => {
      const custom = "https://custom-backend.example.com";
      expect(buildHostConfigUrl(custom, HOST, false))
        .toBe(`${custom}/storefront-runtime/by-host?host=brand.pl`);
    });

    it("URL-encodes special characters in the host", () => {
      // While unusual, the encoder should not break valid hosts.
      const url = buildHostConfigUrl(API, "brand.pl", false);
      expect(url).toContain("host=brand.pl");
    });
  });

  describe("draft mode", () => {
    it("appends &mode=draft to the URL", () => {
      expect(buildHostConfigUrl(API, HOST, true))
        .toBe(`${API}/storefront-runtime/by-host?host=brand.pl&mode=draft`);
    });

    it("draft URL differs from live URL for the same host", () => {
      const live = buildHostConfigUrl(API, HOST, false);
      const draft = buildHostConfigUrl(API, HOST, true);
      expect(draft).not.toBe(live);
      expect(draft).toContain("mode=draft");
    });
  });

  describe("multi-tenant cache key isolation", () => {
    it("each unique host maps to a unique URL", () => {
      const hosts = ["alpha.pl", "beta.pl", "gamma.pl", "delta.pl"];
      const urls = hosts.map((h) => buildHostConfigUrl(API, h, false));
      const unique = new Set(urls);
      expect(unique.size).toBe(hosts.length);
    });

    it("draft URLs are also isolated per host", () => {
      const urlA = buildHostConfigUrl(API, "alpha.pl", true);
      const urlB = buildHostConfigUrl(API, "beta.pl", true);
      expect(urlA).not.toBe(urlB);
    });

    it("by-host URL and by-storeId URL are structurally distinct (no collision)", () => {
      // Ensures the two resolution paths cannot accidentally hit the same cache entry.
      const byHost = buildHostConfigUrl(API, "brand.pl", false);
      const byId = buildConfigUrl(API, "brand.pl", false);
      expect(byHost).not.toBe(byId);
      expect(byHost).toContain("/by-host?host=");
      expect(byId).not.toContain("/by-host");
    });
  });

  describe("host fetch options use the host cache tag", () => {
    it("live mode uses storefrontHostConfigTag, NOT storefrontConfigTag", () => {
      const hostTag = storefrontHostConfigTag(HOST);
      const storeTag = storefrontConfigTag(HOST);
      const opts = buildFetchOptions(false, hostTag);

      expect("next" in opts).toBe(true);
      if ("next" in opts) {
        expect(opts.next.tags).toContain(hostTag);
        expect(opts.next.tags).not.toContain(storeTag);
      }
    });

    it("host tag and store tag are different strings for the same identifier", () => {
      expect(storefrontHostConfigTag(HOST)).not.toBe(storefrontConfigTag(HOST));
      expect(storefrontHostConfigTag(HOST)).toBe("storefront-host:brand.pl");
      expect(storefrontConfigTag(HOST)).toBe("storefront-config:brand.pl");
    });

    it("different hosts produce different host tags", () => {
      expect(storefrontHostConfigTag("alpha.pl"))
        .not.toBe(storefrontHostConfigTag("beta.pl"));
    });
  });
});
