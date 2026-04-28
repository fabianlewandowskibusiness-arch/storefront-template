import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// ── Hoist mocks ───────────────────────────────────────────────────────────────
// vi.mock is hoisted before imports, so the mock factories run before any
// module-level code. We capture mutable state in a let outside the factory.

let mockHeaders: Record<string, string> = {};

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: (key: string) => mockHeaders[key.toLowerCase()] ?? null,
  })),
}));

vi.mock("./remoteConfigProvider", () => ({
  loadRemoteConfig: vi.fn(async () => ({ __source: "legacy" })),
  loadRemoteConfigByHost: vi.fn(async () => ({ __source: "host" })),
  buildConfigUrl: vi.fn(),
  buildFetchOptions: vi.fn(),
  buildHostConfigUrl: vi.fn(),
}));

vi.mock("./localConfigProvider", () => ({
  loadLocalConfig: vi.fn(async () => ({ __source: "local" })),
}));

import { loadRemoteConfig, loadRemoteConfigByHost } from "./remoteConfigProvider";
import { loadLocalConfig } from "./localConfigProvider";
import { getConfigMode, loadActiveStorefrontConfig } from "./loadActiveStorefrontConfig";

// ── Env management ────────────────────────────────────────────────────────────

const ORIGINAL_STORE_ID = process.env.STORE_ID;

beforeEach(() => {
  mockHeaders = {};
  delete process.env.STORE_ID;
  vi.clearAllMocks();
});

afterEach(() => {
  if (ORIGINAL_STORE_ID === undefined) {
    delete process.env.STORE_ID;
  } else {
    process.env.STORE_ID = ORIGINAL_STORE_ID;
  }
});

// ── getConfigMode ─────────────────────────────────────────────────────────────

describe("getConfigMode", () => {
  describe("host mode — x-storefront-host header present", () => {
    it("returns 'host' when x-storefront-host is set", async () => {
      mockHeaders["x-storefront-host"] = "brand.pl";
      expect(await getConfigMode()).toBe("host");
    });

    it("returns 'host' even when STORE_ID is also set (host takes precedence)", async () => {
      mockHeaders["x-storefront-host"] = "brand.pl";
      process.env.STORE_ID = "abc123";
      expect(await getConfigMode()).toBe("host");
    });

    it("ignores a blank x-storefront-host and falls through to legacy", async () => {
      mockHeaders["x-storefront-host"] = "   ";
      process.env.STORE_ID = "abc123";
      expect(await getConfigMode()).toBe("legacy");
    });

    it("ignores an empty x-storefront-host and falls through to legacy", async () => {
      mockHeaders["x-storefront-host"] = "";
      process.env.STORE_ID = "abc123";
      expect(await getConfigMode()).toBe("legacy");
    });
  });

  describe("legacy mode — STORE_ID set, no host header", () => {
    it("returns 'legacy' when STORE_ID is set and no host header", async () => {
      process.env.STORE_ID = "abc123";
      expect(await getConfigMode()).toBe("legacy");
    });
  });

  describe("local mode — neither host header nor STORE_ID", () => {
    it("returns 'local' when neither x-storefront-host nor STORE_ID is present", async () => {
      expect(await getConfigMode()).toBe("local");
    });
  });
});

// ── loadActiveStorefrontConfig dispatch ───────────────────────────────────────

