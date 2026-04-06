import type { CommerceProvider, WooCommerceConfig } from "./types";

export function createWooCommerceProvider(config: WooCommerceConfig): CommerceProvider {
  const { storeUrl, productId, variationId, productUrl, checkoutMode } = config;
  const baseUrl = storeUrl.replace(/\/$/, "");

  function getAddToCartUrl(options?: { quantity?: number }): string {
    const qty = options?.quantity ?? 1;
    const params = new URLSearchParams({
      "add-to-cart": productId,
      quantity: String(qty),
    });
    if (variationId) {
      params.set("variation_id", variationId);
    }
    return `${baseUrl}/?${params.toString()}`;
  }

  function getCheckoutUrl(options?: { quantity?: number }): string {
    if (checkoutMode === "DIRECT_CHECKOUT") {
      const qty = options?.quantity ?? 1;
      const params = new URLSearchParams({
        "add-to-cart": productId,
        quantity: String(qty),
      });
      if (variationId) {
        params.set("variation_id", variationId);
      }
      return `${baseUrl}/checkout/?${params.toString()}`;
    }
    return productUrl || getAddToCartUrl(options);
  }

  return { getCheckoutUrl, getAddToCartUrl };
}
