export interface CommerceProvider {
  getCheckoutUrl(options?: { quantity?: number }): string;
  getAddToCartUrl(options?: { quantity?: number }): string;
}

export interface WooCommerceConfig {
  storeUrl: string | null;
  productId: string | null;
  variationId?: string | null;
  productUrl?: string;
  // checkoutMode is always a string after schema .catch() coercion.
  checkoutMode: string;
}

// ── Cart handoff bridge types ─────────────────────────────────────────────────

/** Where to land on WooCommerce after handoff. Mirrors the backend enum. */
export type CartHandoffTarget = "CART" | "CHECKOUT";

/** A single line in a cart handoff POST body. */
export interface CartHandoffLine {
  /** Client-side product identifier from the Zustand cart (optional). */
  productId?: string;
  /** Client-side variation identifier (optional). */
  variationId?: string;
  /** Quantity for this line. Must be ≥ 1. */
  quantity: number;
}

/** POST body sent to {@code /api/storefront-runtime/{storeId}/commerce/handoff}. */
export interface CartHandoffRequest {
  lines: CartHandoffLine[];
  /** Optional target hint. Backend derives a default from checkoutMode when null. */
  target?: CartHandoffTarget;
}

/** Successful response from the cart handoff endpoint. */
export interface CartHandoffResponse {
  /**
   * Fully-qualified WooCommerce URL to redirect the buyer to.
   * Primary field — returned by backend since plugin v1.1.0.
   */
  checkoutUrl: string;
  /**
   * @deprecated Backward-compatibility alias for {@link checkoutUrl}.
   * Returned by plugin < v1.1.0. Prefer `checkoutUrl` — this field will
   * be removed once all deployed plugins are upgraded.
   */
  redirectUrl?: string;
  /** Non-fatal informational warnings. */
  warnings: string[];
  /** Human-readable cart summary (for debugging). */
  cartSummary: string;
}