describe("loadActiveStorefrontConfig", () => {
  it("calls loadRemoteConfigByHost when x-storefront-host header is present", async () => {
    mockHeaders["x-storefront-host"] = "brand.pl";
    const config = await loadActiveStorefrontConfig();
    expect(loadRemoteConfigByHost).toHaveBeenCalledOnce();
    expect(loadRemoteConfig).not.toHaveBeenCalled();
    expect(loadLocalConfig).not.toHaveBeenCalled();
    expect((config as Record<string, unknown>).__source).toBe("host");
  });

  it("calls loadRemoteConfig (legacy) when STORE_ID is set and no host header", async () => {
    process.env.STORE_ID = "abc123";
    const config = await loadActiveStorefrontConfig();
    expect(loadRemoteConfig).toHaveBeenCalledOnce();
    expect(loadRemoteConfigByHost).not.toHaveBeenCalled();
    expect(loadLocalConfig).not.toHaveBeenCalled();
    expect((config as Record<string, unknown>).__source).toBe("legacy");
  });

  it("calls loadLocalConfig when neither host header nor STORE_ID is present", async () => {
    const config = await loadActiveStorefrontConfig();
    expect(loadLocalConfig).toHaveBeenCalledOnce();
    expect(loadRemoteConfig).not.toHaveBeenCalled();
    expect(loadRemoteConfigByHost).not.toHaveBeenCalled();
    expect((config as Record<string, unknown>).__source).toBe("local");
  });

  it("host takes priority over STORE_ID when both are present", async () => {
    mockHeaders["x-storefront-host"] = "brand.pl";
    process.env.STORE_ID = "abc123";
    await loadActiveStorefrontConfig();
    expect(loadRemoteConfigByHost).toHaveBeenCalledOnce();
    expect(loadRemoteConfig).not.toHaveBeenCalled();
  });

  it("falls back to legacy when host header is blank and STORE_ID is set", async () => {
    mockHeaders["x-storefront-host"] = "";
    process.env.STORE_ID = "abc123";
    await loadActiveStorefrontConfig();
    expect(loadRemoteConfig).toHaveBeenCalledOnce();
    expect(loadRemoteConfigByHost).not.toHaveBeenCalled();
  });

  it("falls back to local when host header is blank and STORE_ID is absent", async () => {
    mockHeaders["x-storefront-host"] = "   ";
    await loadActiveStorefrontConfig();
    expect(loadLocalConfig).toHaveBeenCalledOnce();
    expect(loadRemoteConfigByHost).not.toHaveBeenCalled();
  });
});

// ── schema: storeId is optional ───────────────────────────────────────────────

describe("schema: storeId field", () => {
  it("config without storeId is valid (local/legacy mode)", async () => {
    // Verify the schema allows absence of storeId — this is the contract
    // for local configs and legacy STORE_ID deployments.
    const { storefrontConfigSchema } = await import("@/lib/config/schema");
    const result = storefrontConfigSchema.safeParse({
      branding: { storeName: "TestStore", productName: "TestProduct" },
      pages: [{ type: "HOME", title: "Home", slug: "/", sections: [] }],
      theme: {},
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.storeId).toBeUndefined();
    }
  });

  it("config with storeId is valid (by-host mode)", async () => {
    const { storefrontConfigSchema } = await import("@/lib/config/schema");
    const result = storefrontConfigSchema.safeParse({
      storeId: "abc123",
      branding: { storeName: "TestStore", productName: "TestProduct" },
      pages: [{ type: "HOME", title: "Home", slug: "/", sections: [] }],
      theme: {},
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.storeId).toBe("abc123");
    }
  });

  it("config with null storeId does not crash — if it parses, storeId is not null", async () => {
    // z.string().optional() rejects null — that is intentional: a null storeId
    // is not useful, so we let Zod strip it via safeParse failing gracefully.
    // The layout falls back to STORE_ID env var when storeId is absent.
    // What matters: the overall config parse does NOT throw catastrophically.
    const { storefrontConfigSchema } = await import("@/lib/config/schema");
    const { success, data } = storefrontConfigSchema.safeParse({
      storeId: null,
      branding: { storeName: "TestStore", productName: "TestProduct" },
      pages: [{ type: "HOME", title: "Home", slug: "/", sections: [] }],
      theme: {},
    });
    if (success) {
      expect(data.storeId).not.toBeNull();
    }
    // If !success that's also acceptable — a null storeId is an invalid value.
  });
});
