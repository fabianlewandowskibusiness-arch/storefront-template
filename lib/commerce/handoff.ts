import type { CartHandoffLine, CartHandoffTarget } from "@/lib/commerce/types";
import type { CartItem } from "@/lib/stores/uiStore";

/**
 * Pure helpers for building the cart-handoff POST body. Kept free of any client
 * (zustand / React) imports so they are trivially unit-testable.
 */

/**
 * The cart drawer / hero "Kup teraz" flow always hands off with the CHECKOUT
 * target so the buyer goes straight to checkout (the configured custom checkout
 * URL when set), never the cart page — regardless of the configured checkoutMode.
 */
export const CHECKOUT_TARGET: CartHandoffTarget = "CHECKOUT";

/** Maps Zustand cart items to handoff lines (productId, variationId, quantity). */
export function toHandoffLines(items: CartItem[]): CartHandoffLine[] {
  return items.map((item) => ({
    productId: item.productId,
    variationId: item.variantId,
    quantity: item.quantity,
  }));
}
