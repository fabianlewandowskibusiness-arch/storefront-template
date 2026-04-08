export interface CommerceProvider {
  getCheckoutUrl(options?: { quantity?: number }): string;
  getAddToCartUrl(options?: { quantity?: number }): string;
}

export interface WooCommerceConfig {
  storeUrl: string | null;
  productId: string | null;
  variationId?: string | null;
  productUrl?: string;
  checkoutMode: string | null;
}
