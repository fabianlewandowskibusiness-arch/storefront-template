import { describe, it, expect } from "vitest";
import { mapOfferBundlesToPackages } from "@/lib/storefront/offerBundles";
import { toHandoffLines, CHECKOUT_TARGET } from "@/lib/commerce/handoff";
import type { OfferBundle, HeroPackage } from "@/types/storefront";
import type { CartItem } from "@/lib/stores/uiStore";
import type { CartHandoffRequest } from "@/lib/commerce/types";

// Mirrors HeroSection.handleCtaClick → addToCart for the commerce-bundle path:
// the selected package's productId/variationId/quantity flow into the cart line.
function cartItemFromPackage(pkg: HeroPackage, currency = "PLN"): CartItem {
  return {
    id: pkg.id,
    productId: pkg.productId,
    variantId: pkg.variationId,
    name: `Produkt · ${pkg.label}`,
    price: pkg.price,
    comparePrice: pkg.comparePrice,
    currency,
    quantity: pkg.quantity ?? 1,
  };
}

// The two VARIATION bundles from the manual verification scenario.
const BUNDLES: OfferBundle[] = [
  {
    id: "1+1", label: "1+1", quantity: 2, price: 54900, currency: "PLN",
    compareAtPrice: null, savingsLabel: null, badge: "BESTSELLER",
    isDefault: true, visible: true, bundleMode: "VARIATION",
    wooProductId: "7254", wooVariationId: "7255",
  },
  {
    id: "2+1", label: "2+1", quantity: 3, price: 84900, currency: "PLN",
    compareAtPrice: null, savingsLabel: null, badge: null,
    isDefault: false, visible: true, bundleMode: "VARIATION",
    wooProductId: "7254", wooVariationId: "7256",
  },
];

describe("bundle → cart handoff", () => {
  it("selected VARIATION bundle handoff includes productId, variationId, quantity + CHECKOUT target", () => {
    const packages = mapOfferBundlesToPackages(BUNDLES);
    const selected = packages.find((p) => p.id === "1+1")!;

    const body: CartHandoffRequest = {
      lines: toHandoffLines([cartItemFromPackage(selected)]),
      target: CHECKOUT_TARGET,
    };

    expect(body.target).toBe("CHECKOUT");
    expect(body.lines).toHaveLength(1);
    expect(body.lines[0]).toEqual({ productId: "7254", variationId: "7255", quantity: 2 });
  });

  it("changing the selected bundle changes the handoff line, still CHECKOUT", () => {
    const packages = mapOfferBundlesToPackages(BUNDLES);
    const selected = packages.find((p) => p.id === "2+1")!;

    const body: CartHandoffRequest = {
      lines: toHandoffLines([cartItemFromPackage(selected)]),
      target: CHECKOUT_TARGET,
    };

    expect(body.target).toBe("CHECKOUT");
    expect(body.lines[0]).toEqual({ productId: "7254", variationId: "7256", quantity: 3 });
  });

  it("SEPARATE_PRODUCT bundle sends its product with no variation, preserving quantity", () => {
    const [pkg] = mapOfferBundlesToPackages([
      {
        id: "sep", label: "Zestaw", quantity: 2, price: 9900, currency: "PLN",
        compareAtPrice: null, savingsLabel: null, badge: null,
        isDefault: true, visible: true, bundleMode: "SEPARATE_PRODUCT",
        wooProductId: "999", wooVariationId: null,
      },
    ]);

    const lines = toHandoffLines([cartItemFromPackage(pkg)]);
    expect(lines[0]).toEqual({ productId: "999", variationId: undefined, quantity: 2 });
  });

  it("the cart drawer / hero checkout flow uses the CHECKOUT target", () => {
    expect(CHECKOUT_TARGET).toBe("CHECKOUT");
  });
});
