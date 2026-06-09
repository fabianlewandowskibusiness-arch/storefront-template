import { describe, it, expect } from "vitest";
import { mapOfferBundlesToPackages, bundleMappingValid } from "./offerBundles";
import type { OfferBundle } from "@/types/storefront";

function bundle(overrides: Partial<OfferBundle> = {}): OfferBundle {
  return {
    id: "b1",
    label: "Zestaw 2 szt.",
    quantity: 1,
    price: 27900,
    currency: "PLN",
    compareAtPrice: 29800,
    savingsLabel: "oszczędzasz 19 zł",
    badge: null,
    isDefault: true,
    visible: true,
    bundleMode: "VARIATION",
    wooProductId: "123",
    wooVariationId: "457",
    ...overrides,
  };
}

describe("bundleMappingValid", () => {
  it("VARIATION requires productId + variationId", () => {
    expect(bundleMappingValid(bundle({ wooProductId: "1", wooVariationId: "2" }))).toBe(true);
    expect(bundleMappingValid(bundle({ wooProductId: "1", wooVariationId: null }))).toBe(false);
    expect(bundleMappingValid(bundle({ wooProductId: null, wooVariationId: "2" }))).toBe(false);
  });

  it("SEPARATE_PRODUCT / QUANTITY require only productId", () => {
    expect(bundleMappingValid(bundle({ bundleMode: "SEPARATE_PRODUCT", wooProductId: "9", wooVariationId: null }))).toBe(true);
    expect(bundleMappingValid(bundle({ bundleMode: "QUANTITY", wooProductId: "9", wooVariationId: null }))).toBe(true);
    expect(bundleMappingValid(bundle({ bundleMode: "SEPARATE_PRODUCT", wooProductId: null }))).toBe(false);
  });
});

describe("mapOfferBundlesToPackages", () => {
  it("converts minor units to major for display only", () => {
    const [p] = mapOfferBundlesToPackages([bundle({ price: 14900, compareAtPrice: 19900 })]);
    expect(p.price).toBe(149);
    expect(p.comparePrice).toBe(199);
  });

  it("VARIATION carries productId + variationId and is valid", () => {
    const [p] = mapOfferBundlesToPackages([
      bundle({ bundleMode: "VARIATION", wooProductId: "123", wooVariationId: "457" }),
    ]);
    expect(p.productId).toBe("123");
    expect(p.variationId).toBe("457");
    expect(p.mappingValid).toBe(true);
  });

  it("SEPARATE_PRODUCT uses its productId and never inherits a variation", () => {
    const [p] = mapOfferBundlesToPackages([
      bundle({ bundleMode: "SEPARATE_PRODUCT", wooProductId: "555", wooVariationId: "999" }),
    ]);
    expect(p.productId).toBe("555");
    expect(p.variationId).toBeUndefined();
    expect(p.mappingValid).toBe(true);
  });

  it("QUANTITY carries productId + quantity, no variation", () => {
    const [p] = mapOfferBundlesToPackages([
      bundle({ bundleMode: "QUANTITY", wooProductId: "42", quantity: 3, wooVariationId: null }),
    ]);
    expect(p.productId).toBe("42");
    expect(p.quantity).toBe(3);
    expect(p.variationId).toBeUndefined();
  });

  it("badge renders per bundle, independent of default/selection", () => {
    const [a, b] = mapOfferBundlesToPackages([
      bundle({ id: "a", isDefault: true, badge: "BESTSELLER" }),
      bundle({ id: "b", isDefault: false, badge: "MAKSYMALNA OSZCZĘDNOŚĆ" }),
    ]);
    // Default option keeps its own badge...
    expect(a.defaultSelected).toBe(true);
    expect(a.badge).toBe("BESTSELLER");
    // ...and a NON-default option also keeps its badge (the original bug).
    expect(b.defaultSelected).toBe(false);
    expect(b.badge).toBe("MAKSYMALNA OSZCZĘDNOŚĆ");
  });

  it("multiple bundles each keep their distinct badge", () => {
    const pkgs = mapOfferBundlesToPackages([
      bundle({ id: "1", badge: "BESTSELLER" }),
      bundle({ id: "2", badge: "NAJLEPSZA CENA" }),
      bundle({ id: "3", badge: "MAKSYMALNA OSZCZĘDNOŚĆ" }),
    ]);
    expect(pkgs.map((p) => p.badge)).toEqual([
      "BESTSELLER",
      "NAJLEPSZA CENA",
      "MAKSYMALNA OSZCZĘDNOŚĆ",
    ]);
  });

  it("default selection does not by itself create a badge", () => {
    const [p] = mapOfferBundlesToPackages([bundle({ isDefault: true, badge: null })]);
    expect(p.defaultSelected).toBe(true);
    expect(p.badge).toBeUndefined();
  });

  it("missing required mapping → mappingValid false", () => {
    const [p] = mapOfferBundlesToPackages([bundle({ bundleMode: "VARIATION", wooVariationId: null })]);
    expect(p.mappingValid).toBe(false);
  });
});
