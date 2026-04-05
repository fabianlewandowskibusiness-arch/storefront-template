export interface CommerceProvider {
  getCheckoutUrl(options?: { quantity?: number }): string;
  getAddToCartUrl(options?: { quantity?: number }): string;
}

export interface WooCommerceConfig {
  storeUrl: string;
  productId: number;
  variationId?: number | null;
  productUrl?: string;
  checkoutMode: "add_to_cart_redirect" | "direct_checkout";
}
