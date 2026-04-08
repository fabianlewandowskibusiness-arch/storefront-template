import type { CommerceConfig } from "@/types/storefront";
import type { CommerceProvider } from "./types";
import { createWooCommerceProvider } from "./woocommerce";

export function createCommerceProvider(commerce: CommerceConfig | null | undefined): CommerceProvider | null {
  if (!commerce) return null;
  if (commerce.provider === "woocommerce") {
    return createWooCommerceProvider({
      storeUrl: commerce.storeUrl,
      productId: commerce.productId,
      variationId: commerce.variationId,
      productUrl: commerce.productUrl,
      checkoutMode: commerce.checkoutMode,
    });
  }

  return null;
}
