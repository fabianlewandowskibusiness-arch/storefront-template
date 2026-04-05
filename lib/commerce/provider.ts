import type { StorefrontConfig } from "@/types/storefront";
import type { CommerceProvider } from "./types";
import { createWooCommerceProvider } from "./woocommerce";

export function createCommerceProvider(config: StorefrontConfig): CommerceProvider | null {
  const { commerce } = config;

  if (commerce.provider === "woocommerce" && commerce.woocommerce) {
    return createWooCommerceProvider({
      storeUrl: commerce.woocommerce.storeUrl,
      productId: commerce.woocommerce.productId,
      variationId: commerce.woocommerce.variationId,
      productUrl: commerce.woocommerce.productUrl,
      checkoutMode: commerce.woocommerce.checkoutMode,
    });
  }

  return null;
}
