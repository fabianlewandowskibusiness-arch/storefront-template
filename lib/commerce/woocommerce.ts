import type { CommerceProvider, WooCommerceConfig } from "./types";

export function createWooCommerceProvider(config: WooCommerceConfig): CommerceProvider {
  const { storeUrl, productId, variationId, productUrl, checkoutMode } = config;
  const baseUrl = storeUrl.replace(/\/$/, "");

  function getAddToCartUrl(options?: { quantity?: number }): string {
    const qty = options?.quantity ?? 1;
    const params = new URLSearchParams({
      "add-to-cart": String(productId),
      quantity: String(qty),
    });
    if (variationId) {
      params.set("variation_id", String(variationId));
    }
    return `${baseUrl}/?${params.toString()}`;
  }

  function getCheckoutUrl(options?: { quantity?: number }): string {
    if (checkoutMode === "direct_checkout") {
      const qty = options?.quantity ?? 1;
      const params = new URLSearchParams({
        "add-to-cart": String(productId),
        quantity: String(qty),
      });
      if (variationId) {
        params.set("variation_id", String(variationId));
      }
      return `${baseUrl}/checkout/?${params.toString()}`;
    }
    // add_to_cart_redirect — add to cart, WooCommerce handles redirect
    return productUrl || getAddToCartUrl(options);
  }

  return { getCheckoutUrl, getAddToCartUrl };
}
