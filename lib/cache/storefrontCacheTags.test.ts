import { describe, it, expect } from "vitest";
import { storefrontConfigTag, storefrontHostConfigTag } from "./storefrontCacheTags";

// ── storefrontConfigTag ───────────────────────────────────────────────────────

describe("storefrontConfigTag", () => {
  it("returns the expected prefix + storeId", () => {
    expect(storefrontConfigTag("abc123")).toBe("storefront-config:abc123");
  });

  it("lowercases the storeId for consistent lookup", () => {
    expect(storefrontConfigTag("ABC123")).toBe("storefront-config:abc123");
    expect(storefrontConfigTag("MixedCase")).toBe("storefront-config:mixedcase");
  });

  it("trims leading and trailing whitespace", () => {
    expect(storefrontConfigTag("  abc123  ")).toBe("storefront-config:abc123");
  });

  it("different storeIds produce different tags (tenant isolation)", () => {
    const tagA = storefrontConfigTag("store-a");
    const tagB = storefrontConfigTag("store-b");
    expect(tagA).not.toBe(tagB);
  });

  it("is deterministic — same input always produces the same tag", () => {
    expect(storefrontConfigTag("abc123")).toBe(storefrontConfigTag("abc123"));
  });

  it("total tag length never exceeds 256 characters (Next.js limit)", () => {
    const veryLongId = "x".repeat(300);
    const tag = storefrontConfigTag(veryLongId);
    expect(tag.length).toBeLessThanOrEqual(256);
  });

  it("handles storeId that is exactly the maximum safe length", () => {
    const prefix = "storefront-config:";
    const maxValue = "a".repeat(256 - prefix.length);
    const tag = storefrontConfigTag(maxValue);
    expect(tag.length).toBe(256);
  });
});

// ── storefrontHostConfigTag ───────────────────────────────────────────────────

describe("storefrontHostConfigTag", () => {
  it("returns the expected prefix + host", () => {
    expect(storefrontHostConfigTag("brand.pl")).toBe("storefront-host:brand.pl");
  });

  it("lowercases the host for consistent lookup", () => {
    expect(storefrontHostConfigTag("Brand.PL")).toBe("storefront-host:brand.pl");
    expect(storefrontHostConfigTag("STORE.Ecommerce-Flow.AI")).toBe(
      "storefront-host:store.ecommerce-flow.ai",
    );
  });

  it("trims leading and trailing whitespace", () => {
    expect(storefrontHostConfigTag("  brand.pl  ")).toBe("storefront-host:brand.pl");
  });

  it("different hosts produce different tags (tenant isolation)", () => {
    const tagA = storefrontHostConfigTag("store-a.ecommerce-flow.ai");
    const tagB = storefrontHostConfigTag("store-b.ecommerce-flow.ai");
    expect(tagA).not.toBe(tagB);
  });

  it("is deterministic — same input always produces the same tag", () => {
    expect(storefrontHostConfigTag("brand.pl")).toBe(storefrontHostConfigTag("brand.pl"));
  });

  it("total tag length never exceeds 256 characters (Next.js limit)", () => {
    const veryLongHost = "a".repeat(300) + ".example.com";
    const tag = storefrontHostConfigTag(veryLongHost);
    expect(tag.length).toBeLessThanOrEqual(256);
  });

  it("subdomain and custom domain produce different tags", () => {
    const subdomain = storefrontHostConfigTag("mystore.ecommerce-flow.ai");
    const custom = storefrontHostConfigTag("mystore.com");
    expect(subdomain).not.toBe(custom);
  });
});

// ── Tag prefix separation ─────────────────────────────────────────────────────

describe("tag prefix isolation", () => {
  it("config tag and host tag for same identifier are different", () => {
    // Even if storeId and hostname happen to be the same string,
    // the two tag types must produce different tags to avoid cross-invalidation.
    const sameValue = "mystore";
    expect(storefrontConfigTag(sameValue)).not.toBe(storefrontHostConfigTag(sameValue));
  });

  it("config tag always starts with 'storefront-config:'", () => {
    expect(storefrontConfigTag("abc")).toMatch(/^storefront-config:/);
  });

  it("host tag always starts with 'storefront-host:'", () => {
    expect(storefrontHostConfigTag("abc.com")).toMatch(/^storefront-host:/);
  });
});
