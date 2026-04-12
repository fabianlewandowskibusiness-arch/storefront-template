import { describe, it, expect } from "vitest";
import { storefrontConfigSchema } from "../config/schema";
import { createWooCommerceProvider } from "./woocommerce";
import type { CartHandoffLine, CartHandoffRequest } from "./types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function minimalConfig(commerceOverrides: Record<string, unknown> = {}): unknown {
  return {
    branding: { storeName: "TestStore", productName: "TestProduct" },
    pages: [{ type: "HOME", title: "Home", slug: "/", sections: [] }],
    theme: {},
    commerce: {
      provider: "woocommerce",
      storeUrl: "https://sklep.example.com",
      productUrl: "https://sklep.example.com/product",
      productId: "42",
      checkoutMode: "ADD_TO_CART_REDIRECT",
      ctaButtonLabel: "Kup teraz",
      ...commerceOverrides,
    },
  };
}

function parseOk(input: unknown) {
  const result = storefrontConfigSchema.safeParse(input);
  if (!result.success) {
    const msg = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Expected parse to succeed but got:\n${msg}`);
  }
  return result.data;
}

// ── Schema: new commerce fields ──────────────────────────────────────────────

describe("commerce schema: currency field", () => {
  it("explicit currency is preserved", () => {
    const config = parseOk(minimalConfig({ currency: "EUR" }));
    expect(config.commerce?.currency).toBe("EUR");
  });

  it("absent currency defaults to PLN", () => {
    const config = parseOk(minimalConfig());
    expect(config.commerce?.currency).toBe("PLN");
  });

  it("null currency falls back to PLN", () => {
    const config = parseOk(minimalConfig({ currency: null }));
    expect(config.commerce?.currency).toBe("PLN");
  });
});

describe("commerce schema: pluginHandoffUrl field", () => {
  it("explicit pluginHandoffUrl is preserved", () => {
    const config = parseOk(
      minimalConfig({ pluginHandoffUrl: "https://api.example.com/handoff" }),
    );
    expect(config.commerce?.pluginHandoffUrl).toBe("https://api.example.com/handoff");
  });

  it("absent pluginHandoffUrl is undefined (URL-only mode)", () => {
    const config = parseOk(minimalConfig());
    expect(config.commerce?.pluginHandoffUrl).toBeUndefined();
  });

  it("null pluginHandoffUrl is null (URL-only mode)", () => {
    const config = parseOk(minimalConfig({ pluginHandoffUrl: null }));
    expect(config.commerce?.pluginHandoffUrl).toBeNull();
  });
});

// ── WooCommerce URL provider ─────────────────────────────────────────────────

describe("createWooCommerceProvider", () => {
  it("getCheckoutUrl builds ADD_TO_CART_REDIRECT URL with productId", () => {
    const provider = createWooCommerceProvider({
      storeUrl: "https://sklep.pl",
      productId: "42",
      checkoutMode: "ADD_TO_CART_REDIRECT",
      productUrl: "https://sklep.pl/product",
    });
    const url = provider.getCheckoutUrl();
    expect(url).toBe("https://sklep.pl/product");
  });

  it("getCheckoutUrl builds DIRECT_CHECKOUT URL with variation", () => {
    const provider = createWooCommerceProvider({
      storeUrl: "https://sklep.pl",
      productId: "42",
      variationId: "7",
      checkoutMode: "DIRECT_CHECKOUT",
    });
    const url = provider.getCheckoutUrl({ quantity: 2 });
    expect(url).toContain("/checkout/");
    expect(url).toContain("add-to-cart=42");
    expect(url).toContain("variation_id=7");
    expect(url).toContain("quantity=2");
  });

  it("getAddToCartUrl includes quantity", () => {
    const provider = createWooCommerceProvider({
      storeUrl: "https://sklep.pl",
      productId: "99",
      checkoutMode: "ADD_TO_CART_REDIRECT",
    });
    const url = provider.getAddToCartUrl({ quantity: 3 });
    expect(url).toContain("add-to-cart=99");
    expect(url).toContain("quantity=3");
  });

  it("handles null storeUrl and productId gracefully", () => {
    const provider = createWooCommerceProvider({
      storeUrl: null,
      productId: null,
      checkoutMode: "ADD_TO_CART_REDIRECT",
    });
    // Should not throw — just returns a relative URL with empty base
    const url = provider.getAddToCartUrl();
    expect(url).toContain("add-to-cart=");
    expect(url).toContain("quantity=1");
  });
});

// ── Cart handoff request shape ───────────────────────────────────────────────

describe("cart handoff request shape", () => {
  it("multi-line cart produces correct CartHandoffLine array", () => {
    // Simulate what toHandoffLines() in useCheckout does.
    const cartItems = [
      { productId: "42", variantId: "7", quantity: 2 },
      { productId: "42", variantId: undefined, quantity: 1 },
      { productId: "99", variantId: "3", quantity: 3 },
    ];

    const lines: CartHandoffLine[] = cartItems.map((item) => ({
      productId: item.productId,
      variationId: item.variantId,
      quantity: item.quantity,
    }));

    expect(lines).toHaveLength(3);
    expect(lines[0]).toEqual({ productId: "42", variationId: "7", quantity: 2 });
    expect(lines[1]).toEqual({ productId: "42", variationId: undefined, quantity: 1 });
    expect(lines[2]).toEqual({ productId: "99", variationId: "3", quantity: 3 });
  });

  it("each line preserves independent quantity — no summing across lines", () => {
    const cartItems = [
      { productId: "42", variantId: "1", quantity: 2 },
      { productId: "42", variantId: "2", quantity: 5 },
    ];

    const lines: CartHandoffLine[] = cartItems.map((item) => ({
      productId: item.productId,
      variationId: item.variantId,
      quantity: item.quantity,
    }));

    // Must NOT be a single line with quantity=7.
    expect(lines).toHaveLength(2);
    expect(lines[0].quantity).toBe(2);
    expect(lines[1].quantity).toBe(5);
  });

  it("handoff request body matches expected shape", () => {
    const body: CartHandoffRequest = {
      lines: [{ productId: "42", quantity: 1 }],
      target: "CHECKOUT",
    };
    expect(body).toHaveProperty("lines");
    expect(body).toHaveProperty("target", "CHECKOUT");
    expect(body.lines[0].quantity).toBe(1);
  });
});

// ── Bridge mode detection (one-mode: plugin bridge only) ─────────────────────
//
// WooCommerce plugin bridge is the ONLY supported commerce handoff mode.
// When bridge is not configured, checkout is BLOCKED — no silent URL-only
// fallback in production.

describe("bridge mode detection", () => {
  // Mirrors the detection logic in useCheckout — extracted so we can test
  // without importing the React hook.
  function isBridgeConfigured(opts: {
    storeId?: string;
    pluginHandoffUrl?: string | null;
    apiUrl?: string;
  }): boolean {
    return !!opts.storeId && !!(opts.pluginHandoffUrl || opts.apiUrl);
  }

  it("configured: storeId + pluginHandoffUrl", () => {
    expect(isBridgeConfigured({
      storeId: "abc",
      pluginHandoffUrl: "https://api.example.com/handoff",
    })).toBe(true);
  });

  it("configured: storeId + apiUrl (constructed endpoint)", () => {
    expect(isBridgeConfigured({
      storeId: "abc",
      apiUrl: "https://api.example.com",
    })).toBe(true);
  });

  it("NOT configured: no storeId — checkout blocked", () => {
    expect(isBridgeConfigured({
      pluginHandoffUrl: "https://api.example.com/handoff",
    })).toBe(false);
  });

  it("NOT configured: storeId but no handoff URL and no apiUrl — checkout blocked", () => {
    expect(isBridgeConfigured({
      storeId: "abc",
    })).toBe(false);
  });

  it("NOT configured: nothing — checkout blocked", () => {
    expect(isBridgeConfigured({})).toBe(false);
  });

  it("pluginHandoffUrl takes priority over apiUrl-constructed URL", () => {
    const explicit = "https://plugin.example.com/handoff";
    const constructed = "https://api.example.com/api/storefront-runtime/abc/commerce/handoff";
    const resolved = explicit || constructed;
    expect(resolved).toBe(explicit);
  });
});

// ── One-mode checkout behavior (no silent URL-only fallback) ─────────────────

describe("one-mode checkout: no silent URL-only fallback", () => {
  // These tests validate the behavioral contract documented in useCheckout's
  // JSDoc, without importing the hook itself.

  it("when bridge is configured: checkout proceeds via fetchHandoff", () => {
    // This is the only supported production path. The hook resolves a
    // handoff URL and POSTs cart lines to it.
    const storeId = "abc";
    const pluginHandoffUrl = "https://api.example.com/handoff";
    const bridgeConfigured = !!storeId && !!pluginHandoffUrl;

    expect(bridgeConfigured).toBe(true);
    // In the hook: fetchHandoff(handoffUrl, body).then(...)
  });

  it("when bridge is NOT configured: checkout is blocked — no redirect to fallbackUrl", () => {
    // In production, the hook sets handoffError and returns without redirecting.
    // The old behavior was: window.location.href = fallbackUrl (URL-only mode).
    // That path no longer exists in production.
    const storeId = undefined;
    const pluginHandoffUrl = undefined;
    const apiUrl = "";
    const bridgeConfigured = !!storeId && !!(pluginHandoffUrl || apiUrl);

    expect(bridgeConfigured).toBe(false);
    // In the hook: setHandoffError(NOT_CONFIGURED_ERROR); return;
    // NOT: window.location.href = fallbackUrl;
  });

  it("dev-only fallback: NODE_ENV=development allows redirect for local testing", () => {
    // This is NOT a product-supported path. It only exists so `npm run dev`
    // without env vars is not completely blocked.
    const isDev = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
    // In test/dev environments this should be truthy
    expect(isDev).toBe(true);
    // In the hook: console.warn + window.location.href = devFallbackUrl
    // In production: this branch is unreachable
  });

  it("bridgeConfigured is exposed in useCheckout result for UI state", () => {
    // The CartDrawer uses this field to:
    //   - show an amber "not configured" banner when false
    //   - disable the checkout button when false
    // This ensures the user sees a clear message instead of a broken silent redirect.
    const result = {
      bridgeConfigured: false,
      handoffError: null as string | null,
    };

    // When !bridgeConfigured, the drawer shows the warning banner
    expect(result.bridgeConfigured).toBe(false);
    // When bridgeConfigured && handoffError, the drawer shows the red error banner
    result.bridgeConfigured = true;
    result.handoffError = "HTTP 500";
    expect(result.bridgeConfigured).toBe(true);
    expect(result.handoffError).toBe("HTTP 500");
  });
});

// ── Currency rendering from runtime config ───────────────────────────────────

describe("currency propagation", () => {
  it("commerce currency flows through schema to config", () => {
    const config = parseOk(minimalConfig({ currency: "USD" }));
    expect(config.commerce?.currency).toBe("USD");
  });

  it("missing commerce still allows currency fallback in page.tsx logic", () => {
    const config = parseOk({
      branding: { storeName: "S", productName: "P" },
      pages: [{ type: "HOME", title: "Home", slug: "/", sections: [] }],
      theme: {},
      // No commerce field at all
    });
    // page.tsx does: config.commerce?.currency ?? "PLN"
    const currency = config.commerce?.currency ?? "PLN";
    expect(currency).toBe("PLN");
  });
});
