import type { StorefrontConfig, StorefrontPage } from "@/types/storefront";

export function resolveHomePage(config: StorefrontConfig): StorefrontPage {
  const home = config.pages.find((p) => p.type === "HOME");
  if (!home) {
    throw new Error("No HOME page found in storefront config");
  }
  return home;
}
