import type { HeroPackage, OfferBundle } from "@/types/storefront";

/**
 * Offer bundles (commerce.offerBundles) → hero purchase selector.
 *
 * These bundles are the commerce-level source of truth: each carries its own
 * WooCommerce mapping so the charged price matches the displayed price. This is
 * preferred over the legacy hero `section.data.packages` whenever present.
 */

/** True when the bundle has the WooCommerce mapping its mode requires. */
export function bundleMappingValid(b: OfferBundle): boolean {
  if (b.bundleMode === "VARIATION") {
    return !!b.wooProductId && !!b.wooVariationId;
  }
  // SEPARATE_PRODUCT and QUANTITY need only the product id.
  return !!b.wooProductId;
}

/**
 * Maps offer bundles to {@link HeroPackage}s.
 *
 * Money is converted from integer minor units to major units (÷100) for display
 * only — no price arithmetic is done. The per-bundle mapping is carried through
 * verbatim and the global product/variation is NEVER inherited here: for a
 * non-VARIATION bundle the variationId is left undefined so a separate product
 * cannot pick up the global variation at handoff.
 */
export function mapOfferBundlesToPackages(bundles: OfferBundle[]): HeroPackage[] {
  return bundles.map((b) => {
    const isVariation = b.bundleMode === "VARIATION";
    return {
      id: b.id,
      label: b.label,
      quantity: b.quantity || undefined,
      price: (b.price ?? 0) / 100,
      comparePrice: b.compareAtPrice != null ? b.compareAtPrice / 100 : undefined,
      savings: b.savingsLabel || undefined,
      // Ribbon only when the badge explicitly says BESTSELLER — NOT for the default.
      isBestseller: (b.badge ?? "").toUpperCase() === "BESTSELLER",
      // Drives the initial selection independently of the bestseller ribbon.
      defaultSelected: b.isDefault,
      badge: b.badge || undefined,
      // Per-bundle mapping only — never fall back to the global product/variation.
      productId: b.wooProductId || undefined,
      variationId: isVariation ? b.wooVariationId || undefined : undefined,
      mappingValid: bundleMappingValid(b),
      bundleMode: b.bundleMode,
    };
  });
}
